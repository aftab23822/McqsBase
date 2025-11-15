import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb.js';
import PastInterview from '@/lib/models/PastInterview.js';
import Category from '@/lib/models/Category.js';
import { sanitizeSubject, sanitizeString, sanitizeInt, escapeRegex } from '@/lib/utils/security.js';
import { generateSlug, normalizeDepartmentName, normalizeRoleName } from '@/lib/utils/slugUtils.js';

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

    // Find category by commission slug (category name matches commission slug)
    // Try exact match first, then try with normalization
    let category = await Category.findOne({
      name: commission,
      type: 'Interview'
    });

    // If not found, try finding all Interview categories to see what exists
    if (!category) {
      const allInterviewCategories = await Category.find({ type: 'Interview' }).lean();
      console.log('🔍 Looking for category:', commission);
      console.log('📋 Available Interview categories:', allInterviewCategories.map(c => c.name));
      
      // Try case-insensitive match
      category = allInterviewCategories.find(c => c.name.toLowerCase() === commission.toLowerCase());
    }

    if (!category) {
      console.log('❌ Category not found:', commission);
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

    console.log('✅ Found category:', category.name, 'ID:', category._id.toString());

    // Build filter: match category, and then match organization (department) and position (role) by slug
    // We need to match the slugified versions of organization and position
    const escapedDepartment = escapeRegex(department);
    const escapedRole = escapeRegex(role);

    // Get all interviews for this category first, then filter in memory
    // because MongoDB can't easily match slugified fields
    const allInterviews = await PastInterview.find({
      categoryId: category._id
    }).lean();

    console.log(`📊 Found ${allInterviews.length} interviews in category "${category.name}"`);
    
    // Debug: log first few interviews to see their structure
    if (allInterviews.length > 0) {
      console.log('🔍 Sample interview data:');
      allInterviews.slice(0, 3).forEach((interview, idx) => {
        console.log(`  Interview ${idx + 1}:`, {
          organization: interview.organization,
          position: interview.position,
          orgSlug: interview.organization ? normalizeDepartmentName(interview.organization) : '',
          posSlug: interview.position ? normalizeRoleName(interview.position) : ''
        });
      });
      console.log('🎯 Looking for:', {
        department: department,
        role: role
      });
    }

    // Filter interviews by matching slugified organization and position
    const filteredInterviews = allInterviews.filter(interview => {
      // Match organization (department) - generate slug from stored organization name
      const orgSlug = interview.organization ? normalizeDepartmentName(interview.organization) : '';
      
      // Flexible matching: URL slug might be a shortened version of the full department name
      // e.g., URL: "general-administration" vs DB: "general-administration-and-coordination-department"
      // Match if URL slug is contained in DB slug or vice versa
      const orgMatch = orgSlug === department || 
                       orgSlug.includes(department) || 
                       department.includes(orgSlug) ||
                       orgSlug.split('-').slice(0, 2).join('-') === department; // Match first 2 words

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
      
      const posMatch = posSlug === role || 
                       normalizedPosSlug === normalizedRole ||
                       posSlug.includes(role) || 
                       role.includes(posSlug);

      if (orgMatch && posMatch) {
        console.log('✅ Match found:', {
          organization: interview.organization,
          position: interview.position,
          orgSlug,
          posSlug,
          department,
          role
        });
      }

      return orgMatch && posMatch;
    });

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

