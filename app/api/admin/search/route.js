import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb.js';
import MCQ from '@/lib/models/MCQ.js';
import PastPaper from '@/lib/models/PastPaper.js';
import PastInterview from '@/lib/models/PastInterview.js';

export async function GET(request) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const q = (searchParams.get('q') || '').trim();
    const type = (searchParams.get('type') || 'all').toLowerCase();
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const skip = (page - 1) * limit;

    if (!q) {
      return NextResponse.json(
        { results: [], total: 0, page: 1, totalPages: 0 },
        { status: 200 }
      );
    }

    const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

    const queries = [];

    if (type === 'all' || type === 'mcq') {
      queries.push(
        (async () => {
          const [items, total] = await Promise.all([
            MCQ.find({ question: regex })
              .sort({ createdAt: -1, _id: -1 })
              .skip(skip)
              .limit(limit)
              .lean(),
            MCQ.countDocuments({ question: regex }),
          ]);
          return {
            type: 'mcq',
            total,
            items: items.map((doc) => ({
              _id: doc._id.toString(),
              type: 'mcq',
              question: doc.question,
              preview: doc.question,
              year: doc.year || null,
              department: doc.department || null,
              options: doc.options || [],
              answer: doc.answer || '',
              explanation: doc.explanation || '',
              link: doc.link || '',
            })),
          };
        })()
      );
    }

    if (type === 'all' || type === 'pastpaper') {
      queries.push(
        (async () => {
          const [items, total] = await Promise.all([
            PastPaper.find({ question: regex })
              .sort({ createdAt: -1, _id: -1 })
              .skip(skip)
              .limit(limit)
              .lean(),
            PastPaper.countDocuments({ question: regex }),
          ]);
          return {
            type: 'pastpaper',
            total,
            items: items.map((doc) => ({
              _id: doc._id.toString(),
              type: 'pastpaper',
              question: doc.question,
              preview: doc.question,
              year: doc.year || null,
              department: doc.department || null,
              role: doc.role || null,
              commission: doc.commission || null,
              options: doc.options || [],
              answer: doc.answer || '',
              explanation: doc.explanation || '',
              link: doc.link || '',
            })),
          };
        })()
      );
    }

    if (type === 'all' || type === 'interview') {
      queries.push(
        (async () => {
          const [items, total] = await Promise.all([
            PastInterview.find({
              $or: [{ interviewTitle: regex }, { description: regex }],
            })
              .sort({ createdAt: -1, _id: -1 })
              .skip(skip)
              .limit(limit)
              .lean(),
            PastInterview.countDocuments({
              $or: [{ interviewTitle: regex }, { description: regex }],
            }),
          ]);

          return {
            type: 'interview',
            total,
            items: items.map((doc) => ({
              _id: doc._id.toString(),
              type: 'interview',
              question: doc.interviewTitle,
              preview: doc.description?.slice(0, 200) || '',
              year: doc.year || null,
              department: doc.department || null,
              position: doc.position || null,
              descriptionFull: doc.description || '',
              sharedBy: doc.sharedBy || '',
              experience: doc.experience || '',
            })),
          };
        })()
      );
    }

    const resultsByType = await Promise.all(queries);

    const flatItems = resultsByType.flatMap((group) => group.items);
    const total = resultsByType.reduce((sum, group) => sum + group.total, 0);

    return NextResponse.json(
      {
        results: flatItems,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error('Admin search error:', error);
    return NextResponse.json(
      { success: false, message: 'Error performing search', error: error.message },
      { status: 500 }
    );
  }
}

