import 'dotenv/config';
import connectToDatabase from '../lib/mongodb.js';
import MCQ from '../lib/models/MCQ.js';
import Category from '../lib/models/Category.js';
import { normalizeCategoryName } from '../utils/categoryConfig.js';

const PAGE_SIZE = 10000;

async function run() {
  const page = parseInt(process.argv[2] || '1', 10);
  const skip = (page - 1) * PAGE_SIZE;

  await connectToDatabase();

  const filter = {
    question: { $exists: true, $ne: null, $ne: '' },
    categoryId: { $exists: true, $ne: null }
  };

  const total = await MCQ.countDocuments(filter);
  const mcqs = await MCQ.find(filter)
    .sort({ _id: -1 })
    .skip(skip)
    .limit(PAGE_SIZE)
    .select({ slug: 1, question: 1, updatedAt: 1, categoryId: 1 })
    .lean();

  const categoryIds = [...new Set(mcqs.map(mcq => mcq.categoryId?.toString()).filter(Boolean))];

  const categories = await Category.find({ _id: { $in: categoryIds } })
    .select({ _id: 1, name: 1 })
    .lean();

  const categoryMapping = new Map(
    categories.map(cat => [cat._id.toString(), normalizeCategoryName(cat.name || '').trim()])
  );

  const sample = mcqs.slice(0, 3).map(mcq => ({
    _id: mcq._id,
    slug: mcq.slug,
    categoryId: mcq.categoryId?.toString(),
    normalizedCategory: categoryMapping.get(mcq.categoryId?.toString() || '') || null,
    question: mcq.question?.slice(0, 80)
  }));

  console.log(JSON.stringify({
    page,
    skip,
    total,
    pageCount: mcqs.length,
    categoryCount: categoryIds.length,
    sample
  }, null, 2));

  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});

