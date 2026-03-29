/**
 * Bulk save category structure (MongoDB; no filesystem writes — Vercel-safe).
 */

import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb.js';
import { saveBulkStructure, CATEGORY_STRUCTURE_TYPES } from '@/lib/services/categoryStructureService.js';
import '@/lib/models/CategoryStructureConfig.js';

export async function PUT(request) {
  try {
    const body = await request.json();
    const { type, structure } = body;

    if (!type || !structure) {
      return NextResponse.json({ error: 'Type and structure are required' }, { status: 400 });
    }

    if (!CATEGORY_STRUCTURE_TYPES.includes(type)) {
      return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 });
    }

    await connectToDatabase();
    await saveBulkStructure(type, structure);

    return NextResponse.json({
      success: true,
      message: 'Category structure saved successfully',
    });
  } catch (error) {
    console.error('Error saving category structure:', error);
    return NextResponse.json(
      { error: 'Failed to save category structure', details: error.message },
      { status: 500 }
    );
  }
}
