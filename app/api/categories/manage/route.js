/**
 * Legacy category manage route — same data as /api/categories/structure (DB-backed).
 */

import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb.js';
import {
  getMergedCategoryData,
  applyPostMutationAndSave,
  CATEGORY_STRUCTURE_TYPES,
} from '@/lib/services/categoryStructureService.js';
import '@/lib/models/CategoryStructureConfig.js';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    if (!type) {
      return NextResponse.json({ error: 'Type parameter is required' }, { status: 400 });
    }

    if (!CATEGORY_STRUCTURE_TYPES.includes(type)) {
      return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 });
    }

    await connectToDatabase();
    const data = await getMergedCategoryData(type);

    return NextResponse.json({
      success: true,
      type,
      data,
    });
  } catch (error) {
    console.error('Error in GET /api/categories/manage:', error);
    return NextResponse.json(
      { error: 'Failed to load category data', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { type, action, data } = body;

    if (!type || !action || !data) {
      return NextResponse.json({ error: 'Type, action, and data are required' }, { status: 400 });
    }

    if (!CATEGORY_STRUCTURE_TYPES.includes(type)) {
      return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 });
    }

    await connectToDatabase();

    try {
      await applyPostMutationAndSave(type, action, data);
    } catch (mutationError) {
      return NextResponse.json(
        { error: mutationError.message || 'Update failed' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Category structure updated successfully',
    });
  } catch (error) {
    console.error('Error in POST /api/categories/manage:', error);
    return NextResponse.json(
      { error: 'Failed to update category data', details: error.message },
      { status: 500 }
    );
  }
}
