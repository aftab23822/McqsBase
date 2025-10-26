import { NextResponse } from 'next/server';
import { withAdminAuth } from '../../../../lib/middleware/auth.js';
import { getUploadStats } from '../../../../lib/controllers/adminController.js';

async function handler(request) {
  try {
    const result = await getUploadStats();
    
    if (!result.success) {
      return NextResponse.json(
        { success: result.success, message: result.message },
        { status: result.status || 500 }
      );
    }
    
    return NextResponse.json(result.data);
  } catch (error) {
    console.error('Admin stats API error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const GET = withAdminAuth(handler);
