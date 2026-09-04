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

export async function POST(request) {
  try {
    await connectToDatabase();
    const body = await request.json();
    let { category = 'universities', universitySlug, targetSlug, mockTestName, durationMinutes = 30, questions = [] } = body;

    // Sanitize and validate inputs
    category = sanitizeSubject(category) || 'universities';
    universitySlug = sanitizeSubject(targetSlug || universitySlug || (category !== 'universities' ? category : ''));
    mockTestName = sanitizeString(mockTestName || '', 200);
    
    if (!universitySlug || !mockTestName || !Array.isArray(questions) || questions.length === 0) {
      return Response.json({ success: false, message: 'category target, mockTestName and questions are required' }, { status: 400 });
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
    const sanitizedQuestions = questions.slice(0, 1000).map(q => {
      const options = normalizeOptions(q.options);
      return {
        question: sanitizeString(q.question || '', 2000),
        options,
        answer: normalizeAnswer(q, options),
        explanation: sanitizeString(q.explanation || '', 2000)
      };
    }).filter(q => q.question && q.options.length > 0 && q.answer);

    if (sanitizedQuestions.length === 0) {
      return Response.json({ success: false, message: 'No valid questions after sanitization' }, { status: 400 });
    }

    const doc = await MockTest.findOneAndUpdate(
      { universitySlug, slug },
      {
        name: mockTestName,
        slug,
        universitySlug,
        category,
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


