import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb.js';
import Category from '@/lib/models/Category.js';
import Subcategory from '@/lib/models/Subcategory.js';
import { escapeRegex } from '@/lib/utils/security.js';
import { normalizeCategoryName } from '@/utils/categoryConfig';

export async function GET(request, { params }) {
  try {
    await connectToDatabase();
    
    // In Next.js 15+, params is a Promise and must be awaited
    const resolvedParams = await params;
    const subjectRaw = resolvedParams.subject || '';
    const subject = normalizeCategoryName(subjectRaw);
    const escaped = escapeRegex(subject);

    const category = await Category.findOne({
      name: { $regex: new RegExp('^' + escaped + '$', 'i') }
    }).lean();
    if (!category) {
      return NextResponse.json({ category: null, subcategories: [] });
    }

    const subcategories = await Subcategory.find({ categoryId: category._id })
      .sort({ createdAt: 1 })
      .lean();

    return NextResponse.json({ category, subcategories });
  } catch (error) {
    console.error('Subcategories by category API error:', error);
    return NextResponse.json({ error: 'Failed to fetch subcategories' }, { status: 500 });
  }
}











