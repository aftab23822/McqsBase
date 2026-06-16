import { NextResponse } from 'next/server';
import { blogArticles } from '../../src/data/blogArticles';
import { listPublishedBlogs } from '../../lib/services/blogService';

const BASE_URL = (process.env.NEXT_PUBLIC_BASE_URL || 'https://www.mcqsbase.com').replace(/\/+$/, '');

function lastmodForBlogArticle(article, fallbackDate) {
  const d = article?.date;
  if (typeof d === 'string' && /^\d{4}$/.test(d)) {
    return `${d}-12-31`;
  }
  return fallbackDate;
}

/**
 * Main Pages Sitemap - Static pages, categories, etc.
 * GET /sitemap-main.xml
 */
export async function GET() {
  const currentDate = new Date().toISOString().split('T')[0];
  let dynamicBlogs = [];

  try {
    dynamicBlogs = await listPublishedBlogs(50000);
  } catch (error) {
    console.error('Failed to load dynamic blogs for sitemap:', error);
  }

  const blogSitemapXml = `
  <url>
    <loc>${BASE_URL}/blog</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
${Object.keys(blogArticles)
  .map((slug) => {
    const lm = lastmodForBlogArticle(blogArticles[slug], currentDate);
    return `  <url>
    <loc>${BASE_URL}/blog/${encodeURIComponent(slug)}</loc>
    <lastmod>${lm}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`;
  })
  .join('\n')}
${dynamicBlogs
  .map((blog) => {
    const lm = blog.updatedAt ? new Date(blog.updatedAt).toISOString().split('T')[0] : currentDate;
    return `  <url>
    <loc>${BASE_URL}/blog/${encodeURIComponent(blog.seoUri)}</loc>
    <lastmod>${lm}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
  })
  .join('\n')}`;

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Main Pages -->
  <url>
    <loc>${BASE_URL}/</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  
  <url>
    <loc>${BASE_URL}/mcqs</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  
  <url>
    <loc>${BASE_URL}/quiz</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  
  <url>
    <loc>${BASE_URL}/past-papers</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  
  <url>
    <loc>${BASE_URL}/past-interviews</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  
  <url>
    <loc>${BASE_URL}/mock-tests</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  
  <url>
    <loc>${BASE_URL}/contact</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
  
  <url>
    <loc>${BASE_URL}/submit-mcqs</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  
  <url>
    <loc>${BASE_URL}/privacy-policy</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.4</priority>
  </url>
  
  <url>
    <loc>${BASE_URL}/terms-of-service</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.4</priority>
  </url>
  
  <url>
    <loc>${BASE_URL}/sitemap</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.3</priority>
  </url>${blogSitemapXml}
</urlset>`;

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400'
    }
  });
}

