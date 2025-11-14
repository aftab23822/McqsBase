import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb.js';
import MCQ from '@/lib/models/MCQ.js';
import Category from '@/lib/models/Category.js';
import { sanitizeSubject, sanitizeInt } from '@/lib/utils/security.js';
import { normalizeCategoryName } from '@/lib/utils/categoryUtils.js';

/**
 * GET - Fetch past papers (stored as MCQs) by commission, department, role, and subcategory path
 * URL: /api/pastpapers/by-category/[commission]/[department]/[role]/[...subcategory]
 * 
 * Note: Past papers are stored in the MCQ collection with category information
 * that maps to commission/department/role/subcategory structure. Categories are stored with
 * normalized names based on the full path (e.g., /past-papers/commission/dept/role/subcategory)
 */
export async function GET(request, { params }) {
  try {
    await connectToDatabase();

    // Sanitize parameters
    const commission = sanitizeSubject(params.commission);
    const department = sanitizeSubject(params.department);
    const role = sanitizeSubject(params.role);
    
    // subcategory is an array from catch-all route
    const subcategoryArray = Array.isArray(params.subcategory) 
      ? params.subcategory 
      : (params.subcategory ? [params.subcategory] : []);
    
    const subcategoryPath = subcategoryArray.map(s => sanitizeSubject(s)).filter(Boolean);

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
    const matchingCategoriesRaw = await Category.find({
      type: 'MCQ',
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
      // Build search terms from the path components
      const searchTerms = [
        normalizeCategoryName(commission),
        normalizeCategoryName(department),
        normalizeCategoryName(role),
        ...subcategoryPath.map(s => normalizeCategoryName(s))
      ].filter(Boolean);
      
      // Find categories that contain all search terms
      const broaderMatches = await Category.find({
        type: 'MCQ',
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

    // Get all MCQs for these categories (the specific subcategory and its nested subcategories)
    const allMcqs = await MCQ.find({
      categoryId: { $in: categoryIds }
    }).lean();

    const filteredMcqs = allMcqs; // All MCQs from the subcategory and its nested subcategories

    // Apply pagination
    const total = filteredMcqs.length;
    const paginatedMcqs = filteredMcqs
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .slice(skip, skip + limit);

    // Convert ObjectIds to strings and ensure year/department are included
    const results = paginatedMcqs.map(mcq => ({
      ...mcq,
      _id: mcq._id.toString(),
      categoryId: mcq.categoryId?.toString() || null,
      subcategoryId: mcq.subcategoryId?.toString() || null,
      submittedBy: mcq.submittedBy?.toString() || null,
      year: mcq.year || null,
      department: mcq.department || department || 'General'  // Use department from URL if not in MCQ
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

