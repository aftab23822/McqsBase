import { NextResponse } from 'next/server';
import connectToDatabase from '../../../lib/mongodb.js';
import PastPaper from '../../../lib/models/PastPaper.js';

// Get all Past Papers (paginated) - matches your existing pastPaperController.getPastPapers
export async function GET(request) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const skip = (page - 1) * limit;

    const total = await PastPaper.countDocuments();
    const pastPapers = await PastPaper.find()
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(limit);

    return NextResponse.json({
      results: pastPapers,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Past Papers API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch past papers' },
      { status: 500 }
    );
  }
}

// Add a new Past Paper - matches your existing pastPaperController.addPastPaper
export async function POST(request) {
  try {
    await connectToDatabase();

    const body = await request.json();
    const pastPaper = new PastPaper(body);
    await pastPaper.save();

    return NextResponse.json(pastPaper, { status: 201 });
  } catch (error) {
    console.error('Error adding past paper:', error);
    return NextResponse.json(
      { message: 'Error adding past paper', error: error.message },
      { status: 500 }
    );
  }
}
