import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb.js';
import PastPaper from '@/lib/models/PastPaper.js';
import Category from '@/lib/models/Category.js';
import { sanitizeSubject, sanitizeInt } from '@/lib/utils/security.js';
import { normalizeCategoryName } from '@/lib/utils/categoryUtils.js';

/**
 * GET - Fetch past papers from PastPaper collection by commission, department, role, and subcategory path
 * URL: /api/pastpapers/by-category/[commission]/[department]/[role]/[...subcategory]
 * 
 * Note: Past papers are stored in the PastPaper collection with category information
 * that maps to commission/department/role/subcategory structure. Categories are stored with
 * normalized names based on the full path (e.g., /past-papers/commission/dept/role/subcategory)
 */
export async function GET(request, { params }) {
  try {
    await connectToDatabase();

    // In Next.js 15+, params is a Promise and must be awaited
    const resolvedParams = await params;

    // Normalize parameters using normalizeCategoryName to match database format
    // This ensures trailing dashes and other formatting matches how categories are stored
    const commission = normalizeCategoryName(resolvedParams.commission || '');
    const department = normalizeCategoryName(resolvedParams.department || '');
    const role = normalizeCategoryName(resolvedParams.role || '');
    
    // subcategory is an array from catch-all route
    // Handle empty strings and filter them out
    const subcategoryArray = Array.isArray(resolvedParams.subcategory) 
      ? resolvedParams.subcategory.filter(s => s && s.trim() !== '')
      : (resolvedParams.subcategory && resolvedParams.subcategory.trim() !== '' ? [resolvedParams.subcategory] : []);
    
    const subcategoryPath = subcategoryArray.map(s => normalizeCategoryName(s || '')).filter(Boolean);

    if (!commission || !department || !role) {
      return NextResponse.json(
        { results: [], total: 0, page: 1, totalPages: 0 },
        { status: 200 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = sanitizeInt(searchParams.get('page'), 1, 1000, 1);
    const limit = sanitizeInt(searchParams.get('limit'), 1, 100, 10);
    const skip = (page - 1) * limit;

    // Build the full category path from commission/department/role/subcategory
    // Categories are stored with the full path including slashes (e.g., /past-papers/commission/dept/role/subcat)
    const categoryPath = subcategoryPath.length > 0
      ? `/past-papers/${commission}/${department}/${role}/${subcategoryPath.join('/')}`
      : `/past-papers/${commission}/${department}/${role}`;
    
    // Escape special regex characters in the path for regex search
    const escapedPath = categoryPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    // Also try without trailing slash if present
    const categoryPathNoTrailing = categoryPath.replace(/\/$/, '');
    const escapedPathNoTrailing = categoryPathNoTrailing.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    // Build parent path for fallback search
    const parentPath = `/past-papers/${commission}/${department}/${role}`;
    const escapedParentPath = parentPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    // Combine all search patterns into a single query using $or for better performance
    // This reduces multiple sequential database calls to just one
    const searchConditions = [
      { name: new RegExp(`^${escapedPath}$`, 'i') }, // Exact match
      { name: new RegExp(`^${escapedPathNoTrailing}$`, 'i') }, // Exact match without trailing slash
      { name: new RegExp(`^${escapedPath}/`, 'i') },  // Starts with path followed by slash (nested subcategories)
      { name: new RegExp(`^${escapedPathNoTrailing}/`, 'i') }  // Starts with path (no trailing) followed by slash
    ];
    
    // If we have subcategories, also include parent path search in the same query
    if (subcategoryPath.length > 0) {
      searchConditions.push({ name: new RegExp(`^${escapedParentPath}/`, 'i') });
    }
    
    // Execute single combined query
    // Look for categories with type 'PastPaper' or 'MCQ' (for backward compatibility)
    const matchingCategoriesRaw = await Category.find({
      type: { $in: ['PastPaper', 'MCQ'] },
      $or: searchConditions
    }).lean();
    
    // Deduplicate results by _id (in case multiple patterns match the same category)
    const matchingCategoriesMap = new Map();
    matchingCategoriesRaw.forEach(cat => {
      matchingCategoriesMap.set(cat._id.toString(), cat);
    });
    const matchingCategories = Array.from(matchingCategoriesMap.values());
    
    // If still no matches, try a broader search - find any category that contains the key parts
    if (matchingCategories.length === 0) {
      // Build search terms from the path components (already normalized above)
      const searchTerms = [
        commission,
        department,
        role,
        ...subcategoryPath
      ].filter(Boolean);
      
      // Find categories that contain all search terms
      const broaderMatches = await Category.find({
        type: { $in: ['PastPaper', 'MCQ'] },
        $and: searchTerms.map(term => ({
          name: { $regex: new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') }
        }))
      }).lean();
      
      matchingCategories.push(...broaderMatches);
    }

    if (!matchingCategories || matchingCategories.length === 0) {
      return NextResponse.json({
        results: [],
        total: 0,
        page,
        totalPages: 0
      }, {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300'
        }
      });
    }

    // Get category IDs
    const categoryIds = matchingCategories.map(cat => cat._id);

    // Get all Past Papers for these categories (the specific subcategory and its nested subcategories)
    // Now fetching from PastPaper collection instead of MCQ collection
    const allPastPapers = await PastPaper.find({
      categoryId: { $in: categoryIds }
    }).lean();

    const filteredPastPapers = allPastPapers; // All past papers from the subcategory and its nested subcategories

    // Apply pagination
    const total = filteredPastPapers.length;
    const paginatedPastPapers = filteredPastPapers
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .slice(skip, skip + limit);

    // Convert ObjectIds to strings and ensure year/department are included
    const results = paginatedPastPapers.map(pp => ({
      ...pp,
      _id: pp._id.toString(),
      categoryId: pp.categoryId?.toString() || null,
      subcategoryId: pp.subcategoryId?.toString() || null,
      submittedBy: pp.submittedBy?.toString() || null,
      year: pp.year || null,
      department: pp.department || department || 'General'  // Use department from URL if not in past paper
    }));

    return NextResponse.json({
      results,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300'
      }
    });
  } catch (error) {
    console.error('Error fetching past papers by category:', error);
    return NextResponse.json(
      { 
        message: 'Error fetching past papers',
        error: error.message
      },
      { status: 500 }
    );
  }
}

