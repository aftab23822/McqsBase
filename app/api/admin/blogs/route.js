import { NextResponse } from 'next/server';
import { withAdminAuth } from '../../../../lib/middleware/auth.js';
import { createBlog, listAdminBlogs } from '../../../../lib/services/blogService.js';
import { sanitizeInt, sanitizeString } from '../../../../lib/utils/security.js';

async function getHandler(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = sanitizeInt(searchParams.get('page'), 1, 1000, 1);
    const limit = sanitizeInt(searchParams.get('limit'), 1, 100, 20);
    const status = sanitizeString(searchParams.get('status') || '', 20);
    const search = sanitizeString(searchParams.get('search') || '', 120);

    const result = await listAdminBlogs({ page, limit, status, search });
    return NextResponse.json({ success: true, data: result.blogs, pagination: result.pagination });
  } catch (error) {
    console.error('Admin blogs fetch error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}

async function postHandler(request) {
  try {
    const body = await request.json();
    const blog = await createBlog(body, request.user?.userId);
    return NextResponse.json({ success: true, message: 'Blog saved successfully', data: blog }, { status: 201 });
  } catch (error) {
    console.error('Admin blog create error:', error);
    const message = error.code === 11000
      ? 'A blog with this SEO URI already exists'
      : error.message || 'Failed to save blog';
    return NextResponse.json({ success: false, message }, { status: error.name === 'ValidationError' || error.code === 11000 ? 400 : 500 });
  }
}

export const GET = withAdminAuth(getHandler);
export const POST = withAdminAuth(postHandler);
