import connectToDatabase from '../mongodb.js';
import MCQ from '../models/MCQ.js';
import PastPaper from '../models/PastPaper.js';
import { SITE_URL } from '../utils/siteUrl.js';

export const PAGE_SIZE = 1000;
export const QUESTION_FILTER = {
  question: { $exists: true, $nin: [null, ''] },
  categoryId: { $exists: true, $ne: null }
};

export async function listQuestionSitemaps() {
  await connectToDatabase();
  const [mcqs, papers] = await Promise.all([
    buildKeysetShardLocators(MCQ, QUESTION_FILTER, SITE_URL, 'mcq'),
    buildKeysetShardLocators(PastPaper, QUESTION_FILTER, SITE_URL, 'pastpaper')
  ]);
  return [...mcqs, ...papers];
}

export async function buildKeysetShardLocators(Model, filter, baseUrl, sourceParam) {
  const locs = [];
  let bound = null;
  for (;;) {
    const f = bound ? { ...filter, _id: { $lt: bound } } : filter;
    const batch = await Model.find(f)
      .sort({ _id: -1 })
      .limit(PAGE_SIZE)
      .select({ _id: 1 })
      .lean();
    if (!batch.length) break;

    const loc =
      bound === null
        ? `${baseUrl}/sitemap-questions.xml?source=${sourceParam}`
        : `${baseUrl}/sitemap-questions.xml?source=${sourceParam}&cursor=${encodeURIComponent(bound.toString())}`;
    locs.push(loc);

    bound = batch[batch.length - 1]._id;
    if (batch.length < PAGE_SIZE) break;
  }
  return locs;
}
