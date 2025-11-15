import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb.js';
import PastPaper from '@/lib/models/PastPaper.js';
import Category from '@/lib/models/Category.js';
import { generateQuestionSlug } from '@/lib/utils/slugGenerator.js';
import { normalizeCategoryName } from '@/lib/utils/categoryUtils.js';
import { sanitizeString } from '@/lib/utils/security.js';

/**
 * GET - Fetch a single past paper question by category path and question slug
 * URL: /api/pastpapers/question/[commission]/[department]/[role]/[...subcategory]/[questionSlug]
 */
export async function GET(request, { params }) {
  try {
    await connectToDatabase();

    // In Next.js 15+, params is a Promise and must be awaited
    const resolvedParams = await params;
    const { path } = resolvedParams;
    const pathArray = Array.isArray(path) ? path : (path ? [path] : []);

    if (pathArray.length < 4) {
      return NextResponse.json(
        { error: 'Invalid path. Expected: commission/department/role/question/slug' },
        { status: 400 }
      );
    }

    // Last segment is the question slug
    const questionSlug = pathArray[pathArray.length - 1];
    // Second to last should be "question"
    if (pathArray[pathArray.length - 2] !== 'question') {
      return NextResponse.json(
        { error: 'Invalid path format. Expected: .../question/slug' },
        { status: 400 }
      );
    }

    // Extract category path (everything before "question")
    const categoryPathArray = pathArray.slice(0, -2);
    const categoryPath = `/past-papers/${categoryPathArray.join('/')}`;

    // Build the normalized category name (same as used in batch upload)
    const normalizedCategoryName = normalizeCategoryName(categoryPath);
    
    // Also try with slashes (categories might be stored with slashes)
    const escapedPath = categoryPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const escapedNormalized = normalizedCategoryName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // Also try without trailing slash if present
    const categoryPathNoTrailing = categoryPath.replace(/\/$/, '');
    const escapedPathNoTrailing = categoryPathNoTrailing.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // Find matching categories - try multiple patterns
    const searchConditions = [
      { name: new RegExp(`^${escapedPath}$`, 'i') },
      { name: new RegExp(`^${escapedPathNoTrailing}$`, 'i') },
      { name: new RegExp(`^${escapedNormalized}$`, 'i') },
      { name: new RegExp(`^${escapedPath}/`, 'i') },
      { name: new RegExp(`^${escapedPathNoTrailing}/`, 'i') },
      { name: new RegExp(`^${escapedNormalized}-`, 'i') }
    ];

    let matchingCategories = await Category.find({
      type: { $in: ['PastPaper', 'MCQ'] },
      $or: searchConditions
    }).lean();

    // If no exact matches, try to find categories under the parent path
    // This handles cases where the exact subcategory doesn't exist but we want to show parent's data
    if (matchingCategories.length === 0 && categoryPathArray.length > 3) {
      // Build parent path (without the last subcategory segment)
      const parentPathArray = categoryPathArray.slice(0, -1);
      const parentPath = `/past-papers/${parentPathArray.join('/')}`;
      const escapedParentPath = parentPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      
      // Find categories that start with the parent path
      matchingCategories = await Category.find({
        type: { $in: ['PastPaper', 'MCQ'] },
        name: { $regex: new RegExp(`^${escapedParentPath}/`, 'i') }
      }).lean();
    }

    if (!matchingCategories || matchingCategories.length === 0) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    const categoryIds = matchingCategories.map(cat => cat._id);

    // Find the question by slug within these categories
    // Now fetching from PastPaper collection instead of MCQ collection
    let question = await PastPaper.findOne({
      categoryId: { $in: categoryIds },
      slug: questionSlug
    }).lean();

    if (!question) {
      // Try to find by generated slug if stored slug doesn't match
      const allQuestions = await PastPaper.find({
        categoryId: { $in: categoryIds }
      }).lean();

      const matchingQuestion = allQuestions.find(q => {
        const generatedSlug = generateQuestionSlug(q.question, q._id.toString());
        return generatedSlug === questionSlug;
      });

      if (matchingQuestion) {
        // Update the question with the slug for future lookups
        await PastPaper.findByIdAndUpdate(matchingQuestion._id, { slug: questionSlug }).catch(() => {});
        
        question = matchingQuestion;
      } else {
        return NextResponse.json(
          { error: 'Question not found' },
          { status: 404 }
        );
      }
    }

    // Find next and previous questions in the same category
    const [nextQuestion, prevQuestion] = await Promise.all([
      PastPaper.findOne({
        categoryId: { $in: categoryIds },
        $or: [
          { createdAt: { $gt: question.createdAt } },
          { createdAt: question.createdAt, _id: { $gt: question._id } }
        ]
      })
        .sort({ createdAt: 1, _id: 1 })
        .select('_id slug question')
        .lean(),
      PastPaper.findOne({
        categoryId: { $in: categoryIds },
        $or: [
          { createdAt: { $lt: question.createdAt } },
          { createdAt: question.createdAt, _id: { $lt: question._id } }
        ]
      })
        .sort({ createdAt: -1, _id: -1 })
        .select('_id slug question')
        .lean()
    ]);

    // Generate slugs for next/prev questions if they don't have one
    const nextSlug = nextQuestion 
      ? (nextQuestion.slug || generateQuestionSlug(nextQuestion.question, nextQuestion._id.toString()))
      : null;
    const prevSlug = prevQuestion 
      ? (prevQuestion.slug || generateQuestionSlug(prevQuestion.question, prevQuestion._id.toString()))
      : null;

    return NextResponse.json({
      question: {
        ...question,
        _id: question._id.toString(),
        categoryId: question.categoryId?.toString(),
        submittedBy: question.submittedBy?.toString()
      },
      nextQuestionId: nextQuestion?._id?.toString() || null,
      nextQuestionSlug: nextSlug,
      prevQuestionId: prevQuestion?._id?.toString() || null,
      prevQuestionSlug: prevSlug,
      category: {
        name: matchingCategories[0].name,
        path: categoryPath
      }
    });
  } catch (error) {
    console.error('Error fetching past paper question:', error);
    return NextResponse.json(
      { error: 'Failed to fetch question' },
      { status: 500 }
    );
  }
}

