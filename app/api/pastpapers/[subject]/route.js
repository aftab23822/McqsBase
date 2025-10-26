import { NextResponse } from 'next/server';
import connectToDatabase from '../../../../lib/mongodb.js';
import PastPaper from '../../../../lib/models/PastPaper.js';

// Get Past Papers by subject - matches your existing pastPaperController.getPastPapersBySubject
export async function GET(request, { params }) {
  try {
    await connectToDatabase();

    const { subject } = params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const skip = (page - 1) * limit;

    const filter = { title: { $regex: new RegExp(subject, 'i') } };
    const total = await PastPaper.countDocuments(filter);
    const pastPapers = await PastPaper.find(filter)
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
    console.error(`Past Papers API error for subject ${params.subject}:`, error);
    return NextResponse.json(
      { error: `Failed to fetch ${params.subject} past papers` },
      { status: 500 }
    );
  }
}
