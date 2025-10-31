import connectToDatabase from '../../../../lib/mongodb';
import MockTest from '../../../../models/mockTest';

export async function GET(_request, { params }) {
  try {
    await connectToDatabase();
    const { university } = params;
    const tests = await MockTest.aggregate([
      { $match: { universitySlug: university } },
      { $sort: { updatedAt: -1 } },
      { $project: {
          _id: 1,
          name: 1,
          slug: 1,
          universitySlug: 1,
          durationMinutes: 1,
          updatedAt: 1,
          lastUpdatedAt: 1,
          questionCount: { $size: { $ifNull: [ '$questions', [] ] } }
        }
      }
    ]);
    
    return Response.json({ success: true, data: tests });
  } catch (error) {
    console.error('Error fetching mock tests:', error);
    return Response.json({ success: false, message: 'Failed to fetch tests' }, { status: 500 });
  }
}


