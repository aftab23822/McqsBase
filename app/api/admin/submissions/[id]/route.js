import { NextResponse } from 'next/server';
import { withAdminAuth } from '../../../../../lib/middleware/auth.js';
import { getSubmissionById, updateSubmissionStatus, updateSubmissionContent } from '../../../../../lib/controllers/userSubmittedItemController.js';

async function getHandler(request, { params }) {
  try {
    // In Next.js 15+, params is a Promise and must be awaited
    const resolvedParams = await params;
    const result = await getSubmissionById(resolvedParams.id);
    
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
    // In Next.js 15+, params is a Promise and must be awaited
    const resolvedParams = await params;
    const body = await request.json();
    
    // Check if this is a content update (has question, answer, etc.) or status update (has status)
    const isContentUpdate = body.question !== undefined || 
                            body.answer !== undefined || 
                            body.correct_option !== undefined ||
                            body.correctAnswer !== undefined ||
                            body.options !== undefined ||
                            body.explanation !== undefined ||
                            body.detail_link !== undefined;
    
    // If it's a content update, use updateSubmissionContent
    // Otherwise, use updateSubmissionStatus (for approve/reject actions)
    const result = isContentUpdate 
      ? await updateSubmissionContent(resolvedParams.id, body)
      : await updateSubmissionStatus(resolvedParams.id, body);
    
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
