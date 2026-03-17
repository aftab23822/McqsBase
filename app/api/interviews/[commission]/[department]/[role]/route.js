import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb.js';
import PastInterview from '@/lib/models/PastInterview.js';
import { sanitizeSubject, sanitizeString, sanitizeInt, escapeRegex } from '@/lib/utils/security.js';
import { normalizeDepartmentName, normalizeRoleName } from '@/lib/utils/slugUtils.js';
import Category from '@/lib/models/Category.js';

/**
 * GET - Fetch past interviews by commission, department, and role
 * URL: /api/interviews/[commission]/[department]/[role]
 */
export async function GET(request, { params }) {
  try {
    await connectToDatabase();

    // In Next.js 15+, params is a Promise and must be awaited
    const resolvedParams = await params;

    // Sanitize parameters
    const commission = sanitizeSubject(resolvedParams.commission);
    const department = sanitizeSubject(resolvedParams.department);
    const role = sanitizeSubject(resolvedParams.role);

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

    // Resolve commission -> Category so we can restrict by categoryId
    let category = await Category.findOne({
      name: commission,
      type: 'Interview',
    });

    if (!category) {
      // Fallback: match by slugified name
      const allInterviewCategories = await Category.find({ type: 'Interview' }).lean();
      const slugifyName = (name) =>
        (name || '')
          .toLowerCase()
          .replace(/^[^\w\s]+/, '')
          .trim()
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-+|-+$/g, '');

      const commissionSlug = slugifyName(commission);
      category = allInterviewCategories.find((c) => slugifyName(c.name) === commissionSlug);
    }

    if (!category) {
      return NextResponse.json(
        {
          results: [],
          total: 0,
          page,
          totalPages: 0,
        },
        {
          headers: {
            'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
          },
        }
      );
    }

    // Get all interviews for this commission and filter in memory by role/department
    const allInterviews = await PastInterview.find({
      categoryId: category._id,
    }).lean();

    console.log(`📊 Found ${allInterviews.length} interviews for commission "${commission}"`);
    
    // Normalize interview docs so frontend always has interviewTitle/description
    const normalizedInterviews = allInterviews.map((interview) => {
      const title =
        interview.interviewTitle ||
        interview.title ||
        interview.question ||
        '';
      const desc =
        interview.description ||
        interview.answer ||
        interview.explanation ||
        '';

      return {
        ...interview,
        interviewTitle: title,
        description: desc,
      };
    });

    const roleIsAll = role === 'all';

    let filteredInterviews;

    if (roleIsAll) {
      // Department-level listing for a role: URL pattern is
      // /past-interviews/[commission]/[department]/all
      // where [department] is actually the role slug (e.g. "junior-clerk").
      filteredInterviews = normalizedInterviews.filter((interview) => {
        const roleSlug = interview.position ? normalizeRoleName(interview.position) : '';

        const isMatch =
          roleSlug === department ||
          roleSlug.includes(department) ||
          department.includes(roleSlug);

        return isMatch;
      });
    } else {
      // Role-level listing: match by position only
      filteredInterviews = normalizedInterviews.filter(interview => {
        // Match position (role) - generate slug from stored position name
        const posSlug = interview.position ? normalizeRoleName(interview.position) : '';
        
        // Flexible matching: Handle BPS formatting differences (with/without dashes)
        // e.g., URL: "junior-clerk-bps-11" vs DB: "junior-clerk-bps11"
        // Normalize both by removing hyphens around numbers for comparison
        const normalizeForMatch = (slug) => {
          if (!slug) return '';
          // Replace patterns like "bps-11", "bps11", "bps-17" etc. with "bps11", "bps17"
          return slug.replace(/bps-(\d+)/gi, 'bps$1').replace(/bps(\d+)/gi, 'bps$1');
        };
        
        const normalizedPosSlug = normalizeForMatch(posSlug);
        const normalizedRole = normalizeForMatch(role);

        const posMatch =
          posSlug === role ||
          normalizedPosSlug === normalizedRole ||
          posSlug.includes(role) ||
          role.includes(posSlug);

        return posMatch;
      });
    }

    console.log(`🎯 Filtered to ${filteredInterviews.length} interviews matching department="${department}" and role="${role}"`);

    // Apply pagination
    const total = filteredInterviews.length;
    const paginatedInterviews = filteredInterviews
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .slice(skip, skip + limit);

    // Convert ObjectIds to strings
    const results = paginatedInterviews.map(interview => ({
      ...interview,
      _id: interview._id.toString(),
      categoryId: interview.categoryId?.toString() || null,
      subcategoryId: interview.subcategoryId?.toString() || null
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
    console.error('Error fetching past interviews by category:', error);
    return NextResponse.json(
      { 
        message: 'Error fetching past interviews',
        error: error.message 
      },
      { status: 500 }
    );
  }
}

