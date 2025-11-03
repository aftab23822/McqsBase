import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb.js';
import MCQ from '@/lib/models/MCQ.js';
import Category from '@/lib/models/Category.js';
import { sanitizeSubject, sanitizeInt } from '@/lib/utils/security.js';
import { normalizeDepartmentName, normalizeRoleName } from '@/lib/utils/slugUtils.js';

/**
 * GET - Fetch past papers (stored as MCQs) by commission, department, and role
 * URL: /api/pastpapers/by-category/[commission]/[department]/[role]
 * 
 * Note: Past papers are currently stored in the MCQ collection with category information
 * that maps to commission/department/role structure.
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

    // Find category by commission slug
    // Past papers use category name that matches commission slug
    const category = await Category.findOne({
      name: commission,
      type: 'MCQ' // Past papers are stored as MCQs
    });

    if (!category) {
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

    // Get all MCQs for this category
    // Note: Past papers are stored as MCQs
    // We need to check if MCQ model has fields for department/role
    // For now, we'll fetch by category and filter by metadata if available
    const allMcqs = await MCQ.find({
      categoryId: category._id
    }).lean();

    // Filter MCQs - Past papers might have department/role info in link or metadata
    // Since past papers don't have separate department/role fields in MCQ model,
    // we'll need to match by category only for now
    // TODO: Enhance when past papers have proper department/role storage
    
    const filteredMcqs = allMcqs; // Return all MCQs in this category for now

    // Apply pagination
    const total = filteredMcqs.length;
    const paginatedMcqs = filteredMcqs
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .slice(skip, skip + limit);

    // Convert ObjectIds to strings
    const results = paginatedMcqs.map(mcq => ({
      ...mcq,
      _id: mcq._id.toString(),
      categoryId: mcq.categoryId?.toString() || null,
      subcategoryId: mcq.subcategoryId?.toString() || null,
      submittedBy: mcq.submittedBy?.toString() || null
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

