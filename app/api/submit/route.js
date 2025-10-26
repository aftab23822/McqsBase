import { NextResponse } from 'next/server';
import { submitItem } from '../../../lib/controllers/userSubmittedItemController.js';

export async function POST(request) {
  try {
    const body = await request.json();
    const result = await submitItem(body);
    
    if (!result.success) {
      return NextResponse.json(
        { success: result.success, message: result.message },
        { status: result.status || 400 }
      );
    }
    
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Submit item API error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
