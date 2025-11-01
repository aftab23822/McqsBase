import { NextResponse } from 'next/server';
import connectToDatabase from '../../../lib/mongodb.js';
import Quiz from '../../../lib/models/Quiz.js';

// Get all Quizzes (paginated) - matches your existing quizController.getQuizzes
export async function GET(request) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const skip = (page - 1) * limit;

    // Parallelize database queries for better performance
    const [total, quizzes] = await Promise.all([
      Quiz.countDocuments(),
      Quiz.find()
        .sort({ createdAt: -1, _id: -1 })
        .skip(skip)
        .limit(limit)
        .lean() // Use lean() for faster queries
    ]);

    return NextResponse.json({
      results: quizzes,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300'
      }
    });
  } catch (error) {
    console.error('Quiz API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quizzes' },
      { status: 500 }
    );
  }
}

// Add a new Quiz - matches your existing quizController.addQuiz
export async function POST(request) {
  try {
    await connectToDatabase();

    const body = await request.json();
    const quiz = new Quiz(body);
    await quiz.save();

    return NextResponse.json(quiz, { status: 201 });
  } catch (error) {
    console.error('Error adding quiz:', error);
    return NextResponse.json(
      { message: 'Error adding quiz', error: error.message },
      { status: 500 }
    );
  }
}
