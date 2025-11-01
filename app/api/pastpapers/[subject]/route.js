import { NextResponse } from 'next/server';
import connectToDatabase from '../../../../lib/mongodb.js';
import PastPaper from '../../../../lib/models/PastPaper.js';
import { sanitizeSubject, sanitizeInt, escapeRegex } from '../../../../lib/utils/security.js';

// Get Past Papers by subject - matches your existing pastPaperController.getPastPapersBySubject
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

    // Use escaped regex for security to prevent NoSQL injection
    const escapedSubject = escapeRegex(sanitizedSubject);
    const filter = { title: { $regex: new RegExp(escapedSubject, 'i') } };
    
    // Parallelize database queries for better performance
    const [total, pastPapers] = await Promise.all([
      PastPaper.countDocuments(filter),
      PastPaper.find(filter)
        .sort({ createdAt: -1, _id: -1 })
        .skip(skip)
        .limit(limit)
        .lean() // Use lean() for faster queries (returns plain JS objects)
    ]);

    return NextResponse.json({
      results: pastPapers,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300'
      }
    });
  } catch (error) {
    console.error(`Past Papers API error for subject ${params.subject}:`, error);
    return NextResponse.json(
      { error: `Failed to fetch ${params.subject} past papers` },
      { status: 500 }
    );
  }
}
