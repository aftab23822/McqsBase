import { GET as getPastPapers } from '../api/pastpapers/by-category/[commission]/[department]/[role]/route';
import { SITE_URL } from '../../lib/utils/siteUrl';
import { generateSEOMetadata } from '../../src/components/SEO';
import PastPapersPage from '../../src/components/PastPapersPage';

export async function generateMetadata({ searchParams }) {
  const query = await searchParams;
  const page = Math.max(1, parseInt(query?.page || '1', 10) || 1);
  return generateSEOMetadata({
    title: 'Past Papers for Pakistan Competitive Exams - McqsBase',
    description: 'Practice past papers for STS, FPSC, SPSC, PPSC, NTS, and other Pakistan competitive exams with MCQs, answers, and category-wise preparation material.',
    keywords: 'Pakistan past papers, FPSC past papers, SPSC past papers, PPSC past papers, NTS past papers, STS past papers, solved past papers',
    url: `/past-papers${page > 1 ? `?page=${page}` : ''}`
  });
}

export default async function Page({ searchParams }) {
  const query = await searchParams;
  const page = Math.max(1, parseInt(query?.page || '1', 10) || 1);
  const params = { commission: 'sts-siba-testing-services', department: 'bps-05-to-15-', role: 'intermediate-category' };
  const response = await getPastPapers(new Request(SITE_URL + '/api/pastpapers/by-category/' + Object.values(params).join('/') + '?page=' + page + '&limit=10&exact=true'), { params: Promise.resolve(params) });
  if (!response.ok) throw new Error('Unable to load past papers');
  return <PastPapersPage key={page} initialData={await response.json()} initialPage={page} />;
}
