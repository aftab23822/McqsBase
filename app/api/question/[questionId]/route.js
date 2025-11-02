import { NextResponse } from 'next/server';
import connectToDatabase from '../../../../lib/mongodb.js';
import MCQ from '../../../../lib/models/MCQ.js';
import Category from '../../../../lib/models/Category.js';
import { sanitizeSubject, sanitizeString, escapeRegex } from '../../../../lib/utils/security.js';
import mongoose from 'mongoose';

/**
 * GET /api/question/[questionId]?subject=general-knowledge
 */
export async function GET(request, { params }) {
  console.log('\n========== [Question API] CALLED ==========');
  console.log('[Question API] URL:', request.url);
  console.log('[Question API] Params:', params);
  try {
    await connectToDatabase();

    const { questionId } = params || {};
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

    // Extract ID from slug
    const parts = sanitizedQuestionId.split('-');
    const lastPart = parts[parts.length - 1];
    
    let question = null;

    // Try full ObjectId match first
    if (/^[0-9a-f]{24}$/i.test(sanitizedQuestionId)) {
      try {
        const objectId = new mongoose.Types.ObjectId(sanitizedQuestionId);
        question = await MCQ.findOne({
          _id: objectId,
          categoryId: category._id
        }).lean();
      } catch (e) {}
    }
    
    // Try extracted ID
    if (!question && lastPart.length === 24 && /^[0-9a-f]{24}$/i.test(lastPart)) {
      try {
        const objectId = new mongoose.Types.ObjectId(lastPart);
        question = await MCQ.findOne({
          _id: objectId,
          categoryId: category._id
        }).lean();
      } catch (e) {}
    }
    
    // Try partial ID match
    if (!question && /^[0-9a-f]{8,23}$/i.test(lastPart)) {
      const questions = await MCQ.find({
        categoryId: category._id
      })
      .select('_id question options answer explanation createdAt')
      .lean();
      
      question = questions.find(q => {
        const idStr = q._id.toString();
        return idStr.toLowerCase().startsWith(lastPart.toLowerCase());
      });
    }

    // Fallback: search by question text
    if (!question && parts.length > 1) {
      const questionTextSlug = parts.slice(0, -1).join('-');
      const questionText = questionTextSlug.replace(/-/g, ' ');
      const escapedText = escapeRegex(questionText);
      question = await MCQ.findOne({
        categoryId: category._id,
        question: { $regex: new RegExp(escapedText, 'i') }
      })
      .sort({ createdAt: -1 })
      .limit(1)
      .lean();
    }

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

    return NextResponse.json({
      question,
      nextQuestionId: nextQuestion?._id?.toString() || null,
      prevQuestionId: prevQuestion?._id?.toString() || null,
      category: {
        name: category.name,
        slug: subject
      }
    }, {
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

