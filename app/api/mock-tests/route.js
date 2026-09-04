import connectToDatabase from '../../../lib/mongodb';
import MockTest from '../../../models/mockTest';
import { sanitizeSubject } from '../../../lib/utils/security.js';

function slugify(input) {
  return input.toString().toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function normalizeOptions(options) {
  if (Array.isArray(options)) {
    return options.slice(0, 10).map(opt => String(opt || '').trim()).filter(Boolean);
  }
  if (options && typeof options === 'object') {
    return Object.keys(options)
      .sort()
      .slice(0, 10)
      .map(key => String(options[key] || '').trim())
      .filter(Boolean);
  }
  return [];
}

function normalizeAnswer(question, options) {
  const rawAnswer = String(question.answer || question.correct_option || '').trim();
  const letter = rawAnswer.toUpperCase();
  if (/^[A-Z]$/.test(letter)) {
    const index = letter.charCodeAt(0) - 65;
    return options[index] || rawAnswer;
  }
  return rawAnswer;
}

export async function GET(request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const universitySlug = sanitizeSubject(searchParams.get('university'));
    const category = sanitizeSubject(searchParams.get('category'));
    const targetSlug = sanitizeSubject(searchParams.get('target') || searchParams.get('university'));
    const limit = parseInt(searchParams.get('limit') || '100', 10);

    let matchStage = {};
    if (category && category !== 'universities') {
      matchStage = { category, universitySlug: targetSlug || category };
    } else if (universitySlug) {
      matchStage = {
        universitySlug,
        $or: [{ category: 'universities' }, { category: { $exists: false } }]
      };
    }
    const tests = await MockTest.aggregate([
      { $match: matchStage },
      { $sort: { updatedAt: -1 } },
      { $limit: limit },
      { $project: {
          _id: 1,
          name: 1,
          slug: 1,
          universitySlug: 1,
          category: 1,
          durationMinutes: 1,
          updatedAt: 1,
          lastUpdatedAt: 1,
          questionCount: { $size: { $ifNull: [ '$questions', [] ] } }
        }
      }
    ]);

    return Response.json({ success: true, data: tests }, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300'
      }
    });
  } catch (error) {
    console.error('Error fetching mock tests:', error);
    return Response.json({ success: false, message: 'Failed to fetch tests' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await connectToDatabase();
    const body = await request.json();
    let { category = 'universities', universitySlug, targetSlug, mockTestName, durationMinutes = 30, questions = [] } = body;
    category = sanitizeSubject(category) || 'universities';
    universitySlug = sanitizeSubject(targetSlug || universitySlug || (category !== 'universities' ? category : ''));

    if (!universitySlug || !mockTestName || !Array.isArray(questions) || questions.length === 0) {
      return Response.json({ success: false, message: 'category target, mockTestName and questions are required' }, { status: 400 });
    }

    const slug = slugify(mockTestName);

    const normalizedQuestions = questions.slice(0, 1000).map(q => {
      const options = normalizeOptions(q.options);
      return {
        question: String(q.question || '').trim(),
        options,
        answer: normalizeAnswer(q, options),
        explanation: String(q.explanation || '').trim()
      };
    }).filter(q => q.question && q.options.length > 0 && q.answer);

    if (normalizedQuestions.length === 0) {
      return Response.json({ success: false, message: 'No valid questions after sanitization' }, { status: 400 });
    }

    const doc = await MockTest.findOneAndUpdate(
      { universitySlug, slug },
      {
        name: mockTestName,
        slug,
        universitySlug,
        category,
        durationMinutes,
        questions: normalizedQuestions,
        lastUpdatedAt: new Date()
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return Response.json({ success: true, data: doc, inserted: normalizedQuestions.length, skipped: 0 });
  } catch (error) {
    console.error('Error creating mock test:', error);
    return Response.json({ success: false, message: 'Failed to create test' }, { status: 500 });
  }
}


