import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb.js';
import MCQ from '@/lib/models/MCQ.js';
import Category from '@/lib/models/Category.js';
import { sanitizeSubject, sanitizeInt } from '@/lib/utils/security.js';
import { normalizeCategoryName } from '@/lib/utils/categoryUtils.js';

/**
 * GET - Fetch past papers (stored as MCQs) by commission, department, and role
 * URL: /api/pastpapers/by-category/[commission]/[department]/[role]
 * 
 * Note: Past papers are stored in the MCQ collection with category information
 * that maps to commission/department/role structure. Categories are stored with
 * normalized names based on the full path (e.g., /past-papers/commission/dept/role/subcategory)
 */
export async function GET(request, { params }) {
  try {
    await connectToDatabase();

    // Sanitize parameters
    const commission = sanitizeSubject(params.commission);
    const department = sanitizeSubject(params.department);
    const role = sanitizeSubject(params.role);

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
    
    // Try multiple patterns to find matching categories:
    // 1. Exact match
    // 2. Starts with the normalized path followed by a hyphen (for subcategories)
    // 3. The normalized path is a prefix
    const patterns = [
      new RegExp(`^${escapedName}$`, 'i'), // Exact match
      new RegExp(`^${escapedName}-`, 'i'), // Starts with path followed by hyphen (subcategories)
      new RegExp(`^${escapedName}/`, 'i')  // Starts with path followed by slash (if slashes weren't normalized)
    ];
    
    // Try each pattern and combine results
    const matchingCategoriesSet = new Map();
    for (const pattern of patterns) {
      const matches = await Category.find({
        name: pattern,
        type: 'MCQ'
      }).lean();
      matches.forEach(cat => {
        matchingCategoriesSet.set(cat._id.toString(), cat);
      });
    }
    
    const matchingCategories = Array.from(matchingCategoriesSet.values());
    
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

    // Get all MCQs for these categories (parent + all subcategories)
    const allMcqs = await MCQ.find({
      categoryId: { $in: categoryIds }
    }).lean();

    const filteredMcqs = allMcqs; // All MCQs from parent and subcategories

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

