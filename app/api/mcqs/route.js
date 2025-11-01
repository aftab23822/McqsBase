import { NextResponse } from 'next/server';
import connectToDatabase from '../../../lib/mongodb.js';
import MCQ from '../../../lib/models/MCQ.js';
import Category from '../../../lib/models/Category.js';
import { normalizeCategoryName } from '../../../lib/utils/categoryUtils.js';

// Get all MCQs (paginated) - matches your existing mcqController.getMcqs
export async function GET(request) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const skip = (page - 1) * limit;

    // Parallelize database queries for better performance
    const [total, mcqs] = await Promise.all([
      MCQ.countDocuments(),
      MCQ.find()
        .sort({ createdAt: -1, _id: -1 })
        .skip(skip)
        .limit(limit)
        .lean() // Use lean() for faster queries
    ]);

    return NextResponse.json({
      results: mcqs,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300'
      }
    });
  } catch (error) {
    console.error('MCQs API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch MCQs' },
      { status: 500 }
    );
  }
}

// Add a new MCQ - matches your existing mcqController.addMcq
export async function POST(request) {
  try {
    await connectToDatabase();

    const body = await request.json();
    const {
      question,
      options,
      correct_option,
      detail_link,
      submitter,
      explanation,
      categoryId,
      subcategoryId,
      category // Add support for category name
    } = body;

    // Handle category mapping
    let finalCategoryId = categoryId;
    if (category && !categoryId) {
      const normalizedCategoryName = normalizeCategoryName(category);
      let categoryDoc = await Category.findOne({ name: normalizedCategoryName });
      if (!categoryDoc) {
        categoryDoc = new Category({ name: normalizedCategoryName, type: 'MCQ' });
        await categoryDoc.save();
      }
      finalCategoryId = categoryDoc._id;
    }

    // Check for duplicate question in the same category
    const existingQuestion = await MCQ.findOne({ 
      question: question,
      categoryId: finalCategoryId 
    });
    
    if (existingQuestion) {
      return NextResponse.json({ 
        message: 'Question already exists in this category',
        existingMcq: existingQuestion
      }, { status: 409 });
    }

    const mcq = new MCQ({
      question,
      options,
      answer: correct_option,
      explanation,
      categoryId: finalCategoryId,
      subcategoryId,
      link: detail_link,
      submittedBy: submitter
    });

    await mcq.save();
    return NextResponse.json(mcq, { status: 201 });
  } catch (error) {
    console.error('Error adding MCQ:', error);
    return NextResponse.json(
      { message: 'Error adding MCQ', error: error.message },
      { status: 500 }
    );
  }
}
