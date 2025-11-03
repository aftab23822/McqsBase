import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb.js';
import MCQ from '@/lib/models/MCQ.js';
import Category from '@/lib/models/Category.js';
import { generateQuestionSlug } from '@/lib/utils/slugGenerator.js';
import { normalizeCategoryName } from '@/utils/categoryConfig';

const FALLBACK_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://mcqsbase.com';
const PAGE_SIZE = 10000; // Reasonable chunk size well under Google's 50k limit

// Derive absolute base URL from the request (works locally and in prod)
function getBaseUrl(request) {
  try {
    const proto = request.headers.get('x-forwarded-proto') || 'http';
    const host = request.headers.get('host') || '';
    if (host) return `${proto}://${host}`;
  } catch {}
  return FALLBACK_BASE_URL;
}

/**
 * Generate XML sitemap for MCQ question pages
 * Supports pagination: /sitemap-questions.xml?page=1
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const pageParam = parseInt(searchParams.get('page') || '1', 10);
  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
  const limit = PAGE_SIZE;
  const skip = (page - 1) * limit;

  try {
    await connectToDatabase();

    // Map categoryId => subjectSlug for MCQ categories only
    const categories = await Category.find({ type: 'MCQ' }).select({ _id: 1, name: 1 }).lean();
    const allowedCategoryIds = new Set(categories.map(c => c._id.toString()));
    const categoryIdToSubjectSlug = new Map(
      categories.map(c => [c._id.toString(), normalizeCategoryName(c.name || '')])
    );

    // Fetch MCQs that have a slug and belong to allowed categories
    const filter = { slug: { $exists: true, $ne: null, $ne: '' }, categoryId: { $in: Array.from(allowedCategoryIds) } };

    const [total, mcqs] = await Promise.all([
      MCQ.countDocuments(filter),
      MCQ.find(filter)
        .sort({ updatedAt: -1, _id: -1 })
        .skip(skip)
        .limit(limit)
        .select({ slug: 1, question: 1, updatedAt: 1, categoryId: 1 })
        .lean()
    ]);

    const baseUrl = getBaseUrl(request);

    // Build XML entries
    let urlsXml = '';
    for (const mcq of mcqs) {
      const categoryId = mcq.categoryId?.toString();
      if (!categoryId) continue;
      const subjectSlug = categoryIdToSubjectSlug.get(categoryId);
      if (!subjectSlug) continue;
      const questionSlug = mcq.slug || generateQuestionSlug(mcq.question || 'question');
      const loc = `${baseUrl}/mcqs/${subjectSlug}/question/${questionSlug}`;
      const lastmod = new Date(mcq.updatedAt || Date.now()).toISOString();
      urlsXml += `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.6</priority>\n  </url>\n`;
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n` +
      `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
      `${urlsXml}</urlset>`;

    return new Response(xml, {
      headers: {
        'content-type': 'application/xml; charset=utf-8',
        'cache-control': 'public, s-maxage=3600, stale-while-revalidate=86400'
      }
    });
  } catch (err) {
    // Fallback minimal empty sitemap on error
    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>`;
    return new Response(xml, {
      status: 200,
      headers: {
        'content-type': 'application/xml; charset=utf-8',
        'cache-control': 'no-store'
      }
    });
  }
}

/**
 * Escape XML special characters
 */
function escapeXml(unsafe) {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

