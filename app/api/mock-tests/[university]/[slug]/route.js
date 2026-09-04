import connectToDatabase from '../../../../../lib/mongodb';
import MockTest from '../../../../../models/mockTest';
import { sanitizeSubject, sanitizeString } from '../../../../../lib/utils/security.js';

function buildTargetQuery(target, slug, category) {
  const query = { universitySlug: target, slug };
  if (category && category !== 'universities') {
    query.category = category;
  } else {
    query.$or = [{ category: 'universities' }, { category: { $exists: false } }];
  }
  return query;
}

function normalizeOptions(options) {
  if (Array.isArray(options)) {
    return options.slice(0, 10).map(opt => sanitizeString(opt || '', 500)).filter(Boolean);
  }
  if (options && typeof options === 'object') {
    return Object.keys(options)
      .sort()
      .slice(0, 10)
      .map(key => sanitizeString(options[key] || '', 500))
      .filter(Boolean);
  }
  return [];
}

function normalizeAnswer(question, options) {
  const rawAnswer = sanitizeString(question.answer || question.correct_option || '', 500);
  const letter = rawAnswer.trim().toUpperCase();
  if (/^[A-Z]$/.test(letter)) {
    const index = letter.charCodeAt(0) - 65;
    return options[index] || rawAnswer;
  }
  return rawAnswer;
}

export async function GET(request, { params }) {
  try {
    await connectToDatabase();
    
    // In Next.js 15+, params is a Promise and must be awaited
    const resolvedParams = await params;
    
    // Sanitize and validate parameters
    const target = sanitizeSubject(resolvedParams.university);
    const slug = sanitizeString(resolvedParams.slug || '', 200);
    const { searchParams } = new URL(request.url);
    const category = sanitizeSubject(searchParams.get('category'));
    
    if (!target || !slug) {
      return Response.json({ success: false, message: 'Invalid parameters' }, { status: 400 });
    }
    const test = await MockTest.findOne(buildTargetQuery(target, slug, category));
    if (!test) {
      return Response.json({ success: false, message: 'Not found' }, { status: 404 });
    }
    return Response.json({ success: true, data: test });
  } catch (error) {
    console.error('Error fetching mock test:', error);
    return Response.json({ success: false, message: 'Failed to fetch test' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    await connectToDatabase();
    
    // In Next.js 15+, params is a Promise and must be awaited
    const resolvedParams = await params;
    
    // Sanitize and validate parameters
    const target = sanitizeSubject(resolvedParams.university);
    const slug = sanitizeString(resolvedParams.slug || '', 200);
    const { searchParams } = new URL(request.url);
    const category = sanitizeSubject(searchParams.get('category'));
    
    if (!target || !slug) {
      return Response.json({ success: false, message: 'Invalid parameters' }, { status: 400 });
    }
    
    const body = await request.json();
    const { mockTestName, durationMinutes, questions } = body;

    const update = {};
    if (typeof mockTestName === 'string' && mockTestName.trim()) {
      const sanitizedName = sanitizeString(mockTestName, 200);
      if (sanitizedName) update.name = sanitizedName;
    }
    if (typeof durationMinutes === 'number') {
      const sanitizedDuration = parseInt(durationMinutes, 10);
      if (!isNaN(sanitizedDuration) && sanitizedDuration >= 1 && sanitizedDuration <= 1000) {
        update.durationMinutes = sanitizedDuration;
      }
    }
    if (Array.isArray(questions) && questions.length > 0 && questions.length <= 1000) {
      // Sanitize questions array
      const sanitizedQuestions = questions.slice(0, 1000).map(q => {
        const options = normalizeOptions(q.options);
        return {
          question: sanitizeString(q.question || '', 2000),
          options,
          answer: normalizeAnswer(q, options),
          explanation: sanitizeString(q.explanation || '', 2000)
        };
      }).filter(q => q.question && q.options.length > 0 && q.answer);
      if (sanitizedQuestions.length > 0) {
        update.questions = sanitizedQuestions;
      }
    }
    if (Object.keys(update).length === 0) {
      return Response.json({ success: false, message: 'No valid fields to update' }, { status: 400 });
    }
    update.lastUpdatedAt = new Date();

    const updated = await MockTest.findOneAndUpdate(
      buildTargetQuery(target, slug, category),
      { $set: update },
      { new: true }
    );
    if (!updated) {
      return Response.json({ success: false, message: 'Not found' }, { status: 404 });
    }
    return Response.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error updating mock test:', error);
    return Response.json({ success: false, message: 'Failed to update test' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    await connectToDatabase();
    
    // In Next.js 15+, params is a Promise and must be awaited
    const resolvedParams = await params;
    
    // Sanitize and validate parameters
    const target = sanitizeSubject(resolvedParams.university);
    const slug = sanitizeString(resolvedParams.slug || '', 200);
    const { searchParams } = new URL(request.url);
    const category = sanitizeSubject(searchParams.get('category'));
    
    if (!target || !slug) {
      return Response.json({ success: false, message: 'Invalid parameters' }, { status: 400 });
    }
    const res = await MockTest.deleteOne(buildTargetQuery(target, slug, category));
    if (res.deletedCount === 0) {
      return Response.json({ success: false, message: 'Not found' }, { status: 404 });
    }
    return Response.json({ success: true });
  } catch (error) {
    console.error('Error deleting mock test:', error);
    return Response.json({ success: false, message: 'Failed to delete test' }, { status: 500 });
  }
}


