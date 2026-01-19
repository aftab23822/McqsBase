import { NextResponse } from 'next/server';
import connectToDatabase from '../../../../lib/mongodb.js';
import MCQ from '../../../../lib/models/MCQ.js';
import Category from '../../../../lib/models/Category.js';

export async function GET(request) {
  try {
    await connectToDatabase();

    const { searchParams } = request.nextUrl;
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const skip = (page - 1) * limit;

    // Find the category by name (case-insensitive)
    const category = await Category.findOne({ 
      name: { $regex: new RegExp('^everyday-science$', 'i') } 
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
      .limit(limit)
      .lean();

    const serializedMcqs = mcqs.map(mcq => ({
      ...mcq,
      _id: mcq._id.toString(),
      categoryId: mcq.categoryId?.toString() || mcq.categoryId,
      submittedBy: mcq.submittedBy?.toString() || mcq.submittedBy
    }));

    return NextResponse.json(
      {
        results: serializedMcqs,
        total,
        page,
        totalPages: Math.ceil(total / limit)
      },
      {
        // Cache at the edge for 24 hours, allow stale for 7 days
        headers: {
          'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800'
        }
      }
    );
  } catch (error) {
    console.error('Everyday Science Quiz API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Everyday Science quizzes' },
      { status: 500 }
    );
  }
}
