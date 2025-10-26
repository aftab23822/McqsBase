import { NextResponse } from 'next/server';
import { withAdminAuth } from '../../../../lib/middleware/auth.js';
import { getAdminProfile } from '../../../../lib/controllers/authController.js';

async function handler(request) {
  try {
    const result = await getAdminProfile(request.user.userId);
    
    if (!result.success) {
      return NextResponse.json(
        { success: result.success, message: result.message },
        { status: result.status || 400 }
      );
    }
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Admin profile API error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const GET = withAdminAuth(handler);
