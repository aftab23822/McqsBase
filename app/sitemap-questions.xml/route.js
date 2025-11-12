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
  const searchParams = request.nextUrl?.searchParams ?? new URL(request.url).searchParams;
  const hasPageParam = searchParams.has('page');
  const pageParam = parseInt(searchParams.get('page') || '1', 10);
  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
  const isDebug = searchParams.get('debug') === '1';
  const limit = PAGE_SIZE;
  const skip = (page - 1) * limit;

  try {
    await connectToDatabase();

    // Fetch MCQs that have a question and a category
    const filter = {
      question: { $exists: true, $ne: null, $ne: '' },
      categoryId: { $exists: true, $ne: null }
    };

    const total = await MCQ.countDocuments(filter);

    const baseUrl = getBaseUrl(request);

    // When no page is specified, serve a sitemap index that enumerates all pages
    if (!hasPageParam) {
      if (total === 0) {
        const emptyIndexXml = `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></sitemapindex>`;
        return new Response(emptyIndexXml, {
          headers: {
            'content-type': 'application/xml; charset=utf-8',
            'cache-control': 'public, s-maxage=3600, stale-while-revalidate=86400'
          }
        });
      }

      const totalPages = Math.max(1, Math.ceil(total / limit));
      const lastmod = new Date().toISOString();
      let sitemapEntries = '';
      for (let pageIndex = 1; pageIndex <= totalPages; pageIndex += 1) {
        const loc = `${baseUrl}/sitemap-questions.xml?page=${pageIndex}`;
        sitemapEntries += `  <sitemap>\n    <loc>${loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n  </sitemap>\n`;
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

    if (skip >= total) {
      if (isDebug) {
        return NextResponse.json({
          page,
          limit,
          skip,
          total,
          reason: 'page_out_of_range'
        });
      }
      const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>`;
      return new Response(xml, {
        status: hasPageParam ? 404 : 200,
        headers: {
          'content-type': 'application/xml; charset=utf-8',
          'cache-control': hasPageParam ? 'no-store' : 'public, s-maxage=3600, stale-while-revalidate=86400'
        }
      });
    }

    const mcqs = await MCQ.find(filter)
      .sort({ _id: -1 })
      .skip(skip)
      .limit(limit)
      .select({ slug: 1, question: 1, updatedAt: 1, categoryId: 1 })
      .lean();

    const categoryIdsForPage = Array.from(
      new Set(
        mcqs
          .map(mcq => mcq.categoryId?.toString())
          .filter(Boolean)
      )
    );

    const categoriesForPage = categoryIdsForPage.length
      ? await Category.find({ _id: { $in: categoryIdsForPage } })
        .select({ _id: 1, name: 1 })
        .lean()
      : [];

    const categoryIdToSubjectSlug = new Map();
    for (const category of categoriesForPage) {
      const normalized = normalizeCategoryName(category.name || '').trim();
      const subjectSlug = normalized || `category-${category._id.toString()}`;
      categoryIdToSubjectSlug.set(category._id.toString(), subjectSlug);
    }

    // Build XML entries
    let urlCount = 0;
    let urlsXml = '';
    for (const mcq of mcqs) {
      const categoryId = mcq.categoryId?.toString();
      if (!categoryId) continue;
      const subjectSlug = categoryIdToSubjectSlug.get(categoryId) || `category-${categoryId}`;
      const questionSlug = mcq.slug || generateQuestionSlug(mcq.question || 'question');
      const loc = `${baseUrl}/mcqs/${subjectSlug}/question/${questionSlug}`;
      const lastmod = new Date(mcq.updatedAt || Date.now()).toISOString();
      urlsXml += `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.6</priority>\n  </url>\n`;
      urlCount += 1;
    }

    if (isDebug) {
      return new NextResponse(JSON.stringify({
        page,
        limit,
        skip,
        total,
        mcqCount: mcqs.length,
        urlCount,
        categoryIds: categoryIdsForPage,
        sample: mcqs.slice(0, 3)
      }), {
        status: 200,
        headers: {
          'content-type': 'application/json; charset=utf-8'
        }
      });
    }

    if (isDebug) {
      return NextResponse.json({
        page,
        limit,
        skip,
        total,
        mcqCount: mcqs.length,
        urlCount,
        categoryIds: categoryIdsForPage,
        sample: mcqs.slice(0, 3)
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

