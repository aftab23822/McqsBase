import { generateSEOMetadata } from '../../src/components/SEO';
import PastPapersPage from '../../src/components/PastPapersPage';

export async function generateMetadata() {
  return generateSEOMetadata({
    title: 'Past Papers for Pakistan Competitive Exams - McqsBase',
    description: 'Practice past papers for STS, FPSC, SPSC, PPSC, NTS, and other Pakistan competitive exams with MCQs, answers, and category-wise preparation material.',
    keywords: 'Pakistan past papers, FPSC past papers, SPSC past papers, PPSC past papers, NTS past papers, STS past papers, solved past papers',
    url: '/past-papers'
  });
}

export default function Page() {
  return <PastPapersPage />;
}
