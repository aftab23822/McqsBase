import connectToDatabase from '../../../lib/mongodb';
import MockTest from '../../../models/mockTest';

function slugify(input) {
  return input.toString().toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

export async function GET(request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const universitySlug = searchParams.get('university');
    const limit = parseInt(searchParams.get('limit') || '100', 10);

    const query = universitySlug ? { universitySlug } : {};
    const tests = await MockTest.find(query)
      .select('name slug universitySlug durationMinutes updatedAt lastUpdatedAt questions')
      .sort({ updatedAt: -1 })
      .limit(limit);

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

export async function POST(request) {
  try {
    await connectToDatabase();
    const body = await request.json();
    const { universitySlug, mockTestName, durationMinutes = 30, questions = [] } = body;

    if (!universitySlug || !mockTestName || !Array.isArray(questions) || questions.length === 0) {
      return Response.json({ success: false, message: 'universitySlug, mockTestName and questions are required' }, { status: 400 });
    }

    const slug = slugify(mockTestName);

    const doc = await MockTest.findOneAndUpdate(
      { universitySlug, slug },
      {
        name: mockTestName,
        slug,
        universitySlug,
        durationMinutes,
        questions,
        lastUpdatedAt: new Date()
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return Response.json({ success: true, data: doc, inserted: questions.length, skipped: 0 });
  } catch (error) {
    console.error('Error creating mock test:', error);
    return Response.json({ success: false, message: 'Failed to create test' }, { status: 500 });
  }
}


