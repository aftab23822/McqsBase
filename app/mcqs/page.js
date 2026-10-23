import Navbar from '../../src/components/Navbar'
import SubjectMcqsClient from '../../src/components/MCQsCategory/SubjectMcqsClient'
import { getSubjectPage } from '../../lib/services/subjectPage'
import Footer from '../../src/components/Footer'
import { ReCaptchaProvider } from '../../src/components/recaptcha'
import { generateSEOMetadata } from '../../src/components/SEO'

export async function generateMetadata({ searchParams }) {
  const query = await searchParams;
  const page = Math.max(1, parseInt(query?.page || '1', 10) || 1);
  return generateSEOMetadata({
    title: 'MCQs for Pakistan Competitive Exams - McqsBase',
    description: 'Practice subject-wise MCQs for FPSC, SPSC, PPSC, NTS, CSS, PMS, and other Pakistan competitive exams with answers and explanations.',
    keywords: 'MCQs Pakistan, FPSC MCQs, SPSC MCQs, PPSC MCQs, NTS MCQs, CSS MCQs, competitive exam questions',
    url: `/mcqs${page > 1 ? `?page=${page}` : ''}`
  });
}

export default async function McqsPage({ searchParams }) {
  const query = await searchParams;
  const page = Math.max(1, parseInt(query?.page || '1', 10) || 1);
  const { data } = await getSubjectPage('general-knowledge', page);
  const recaptchaSiteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || 'your-recaptcha-site-key';

  return (
    <ReCaptchaProvider siteKey={recaptchaSiteKey}>
      <Navbar />
      <SubjectMcqsClient key={page} initialData={data} page={page} subject="general-knowledge" title="MCQs Practice — General Knowledge" listingPath="/mcqs" />
      <Footer />
    </ReCaptchaProvider>
  )
}
