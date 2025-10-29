import connectToDatabase from '../../../../lib/mongodb';
import MockTest from '../../../../models/mockTest';

export async function GET(_request, { params }) {
  try {
    await connectToDatabase();
    const { university } = params;
    const tests = await MockTest.find({ universitySlug: university })
      .select('name slug universitySlug durationMinutes updatedAt lastUpdatedAt questions')
      .sort({ updatedAt: -1 });
    
    // Add question count to each test
    const testsWithCount = tests.map(test => ({
      ...test.toObject(),
      questionCount: test.questions?.length || 0
    }));
    
    return Response.json({ success: true, data: testsWithCount });
  } catch (error) {
    console.error('Error fetching mock tests:', error);
    return Response.json({ success: false, message: 'Failed to fetch tests' }, { status: 500 });
  }
}


