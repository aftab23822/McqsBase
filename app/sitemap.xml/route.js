import { NextResponse } from 'next/server';
import { listQuestionSitemaps } from '../../lib/services/questionSitemap';
import { SITE_URL, escapeXml } from '../../lib/utils/siteUrl';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Google requires leaf sitemaps here; nesting sitemap indexes hides shards.
    const locations = [SITE_URL + '/sitemap-main.xml', ...await listQuestionSitemaps()];
    const xml = '<?xml version="1.0" encoding="UTF-8"?>\n' +
      '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' +
      locations.map(loc => '<sitemap><loc>' + escapeXml(loc) + '</loc></sitemap>').join('') +
      '</sitemapindex>';
    return new NextResponse(xml, { headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400'
    }});
  } catch (error) {
    console.error('Failed to generate sitemap index:', error);
    return new NextResponse('Sitemap temporarily unavailable', {
      status: 503, headers: { 'Cache-Control': 'no-store', 'Retry-After': '300' }
    });
  }
}
