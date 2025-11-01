import connectToDatabase from '../../../../lib/mongodb';
import MockTest from '../../../../models/mockTest';
import { sanitizeString, sanitizeSubject } from '../../../../lib/utils/security.js';

function slugify(input) {
  if (typeof input !== 'string') {
    return '';
  }
  return input.toString().toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

export async function POST(request) {
  try {
    await connectToDatabase();
    const body = await request.json();
    let { universitySlug, mockTestName, durationMinutes = 30, questions = [] } = body;

    // Sanitize and validate inputs
    universitySlug = sanitizeSubject(universitySlug);
    mockTestName = sanitizeString(mockTestName || '', 200);
    
    if (!universitySlug || !mockTestName || !Array.isArray(questions) || questions.length === 0) {
      return Response.json({ success: false, message: 'universitySlug, mockTestName and questions are required' }, { status: 400 });
    }

    // Validate durationMinutes
    const sanitizedDuration = parseInt(durationMinutes, 10);
    if (isNaN(sanitizedDuration) || sanitizedDuration < 1 || sanitizedDuration > 1000) {
      return Response.json({ success: false, message: 'Invalid durationMinutes' }, { status: 400 });
    }

    // Validate and sanitize questions array
    if (!Array.isArray(questions) || questions.length === 0 || questions.length > 1000) {
      return Response.json({ success: false, message: 'Invalid questions array' }, { status: 400 });
    }

    const slug = slugify(mockTestName);

    // Sanitize questions before saving
    const sanitizedQuestions = questions.slice(0, 1000).map(q => ({
      question: sanitizeString(q.question || '', 2000),
      options: Array.isArray(q.options) ? q.options.slice(0, 10).map(opt => sanitizeString(opt || '', 500)) : [],
      answer: sanitizeString(q.answer || '', 500),
      explanation: sanitizeString(q.explanation || '', 2000)
    })).filter(q => q.question && q.options.length > 0 && q.answer);

    if (sanitizedQuestions.length === 0) {
      return Response.json({ success: false, message: 'No valid questions after sanitization' }, { status: 400 });
    }

    const doc = await MockTest.findOneAndUpdate(
      { universitySlug, slug },
      {
        name: mockTestName,
        slug,
        universitySlug,
        durationMinutes: sanitizedDuration,
        questions: sanitizedQuestions,
        lastUpdatedAt: new Date()
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return Response.json({ success: true, data: doc, inserted: sanitizedQuestions.length, skipped: 0 });
  } catch (error) {
    console.error('Error creating mock test:', error);
    return Response.json({ success: false, message: 'Failed to create test' }, { status: 500 });
  }
}


