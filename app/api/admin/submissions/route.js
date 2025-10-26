import { NextResponse } from 'next/server';
import { withAdminAuth } from '../../../../lib/middleware/auth.js';
import { getAllSubmissions, getSubmissionStats } from '../../../../lib/controllers/userSubmittedItemController.js';

async function getHandler(request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = Object.fromEntries(searchParams);
    
    const result = await getAllSubmissions(query);
    
    if (!result.success) {
      return NextResponse.json(
        { success: result.success, message: result.message },
        { status: result.status || 500 }
      );
    }
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Get submissions API error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const GET = withAdminAuth(getHandler);
