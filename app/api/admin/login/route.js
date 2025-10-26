import { NextResponse } from 'next/server';
import { loginAdmin } from '../../../../lib/controllers/authController.js';

export async function POST(request) {
  try {
    const body = await request.json();
    const result = await loginAdmin(body);
    
    if (!result.success) {
      return NextResponse.json(
        { success: result.success, message: result.message },
        { status: result.status || 400 }
      );
    }
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Admin login API error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
