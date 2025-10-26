import { NextResponse } from 'next/server';
import connectToDatabase from '../../../../lib/mongodb.js';
import MCQ from '../../../../lib/models/MCQ.js';
import Category from '../../../../lib/models/Category.js';

export async function GET(request) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 20;
    const skip = (page - 1) * limit;

    // Find the category by name (case-insensitive)
    const category = await Category.findOne({ 
      name: { $regex: new RegExp('^general-knowledge$', 'i') } 
    });
    
    if (!category) {
      return NextResponse.json({ 
        results: [], 
        total: 0, 
        page, 
        totalPages: 0 
      });
    }

    const filter = { categoryId: category._id };
    const total = await MCQ.countDocuments(filter);
    const mcqs = await MCQ.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(limit);

    return NextResponse.json({
      results: mcqs,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('General Knowledge MCQs API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch General Knowledge MCQs' },
      { status: 500 }
    );
  }
}
