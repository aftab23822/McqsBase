import { NextResponse } from 'next/server';
import connectToDatabase from '../../../../lib/mongodb.js';
import MCQ from '../../../../lib/models/MCQ.js';
import Category from '../../../../lib/models/Category.js';
import { sanitizeSubject, sanitizeInt, escapeRegex } from '../../../../lib/utils/security.js';

// Get Quiz by subject - returns MCQs from the database (same as MCQs but for quiz display)
export async function GET(request, { params }) {
  try {
    await connectToDatabase();

    // Sanitize and validate subject parameter
    const sanitizedSubject = sanitizeSubject(params.subject);
    if (!sanitizedSubject) {
      return NextResponse.json({ 
        results: [], 
        total: 0, 
        page: 1, 
        totalPages: 0 
      });
    }

    const { searchParams } = new URL(request.url);
    const page = sanitizeInt(searchParams.get('page'), 1, 1000, 1);
    const limit = sanitizeInt(searchParams.get('limit'), 1, 100, 10);
    const skip = (page - 1) * limit;

    // Find the category by name (case-insensitive) - using escaped regex for security
    const escapedSubject = escapeRegex(sanitizedSubject);
    const category = await Category.findOne({ 
      name: { $regex: new RegExp('^' + escapedSubject + '$', 'i') } 
    }).lean(); // Use lean() for faster category lookup
    
    if (!category) {
      return NextResponse.json({ 
        results: [], 
        total: 0, 
        page, 
        totalPages: 0 
      });
    }

    const filter = { categoryId: category._id };
    
    // Parallelize database queries for better performance
    const [total, mcqs] = await Promise.all([
      MCQ.countDocuments(filter),
      MCQ.find(filter)
        .sort({ createdAt: -1, _id: -1 })
        .skip(skip)
        .limit(limit)
        .lean() // Use lean() for faster queries (returns plain JS objects)
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
    console.error(`Quiz API error for subject ${params.subject}:`, error);
    return NextResponse.json(
      { error: `Failed to fetch ${params.subject} quizzes` },
      { status: 500 }
    );
  }
}
