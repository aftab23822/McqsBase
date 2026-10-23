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

export default async function MockTestsPage() {
  await connectToDatabase();
  const tests = await MockTest.aggregate([
    { $sort: { lastUpdatedAt: -1, _id: -1 } },
    { $limit: 6 },
    { $project: { name: 1, slug: 1, universitySlug: 1, category: 1, durationMinutes: 1, lastUpdatedAt: 1, updatedAt: 1, questionCount: { $size: { $ifNull: ['$questions', []] } } } }
  ]);
  const initialTests = JSON.parse(JSON.stringify(tests)).map(test => ({
    ...test,
    category: test.category || 'universities',
    targetSlug: test.universitySlug,
    targetName: (test.universitySlug || test.category || '').split('-').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(' ')
  }));
  const recaptchaSiteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || 'your-recaptcha-site-key';

  return (
    <ReCaptchaProvider siteKey={recaptchaSiteKey}>
      <Navbar />
      <MockTests initialTests={initialTests} />
      <Footer />
    </ReCaptchaProvider>
  )
}


