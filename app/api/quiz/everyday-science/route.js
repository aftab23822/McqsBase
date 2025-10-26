import { NextResponse } from 'next/server';
import connectToDatabase from '../../../../lib/mongodb.js';
import Quiz from '../../../../lib/models/Quiz.js';

export async function GET(request) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const skip = (page - 1) * limit;

    // Search for quizzes with 'everyday-science' in the title
    const filter = { 
      title: { $regex: new RegExp('everyday-science', 'i') } 
    };
    
    const total = await Quiz.countDocuments(filter);
    const quizzes = await Quiz.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(limit)
      .populate('questions') // Populate MCQ questions
      .populate('categoryId'); // Populate category info

    return NextResponse.json({
      results: quizzes,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Everyday Science Quiz API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Everyday Science quizzes' },
      { status: 500 }
    );
  }
}
