import { NextResponse } from 'next/server';
import { withAdminAuth } from '../../../../lib/middleware/auth.js';
import { changeAdminPassword } from '../../../../lib/controllers/authController.js';

async function handler(request) {
  try {
    const body = await request.json();
    const result = await changeAdminPassword(request.user.userId, body);
    
    if (!result.success) {
      return NextResponse.json(
        { success: result.success, message: result.message },
        { status: result.status || 400 }
      );
    }
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Change password API error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const POST = withAdminAuth(handler);
