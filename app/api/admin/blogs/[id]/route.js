import { NextResponse } from 'next/server';
import { withAdminAuth } from '../../../../../lib/middleware/auth.js';
import { deleteBlog, updateBlog } from '../../../../../lib/services/blogService.js';

async function putHandler(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const blog = await updateBlog(id, body, request.user?.userId);
    if (!blog) {
      return NextResponse.json({ success: false, message: 'Blog not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: 'Blog updated successfully', data: blog });
  } catch (error) {
    console.error('Admin blog update error:', error);
    const message = error.code === 11000
      ? 'A blog with this SEO URI already exists'
      : error.message || 'Failed to update blog';
    return NextResponse.json({ success: false, message }, { status: error.name === 'ValidationError' || error.code === 11000 ? 400 : 500 });
  }
}

async function deleteHandler(request, { params }) {
  try {
    const { id } = await params;
    const blog = await deleteBlog(id);
    if (!blog) {
      return NextResponse.json({ success: false, message: 'Blog not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: 'Blog deleted successfully' });
  } catch (error) {
    console.error('Admin blog delete error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}

export const PUT = withAdminAuth(putHandler);
export const DELETE = withAdminAuth(deleteHandler);
