import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb.js';
import Category from '@/lib/models/Category.js';
import Subcategory from '@/lib/models/Subcategory.js';
import { normalizeCategoryName } from '@/utils/categoryConfig';

// Payload shape:
// {
//   "subject": "english",
//   "items": [
//     { "name": "Grammar", "type": "MCQ", "parentName": null },
//     { "name": "Vocabulary", "type": "MCQ", "parentName": null },
//     { "name": "Tenses", "type": "MCQ", "parentName": "Grammar" }
//   ]
// }
export async function POST(request) {
  try {
    await connectToDatabase();
    const body = await request.json();
    const subject = normalizeCategoryName(body.subject || '');
    if (!subject || !Array.isArray(body.items)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    // Find or create the parent category (defaults to MCQ)
    let category = await Category.findOne({ name: subject, type: 'MCQ' });
    if (!category) {
      category = await Category.create({ name: subject, type: 'MCQ' });
    }

    // First pass: ensure all top-level items exist (no parentName)
    const nameToId = new Map();
    for (const item of body.items) {
      const name = (item.name || '').trim();
      if (!name) continue;
      const type = item.type || 'MCQ';
      if (!item.parentName) {
        let existing = await Subcategory.findOne({ name, categoryId: category._id });
        if (!existing) {
          existing = await Subcategory.create({ name, categoryId: category._id, type });
        }
        nameToId.set(name, existing._id);
      }
    }

    // Second pass: handle nested items with parentName
    for (const item of body.items) {
      const name = (item.name || '').trim();
      if (!name || !item.parentName) continue;
      const type = item.type || 'MCQ';

      // Ensure parent exists
      let parentId = nameToId.get(item.parentName);
      if (!parentId) {
        let parent = await Subcategory.findOne({ name: item.parentName, categoryId: category._id });
        if (!parent) {
          parent = await Subcategory.create({ name: item.parentName, categoryId: category._id, type });
        }
        parentId = parent._id;
        nameToId.set(item.parentName, parentId);
      }

      // Upsert child
      let existing = await Subcategory.findOne({ name, categoryId: category._id });
      if (!existing) {
        existing = await Subcategory.create({
          name,
          categoryId: category._id,
          parentSubcategoryId: parentId,
          type
        });
      } else if (!existing.parentSubcategoryId) {
        existing.parentSubcategoryId = parentId;
        await existing.save();
      }
      nameToId.set(name, existing._id);
    }

    const created = await Subcategory.find({ categoryId: category._id }).lean();
    return NextResponse.json({ category: { _id: category._id, name: category.name, type: category.type }, subcategories: created });
  } catch (error) {
    console.error('Bulk subcategories API error:', error);
    return NextResponse.json({ error: 'Failed to upsert subcategories' }, { status: 500 });
  }
}












