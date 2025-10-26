import { NextResponse } from 'next/server';
import { withAdminAuth } from '../../../../../lib/middleware/auth.js';
import { getSubmissionStats } from '../../../../../lib/controllers/userSubmittedItemController.js';

async function handler(request) {
  try {
    const result = await getSubmissionStats();
    
    if (!result.success) {
      return NextResponse.json(
        { success: result.success, message: result.message },
        { status: result.status || 500 }
      );
    }
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Submission stats API error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const GET = withAdminAuth(handler);
