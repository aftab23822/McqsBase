// Shared past-paper lookups for the API and the server-rendered pages, so crawlers get
// the same question (or a real 404) that the client UI shows.
import connectToDatabase from '../mongodb.js';
import PastPaper from '../models/PastPaper.js';
import Category from '../models/Category.js';
import { generateQuestionSlug } from '../utils/slugGenerator.js';
import { normalizeCategoryName } from '../utils/categoryUtils.js';

const escape = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const TYPES = { $in: ['PastPaper', 'MCQ'] };

async function categoriesForQuestion(categoryPathArray) {
  const categoryPath = `/past-papers/${categoryPathArray.join('/')}`;
  const normalized = escape(normalizeCategoryName(categoryPath));
  const path = escape(categoryPath);
  const noTrailing = escape(categoryPath.replace(/\/$/, ''));
  let categories = await Category.find({
    type: TYPES,
    $or: [
      { name: new RegExp(`^${path}$`, 'i') },
      { name: new RegExp(`^${noTrailing}$`, 'i') },
      { name: new RegExp(`^${normalized}$`, 'i') },
      { name: new RegExp(`^${path}/`, 'i') },
      { name: new RegExp(`^${noTrailing}/`, 'i') },
      { name: new RegExp(`^${normalized}-`, 'i') },
    ],
  }).lean();
  // Same parent fallback the API has always used for deeper subcategory paths.
  if (categories.length === 0 && categoryPathArray.length > 3) {
    const parent = escape(`/past-papers/${categoryPathArray.slice(0, -1).join('/')}`);
    categories = await Category.find({ type: TYPES, name: { $regex: new RegExp(`^${parent}/`, 'i') } }).lean();
  }
  return { categories, categoryPath };
}

/**
 * Returns { question, nextQuestionId, nextQuestionSlug, prevQuestionId, prevQuestionSlug, category }
 * or { notFound: 'Category not found' | 'Question not found' }.
 */
export async function findPastPaperQuestion(categoryPathArray, questionSlug) {
  await connectToDatabase();
  const { categories, categoryPath } = await categoriesForQuestion(categoryPathArray);
  if (!categories.length) return { notFound: 'Category not found' };
  const categoryIds = categories.map((category) => category._id);

  let question = await PastPaper.findOne({ categoryId: { $in: categoryIds }, slug: questionSlug }).lean();
  if (!question) {
    const all = await PastPaper.find({ categoryId: { $in: categoryIds } }).lean();
    question = all.find((item) => generateQuestionSlug(item.question, item._id.toString()) === questionSlug);
    if (!question) return { notFound: 'Question not found' };
    await PastPaper.findByIdAndUpdate(question._id, { slug: questionSlug }).catch(() => {});
  }

  const [next, prev] = await Promise.all([
    PastPaper.findOne({
      categoryId: { $in: categoryIds },
      $or: [{ createdAt: { $gt: question.createdAt } }, { createdAt: question.createdAt, _id: { $gt: question._id } }],
    }).sort({ createdAt: 1, _id: 1 }).select('_id slug question').lean(),
    PastPaper.findOne({
      categoryId: { $in: categoryIds },
      $or: [{ createdAt: { $lt: question.createdAt } }, { createdAt: question.createdAt, _id: { $lt: question._id } }],
    }).sort({ createdAt: -1, _id: -1 }).select('_id slug question').lean(),
  ]);
  const slugOf = (item) => (item ? item.slug || generateQuestionSlug(item.question, item._id.toString()) : null);

  return {
    question: {
      ...question,
      _id: question._id.toString(),
      categoryId: question.categoryId?.toString(),
      submittedBy: question.submittedBy?.toString(),
    },
    nextQuestionId: next?._id?.toString() || null,
    nextQuestionSlug: slugOf(next),
    prevQuestionId: prev?._id?.toString() || null,
    prevQuestionSlug: slugOf(prev),
    category: { name: categories[0].name, path: categoryPath },
  };
}

/** True when any past-paper category (exact, nested or loosely matching) backs this listing path. */
export async function pastPaperListingExists(segments) {
  await connectToDatabase();
  const parts = segments.map((segment) => normalizeCategoryName(segment || '')).filter(Boolean);
  if (parts.length < 3) return false;
  const path = escape(`/past-papers/${parts.join('/')}`);
  const direct = await Category.exists({ type: TYPES, name: new RegExp(`^${path}(/|$)`, 'i') });
  if (direct) return true;
  // Mirror the listing API's broad fallback so no listing it can serve becomes a 404.
  const loose = await Category.exists({
    type: TYPES,
    $and: parts.map((term) => ({ name: { $regex: new RegExp(escape(term), 'i') } })),
  });
  return Boolean(loose);
}
