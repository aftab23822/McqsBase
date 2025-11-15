import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb.js';
import MCQ from '@/lib/models/MCQ.js';
import PastPaper from '@/lib/models/PastPaper.js';
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
 * Generate XML sitemap for MCQ and Past Paper question pages
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

    // Fetch questions from both collections
    // We need to combine them and sort together to paginate correctly
    // Strategy: Fetch enough from both collections to cover the pagination window,
    // combine, sort, then slice the requested page
    // Fetch a bit more than needed to ensure we have enough after combining
    const fetchLimit = skip + limit + 1000; // Fetch extra to account for distribution

    const [allMcqs, allPastPapers] = await Promise.all([
      MCQ.find(mcqFilter)
        .sort({ _id: -1 })
        .limit(fetchLimit)
        .select({ slug: 1, question: 1, updatedAt: 1, categoryId: 1, _id: 1 })
        .lean(),
      PastPaper.find(pastPaperFilter)
        .sort({ _id: -1 })
        .limit(fetchLimit)
        .select({ slug: 1, question: 1, updatedAt: 1, categoryId: 1, _id: 1 })
        .lean()
    ]);

    // Mark each item with its type and combine
    const allQuestions = [
      ...allMcqs.map(q => ({ ...q, type: 'mcq' })),
      ...allPastPapers.map(q => ({ ...q, type: 'pastpaper' }))
    ].sort((a, b) => {
      // Sort by _id descending (newest first) - compare ObjectIds as strings
      const aId = a._id.toString();
      const bId = b._id.toString();
      return aId > bId ? -1 : aId < bId ? 1 : 0;
    });

    // Apply pagination to combined results
    const paginatedQuestions = allQuestions.slice(skip, skip + limit);

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
        urlsXml += `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.6</priority>\n  </url>\n`;
        urlCount += 1;
      }
    }

    if (isDebug) {
      return new NextResponse(JSON.stringify({
        page,
        limit,
        skip,
        total,
        mcqCount: allMcqs.length,
        pastPaperCount: allPastPapers.length,
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

