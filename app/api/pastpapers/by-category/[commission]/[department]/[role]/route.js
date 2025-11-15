import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb.js';
import PastPaper from '@/lib/models/PastPaper.js';
import Category from '@/lib/models/Category.js';
import { sanitizeSubject, sanitizeInt } from '@/lib/utils/security.js';
import { normalizeCategoryName } from '@/lib/utils/categoryUtils.js';

/**
 * GET - Fetch past papers from PastPaper collection by commission, department, and role
 * URL: /api/pastpapers/by-category/[commission]/[department]/[role]
 * 
 * Note: Past papers are stored in the PastPaper collection with category information
 * that maps to commission/department/role structure. Categories are stored with
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

    // Build the full category path from commission/department/role
    // This matches how categories are created during batch upload
    const categoryPath = `/past-papers/${commission}/${department}/${role}`;
    
    // Normalize the category path the same way batch upload does
    const normalizedCategoryName = normalizeCategoryName(categoryPath);
    
    // Find categories that match exactly OR start with the normalized path
    // This includes the parent category and all its subcategories
    // For example, if normalizedCategoryName is "past-papers-sts-siba-testing-services-bps-05-to-15-intermediate-category"
    // it will also match "past-papers-sts-siba-testing-services-bps-05-to-15-intermediate-category-test-past-paper-26-06-2023"
    
    // Escape special regex characters in the normalized name
    const escapedName = normalizedCategoryName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    // Combine all search patterns into a single query using $or for better performance
    // This reduces multiple sequential database calls to just one
    const searchConditions = [
      { name: new RegExp(`^${escapedName}$`, 'i') }, // Exact match
      { name: new RegExp(`^${escapedName}-`, 'i') }, // Starts with path followed by hyphen (subcategories)
      { name: new RegExp(`^${escapedName}/`, 'i') }  // Starts with path followed by slash (if slashes weren't normalized)
    ];
    
    // Also try searching with the full path format (with slashes) as categories might be stored that way
    const categoryPathEscaped = categoryPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    searchConditions.push(
      { name: new RegExp(`^${categoryPathEscaped}$`, 'i') }, // Exact match with slashes
      { name: new RegExp(`^${categoryPathEscaped}/`, 'i') }  // Starts with path followed by slash
    );
    
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
    let matchingCategories = Array.from(matchingCategoriesMap.values());
    
    // Check if we should exclude subcategories (exact match only)
    const excludeSubcategories = searchParams.get('exact') === 'true';
    
    if (excludeSubcategories && matchingCategories.length > 0) {
      // Filter to only exact matches (no subcategories)
      const exactMatches = matchingCategories.filter(cat => {
        const catName = cat.name.toLowerCase();
        const exactPath = categoryPath.toLowerCase();
        const exactNormalized = normalizedCategoryName.toLowerCase();
        // Check if it's an exact match (not a subcategory)
        return catName === exactPath || catName === exactNormalized ||
               catName === exactPath.replace(/\/$/, '') || catName === exactNormalized.replace(/\/$/, '');
      });
      
      if (exactMatches.length > 0) {
        matchingCategories = exactMatches;
      }
    }
    
    // If no exact matches, try a broader search - find any category that contains the key parts
    if (matchingCategories.length === 0) {
      // Build search terms from the path components
      const searchTerms = [
        normalizeCategoryName(commission),
        normalizeCategoryName(department),
        normalizeCategoryName(role)
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

    // Get all Past Papers for these categories (parent + all subcategories)
    // Search for past papers by both categoryId and subcategoryId
    // Past papers can be linked to either the category or its subcategories
    const allPastPapers = await PastPaper.find({
      $or: [
        { categoryId: { $in: categoryIds } },
        { subcategoryId: { $in: categoryIds } }
      ]
    }).lean();

    const filteredPastPapers = allPastPapers; // All past papers from parent and subcategories

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

