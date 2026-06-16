import Navbar from '../../src/components/Navbar'
import Footer from '../../src/components/Footer'
import { ReCaptchaProvider } from '../../src/components/recaptcha'
import MockTests from '../../src/components/MockTests'
import { generateSEOMetadata } from '../../src/components/SEO'
import connectToDatabase from '../../lib/mongodb'
import MockTest from '../../models/mockTest'

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  const metadata = generateSEOMetadata({
    title: 'Mock Tests for Pakistan Competitive Exams - McqsBase',
    description: 'Attempt timed mock tests for university entry tests and Pakistan competitive exams. Review scores, answers, and explanations after each test.',
    keywords: 'mock tests Pakistan, entry test mock test, timed MCQ test, competitive exam mock test, university mock tests',
    url: '/mock-tests'
  });

  const count = await connectToDatabase()
    .then(() => MockTest.countDocuments({}))
    .catch(() => 0);

  if (count === 0) {
    metadata.robots = {
      index: false,
      follow: true,
      googleBot: { index: false, follow: true }
    };
  }

  return metadata;
}

export default function MockTestsPage() {
  const recaptchaSiteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || 'your-recaptcha-site-key';

  return (
    <ReCaptchaProvider siteKey={recaptchaSiteKey}>
      <Navbar />
      <MockTests />
      <Footer />
    </ReCaptchaProvider>
  )
}


