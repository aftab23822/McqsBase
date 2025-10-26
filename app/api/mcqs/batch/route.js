import { NextResponse } from 'next/server';
import connectToDatabase from '../../../../lib/mongodb.js';
import MCQ from '../../../../lib/models/MCQ.js';
import Category from '../../../../lib/models/Category.js';
import { normalizeCategoryName } from '../../../../lib/utils/categoryUtils.js';

// Batch upload MCQs - matches your existing mcqController.batchUploadMcqs
export async function POST(request) {
  try {
    await connectToDatabase();

    const { mcqs, category: clientCategory } = await request.json();
    const { searchParams } = new URL(request.url);

    if (!Array.isArray(mcqs) || mcqs.length === 0) {
      return NextResponse.json(
        { message: 'No MCQs provided' },
        { status: 400 }
      );
    }

    // Prefer category sent by client, then req.query, then fallback to detail_link
    let categoryName = null;
    if (clientCategory) {
      categoryName = normalizeCategoryName(clientCategory);
    } else if (searchParams.get('category')) {
      categoryName = normalizeCategoryName(searchParams.get('category'));
    } else if (mcqs[0].detail_link) {
      const match = mcqs[0].detail_link.match(/pakmcqs\.com\/([^\/]+)/);
      if (match) categoryName = normalizeCategoryName(match[1]);
    }
    if (!categoryName) {
      categoryName = 'uncategorized';
    }

    // Find or create the category
    let category = await Category.findOne({ name: categoryName });
    if (!category) {
      category = new Category({ name: categoryName, type: 'MCQ' });
      await category.save();
    }

    // Deduplication: get all existing questions for this category
    const existingQuestions = new Set(
      (await MCQ.find({ categoryId: category._id }, 'question')).map(q => q.question)
    );

    // Prepare MCQs for insertion (latest at top), skip duplicates
    const docs = mcqs.filter(m => !existingQuestions.has(m.question)).map(m => ({
      question: m.question,
      options: m.options,
      answer: m.correct_option,
      explanation: m.explanation || '',
      categoryId: category._id,
      link: m.detail_link,
      submittedBy: m.submitter,
      pageOrder: m.pageOrder || 0  // Include page order
    }));

    let inserted = [];
    if (docs.length > 0) {
      inserted = await MCQ.insertMany(docs, { ordered: false });
    }

    return NextResponse.json({ 
      inserted: inserted.length, 
      skipped: mcqs.length - docs.length 
    }, { status: 201 });
  } catch (error) {
    console.error('Error batch uploading MCQs:', error);
    return NextResponse.json(
      { message: 'Error batch uploading MCQs', error: error.message },
      { status: 500 }
    );
  }
}
