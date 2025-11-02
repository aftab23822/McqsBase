import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb.js';
import MCQ from '@/lib/models/MCQ.js';
import Category from '@/lib/models/Category.js';
import { generateQuestionSlug } from '@/lib/utils/slugGenerator.js';
import { sanitizeSubject } from '@/lib/utils/security.js';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://mcqsbase.com';
const MAX_URLS_PER_SITEMAP = 50000; // Google's recommended limit

/**
 * Generate XML sitemap for all MCQ questions
 * Supports pagination for large datasets
 * GET /sitemap-questions.xml or /sitemap-questions.xml?page=1
 */
export async function GET(request) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = MAX_URLS_PER_SITEMAP;

    // Get all categories for MCQ type only
    const categories = await Category.find({ type: 'MCQ' }).lean();

    // Build subject slug mapping with proper normalization
    const subjectSlugMap = {};
    categories.forEach(cat => {
      // Use the same normalization as in the API route
      const normalizedName = cat.name.toLowerCase().trim();
      const slug = sanitizeSubject(normalizedName.replace(/\s+/g, '-'));
      subjectSlugMap[cat._id.toString()] = slug || normalizedName.replace(/\s+/g, '-');
    });

    // Count total MCQs
    const totalMcqs = await MCQ.countDocuments({});
    
    // Fetch MCQs for current page with category info
    const skip = (page - 1) * limit;
    const mcqs = await MCQ.find({})
      .select('_id question categoryId createdAt updatedAt slug')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Generate XML sitemap
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    const currentDate = new Date().toISOString().split('T')[0];

    for (const mcq of mcqs) {
      const subjectSlug = subjectSlugMap[mcq.categoryId?.toString()];
      if (!subjectSlug) {
        console.warn(`No subject slug found for category ${mcq.categoryId}`);
        continue;
      }

      // Use stored slug if available, otherwise generate one
      const questionSlug = mcq.slug || generateQuestionSlug(mcq.question);
      
      // If no stored slug, generate and save it (async, don't block)
      if (!mcq.slug) {
        MCQ.findByIdAndUpdate(mcq._id, { slug: questionSlug }).catch(err => 
          console.error('Failed to save slug:', err)
        );
      }

      const url = `${BASE_URL}/mcqs/${subjectSlug}/question/${questionSlug}`;
      
      // Use updatedAt if available, otherwise createdAt, default to now
      const lastModified = mcq.updatedAt 
        ? new Date(mcq.updatedAt).toISOString().split('T')[0]
        : (mcq.createdAt 
          ? new Date(mcq.createdAt).toISOString().split('T')[0]
          : currentDate);

      xml += '  <url>\n';
      xml += `    <loc>${escapeXml(url)}</loc>\n`;
      xml += `    <lastmod>${lastModified}</lastmod>\n`;
      xml += '    <changefreq>weekly</changefreq>\n';
      xml += '    <priority>0.8</priority>\n';
      xml += '  </url>\n';
    }

    xml += '</urlset>';

    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400'
      }
    });
  } catch (error) {
    console.error('Error generating questions sitemap:', error);
    
    // Return minimal sitemap on error
    const xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n</urlset>';
    return new NextResponse(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, s-maxage=60'
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

