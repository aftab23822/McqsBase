import { NextResponse } from 'next/server';
import { withAdminAuth } from '../../../../../lib/middleware/auth.js';
import { getSubmissionById, updateSubmissionStatus } from '../../../../../lib/controllers/userSubmittedItemController.js';

async function getHandler(request, { params }) {
  try {
    const result = await getSubmissionById(params.id);
    
    if (!result.success) {
      return NextResponse.json(
        { success: result.success, message: result.message },
        { status: result.status || 404 }
      );
    }
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Get submission API error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function putHandler(request, { params }) {
  try {
    const body = await request.json();
    const result = await updateSubmissionStatus(params.id, body);
    
    if (!result.success) {
      return NextResponse.json(
        { success: result.success, message: result.message },
        { status: result.status || 400 }
      );
    }
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Update submission API error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const GET = withAdminAuth(getHandler);
export const PUT = withAdminAuth(putHandler);
