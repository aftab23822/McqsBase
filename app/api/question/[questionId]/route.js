import { NextResponse } from 'next/server';
import connectToDatabase from '../../../../lib/mongodb.js';
import MCQ from '../../../../lib/models/MCQ.js';
import Category from '../../../../lib/models/Category.js';
import { sanitizeSubject, sanitizeString, escapeRegex } from '../../../../lib/utils/security.js';
import {
  resolveQuestionByIdentifier
} from '../../../../lib/services/questionResolver.js';

const QUESTION_CACHE_TTL_MS = 1000 * 60 * 5; // 5 minutes
const QUESTION_CACHE_MAX_SIZE = 5000;

const globalWithCache = globalThis;
if (!globalWithCache.__questionCache) {
  globalWithCache.__questionCache = new Map();
}

const questionCache = globalWithCache.__questionCache;

function makeCacheKey(categoryId, slug) {
  return `${categoryId.toString()}::${slug}`;
}

function getCachedQuestion(categoryId, slug) {
  const key = makeCacheKey(categoryId, slug);
  const cached = questionCache.get(key);
  if (!cached) return null;
  if (Date.now() > cached.expiresAt) {
    questionCache.delete(key);
    return null;
  }
  return cached.value;
}

function setCachedQuestion(categoryId, slug, value) {
  const key = makeCacheKey(categoryId, slug);
  if (questionCache.size >= QUESTION_CACHE_MAX_SIZE) {
    // Simple eviction: delete oldest entry
    const firstKey = questionCache.keys().next().value;
    if (firstKey) {
      questionCache.delete(firstKey);
    }
  }
  questionCache.set(key, {
    expiresAt: Date.now() + QUESTION_CACHE_TTL_MS,
    value
  });
}

/**
 * GET /api/question/[questionId]?subject=general-knowledge
 */
export async function GET(request, { params }) {
  console.log('\n========== [Question API] CALLED ==========');
  console.log('[Question API] URL:', request.url);
  try {
    await connectToDatabase();

    // In Next.js 15+, params is a Promise and must be awaited
    const resolvedParams = await params;
    console.log('[Question API] Params:', resolvedParams);
    const { questionId } = resolvedParams || {};
    const { searchParams } = new URL(request.url);
    const subject = searchParams.get('subject');

    console.log('[Question API] Extracted - subject:', subject, 'questionId:', questionId);

    if (!subject || !questionId) {
      console.error('[Question API] Missing params');
      return NextResponse.json(
        { error: 'Missing subject or questionId' },
        { status: 400 }
      );
    }

    // Sanitize inputs
    const sanitizedSubject = sanitizeSubject(subject);
    const sanitizedQuestionId = sanitizeString(questionId);

    if (!sanitizedSubject || !sanitizedQuestionId) {
      return NextResponse.json(
        { error: 'Invalid subject or question ID' },
        { status: 400 }
      );
    }

    // Find category
    const escapedSubject = escapeRegex(sanitizedSubject);
    const category = await Category.findOne({
      name: { $regex: new RegExp('^' + escapedSubject + '$', 'i') }
    }).lean();

    if (!category) {
      return NextResponse.json(
        { error: `Category not found for subject: ${sanitizedSubject}` },
        { status: 404 }
      );
    }

    const baseQuery = { categoryId: category._id };

    const cached = getCachedQuestion(category._id, sanitizedQuestionId);
    if (cached) {
      return NextResponse.json(cached, {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600'
        }
      });
    }

    const question = await resolveQuestionByIdentifier({
      categoryId: category._id,
      identifier: sanitizedQuestionId
    });

    if (!question) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }

    // Get next and previous questions
    const [nextQuestion, prevQuestion] = await Promise.all([
      MCQ.findOne({
        categoryId: category._id,
        $or: [
          { createdAt: { $gt: question.createdAt } },
          { createdAt: question.createdAt, _id: { $gt: question._id } }
        ]
      })
        .sort({ createdAt: 1, _id: 1 })
        .select('_id')
        .lean(),
      MCQ.findOne({
        categoryId: category._id,
        $or: [
          { createdAt: { $lt: question.createdAt } },
          { createdAt: question.createdAt, _id: { $lt: question._id } }
        ]
      })
        .sort({ createdAt: -1, _id: -1 })
        .select('_id')
        .lean()
    ]);

    const responsePayload = {
      question,
      nextQuestionId: nextQuestion?._id?.toString() || null,
      prevQuestionId: prevQuestion?._id?.toString() || null,
      category: {
        name: category.name,
        slug: subject
      }
    };

    setCachedQuestion(category._id, sanitizedQuestionId, responsePayload);

    return NextResponse.json(responsePayload, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600'
      }
    });
  } catch (error) {
    console.error('[Question API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch question' },
      { status: 500 }
    );
  }
}

