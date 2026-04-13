import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectToDatabase from '@/lib/mongodb.js';
import MCQ from '@/lib/models/MCQ.js';
import PastPaper from '@/lib/models/PastPaper.js';
import Category from '@/lib/models/Category.js';
import { generateQuestionSlug } from '@/lib/utils/slugGenerator.js';
import { normalizeCategoryName } from '@/utils/categoryConfig';

const FALLBACK_BASE_URL = (process.env.NEXT_PUBLIC_BASE_URL || 'https://www.mcqsbase.com').replace(/\/+$/, '');
/** URLs per sitemap shard; index page counts follow ceil(count / PAGE_SIZE) from live DB totals. */
const PAGE_SIZE = 1000;

// Derive absolute base URL from the request (works locally and in prod)
function getBaseUrl(request) {
  try {
    const proto = request.headers.get('x-forwarded-proto') || 'http';
    const host = request.headers.get('host') || '';
    if (host) return `${proto}://${host}`.replace(/\/+$/, '');
  } catch {}
  return FALLBACK_BASE_URL;
}

/**
 * Generate XML sitemap for MCQ and Past Paper question pages
 * Index: /sitemap-questions.xml — child sitemaps use ?source=mcq|pastpaper&cursor=<ObjectId> (keyset; fast)
 *        First shard: ?source=mcq only. Legacy ?page=N still supported but is slow for large N.
 */
export async function GET(request) {
  const searchParams = request.nextUrl?.searchParams ?? new URL(request.url).searchParams;
  const hasPageParam = searchParams.has('page');
  const hasSourceParam = searchParams.has('source');
  const pageParam = parseInt(searchParams.get('page') || '1', 10);
  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
  const isDebug = searchParams.get('debug') === '1';
  const limit = PAGE_SIZE;
  const skip = (page - 1) * limit;
  const cursorRaw = searchParams.get('cursor');
  const hasCursor = cursorRaw !== null && cursorRaw !== '';
  const sourceRaw = searchParams.get('source');
  const source =
    sourceRaw === 'mcq' || sourceRaw === 'pastpaper' ? sourceRaw : null;

  if (hasSourceParam && !source) {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>`;
    return new Response(xml, {
      status: 400,
      headers: {
        'content-type': 'application/xml; charset=utf-8',
        'cache-control': 'no-store'
      }
    });
  }

  if (hasCursor && !mongoose.Types.ObjectId.isValid(cursorRaw)) {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>`;
    return new Response(xml, {
      status: 400,
      headers: {
        'content-type': 'application/xml; charset=utf-8',
        'cache-control': 'no-store'
      }
    });
  }

  try {
    await connectToDatabase();

    // Fetch MCQs that have a question and a category
    const mcqFilter = {
      question: { $exists: true, $ne: null, $ne: '' },
      categoryId: { $exists: true, $ne: null }
    };

    // Fetch Past Papers that have a question and a category
    const pastPaperFilter = {
      question: { $exists: true, $ne: null, $ne: '' },
      categoryId: { $exists: true, $ne: null }
    };

    // Get total count from both collections
    const [mcqTotal, pastPaperTotal] = await Promise.all([
      MCQ.countDocuments(mcqFilter),
      PastPaper.countDocuments(pastPaperFilter)
    ]);

    const total = mcqTotal + pastPaperTotal;

    const baseUrl = getBaseUrl(request);

    // Sitemap index: no page and no source (avoids ?source=mcq alone being treated as index)
    if (!hasPageParam && !hasSourceParam) {
      if (total === 0) {
        const emptyIndexXml = `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></sitemapindex>`;
        return new Response(emptyIndexXml, {
          headers: {
            'content-type': 'application/xml; charset=utf-8',
            'cache-control': 'public, s-maxage=3600, stale-while-revalidate=86400'
          }
        });
      }

      const lastmod = new Date().toISOString();
      let sitemapEntries = '';
      const mcqLocs =
        mcqTotal > 0 ? await buildKeysetShardLocators(MCQ, mcqFilter, baseUrl, 'mcq') : [];
      const ppLocs =
        pastPaperTotal > 0
          ? await buildKeysetShardLocators(PastPaper, pastPaperFilter, baseUrl, 'pastpaper')
          : [];
      for (const loc of mcqLocs) {
        sitemapEntries += `  <sitemap>\n    <loc>${escapeXml(loc)}</loc>\n    <lastmod>${lastmod}</lastmod>\n  </sitemap>\n`;
      }
      for (const loc of ppLocs) {
        sitemapEntries += `  <sitemap>\n    <loc>${escapeXml(loc)}</loc>\n    <lastmod>${lastmod}</lastmod>\n  </sitemap>\n`;
      }

      const indexXml = `<?xml version="1.0" encoding="UTF-8"?>\n` +
        `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
        `${sitemapEntries}</sitemapindex>`;

      return new Response(indexXml, {
        headers: {
          'content-type': 'application/xml; charset=utf-8',
          'cache-control': 'public, s-maxage=3600, stale-while-revalidate=86400'
        }
      });
    }

    if (!source) {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>`;
      return new Response(xml, {
        status: 400,
        headers: {
          'content-type': 'application/xml; charset=utf-8',
          'cache-control': 'no-store'
        }
      });
    }

    const sliceTotal = source === 'mcq' ? mcqTotal : pastPaperTotal;
    const baseFilter = source === 'mcq' ? mcqFilter : pastPaperFilter;
    const Model = source === 'mcq' ? MCQ : PastPaper;

    let mongoFilter = baseFilter;
    let useLegacySkip = false;
    let skipValue = 0;

    if (hasCursor) {
      mongoFilter = {
        ...baseFilter,
        _id: { $lt: new mongoose.Types.ObjectId(cursorRaw) }
      };
    } else if (hasPageParam && page > 1) {
      useLegacySkip = true;
      skipValue = skip;
      if (skipValue >= sliceTotal) {
        if (isDebug) {
          return NextResponse.json({
            page,
            limit,
            skip: skipValue,
            total: sliceTotal,
            source,
            reason: 'page_out_of_range'
          });
        }
        const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>`;
        return new Response(xml, {
          status: 404,
          headers: {
            'content-type': 'application/xml; charset=utf-8',
            'cache-control': 'no-store'
          }
        });
      }
    }

    let query = Model.find(mongoFilter)
      .sort({ _id: -1 })
      .limit(limit)
      .select({ slug: 1, question: 1, updatedAt: 1, categoryId: 1, _id: 1 });
    if (useLegacySkip) {
      query = query.skip(skipValue);
    }
    const rows = await query.lean();
    const paginatedQuestions = rows.map((q) => ({
      ...q,
      type: source === 'pastpaper' ? 'pastpaper' : 'mcq'
    }));

    // Get all unique category IDs from this page
    const categoryIdsForPage = Array.from(
      new Set(
        paginatedQuestions
          .map(q => q.categoryId?.toString())
          .filter(Boolean)
      )
    );

    // Fetch all categories for this page
    const categoriesForPage = categoryIdsForPage.length
      ? await Category.find({ _id: { $in: categoryIdsForPage } })
        .select({ _id: 1, name: 1, type: 1 })
        .lean()
      : [];

    // Build maps for category lookup
    const categoryIdToCategory = new Map();
    for (const category of categoriesForPage) {
      categoryIdToCategory.set(category._id.toString(), category);
    }

    // Helper function to check if a category is a past paper category
    const isPastPaperCategory = (categoryName) => {
      if (!categoryName) return false;
      const name = categoryName.toLowerCase();
      return name.startsWith('/past-papers/') || 
             name.startsWith('past-papers/') ||
             name.includes('/past-papers/');
    };

    // Helper function to extract category path from category name for past papers
    const extractCategoryPath = (categoryName) => {
      if (!categoryName) return null;
      // Remove leading/trailing slashes and 'past-papers' prefix
      let path = categoryName.replace(/^\/+|\/+$/g, '');
      if (path.startsWith('past-papers/')) {
        path = path.replace(/^past-papers\//, '');
      } else if (path.startsWith('/past-papers/')) {
        path = path.replace(/^\/past-papers\//, '');
      }
      return path;
    };

    // Build XML entries
    let urlCount = 0;
    let urlsXml = '';
    for (const question of paginatedQuestions) {
      const categoryId = question.categoryId?.toString();
      if (!categoryId) continue;

      const category = categoryIdToCategory.get(categoryId);
      if (!category) continue;

      const questionSlug = question.slug || generateQuestionSlug(question.question || 'question');
      const lastmod = new Date(question.updatedAt || Date.now()).toISOString();
      let loc = '';

      // Determine URL format based on category type
      if (isPastPaperCategory(category.name)) {
        // Past paper question: /past-papers/commission/department/role/question/slug
        const categoryPath = extractCategoryPath(category.name);
        if (categoryPath) {
          loc = `${baseUrl}/past-papers/${categoryPath}/question/${questionSlug}`;
        } else {
          // Fallback: use normalized name
          const normalized = normalizeCategoryName(category.name || '').trim();
          loc = `${baseUrl}/past-papers/${normalized}/question/${questionSlug}`;
        }
      } else {
        // MCQ question: /mcqs/subject-slug/question/slug
        const normalized = normalizeCategoryName(category.name || '').trim();
        const subjectSlug = normalized || `category-${categoryId}`;
        loc = `${baseUrl}/mcqs/${subjectSlug}/question/${questionSlug}`;
      }

      if (loc) {
        urlsXml += `  <url>\n    <loc>${escapeXml(loc)}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
        urlCount += 1;
      }
    }

    if (isDebug) {
      return new NextResponse(JSON.stringify({
        page,
        limit,
        skip: useLegacySkip ? skipValue : 0,
        cursor: hasCursor ? cursorRaw : null,
        legacySkip: useLegacySkip,
        total: sliceTotal,
        source,
        paginatedCount: paginatedQuestions.length,
        urlCount,
        categoryIds: categoryIdsForPage,
        sample: paginatedQuestions.slice(0, 3)
      }), {
        status: 200,
        headers: {
          'content-type': 'application/json; charset=utf-8'
        }
      });
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
    console.error('[sitemap-questions.xml]', err);
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
 * Build shard URLs using keyset pagination on _id (desc). Avoids MongoDB skip(N) for large N (timeouts / GSC "could not be read").
 */
async function buildKeysetShardLocators(Model, filter, baseUrl, sourceParam) {
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

