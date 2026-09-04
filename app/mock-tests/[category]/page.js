import { notFound } from 'next/navigation';
import connectToDatabase from '../../../lib/mongodb';
import MockTest from '../../../models/mockTest';
import { generateSEOMetadata } from '../../../src/components/SEO';
import UniversityMockTestsPage from '../../../src/components/UniversityMockTestsPage';
import { sanitizeSubject } from '../../../lib/utils/security';

export const dynamic = 'force-dynamic';

function humanizeSlug(value = '') {
  return value
    .split('-')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

async function getTestCount(category) {
  await connectToDatabase();
  return MockTest.countDocuments({ category, universitySlug: category });
}

export async function generateMetadata({ params }) {
  const { category: rawCategory } = await params;
  const category = sanitizeSubject(rawCategory);
  const label = humanizeSlug(category || rawCategory);

  if (!category || category === 'universities') {
    return { title: 'Mock Tests Not Found - McqsBase', robots: { index: false, follow: false } };
  }

  const count = await getTestCount(category).catch(() => 0);
  const metadata = generateSEOMetadata({
    title: `${label} Mock Tests - McqsBase`,
    description: `Practice ${label} mock tests with timed MCQs, answers, and explanations for exam preparation.`,
    keywords: `${label} mock tests, timed MCQ test, exam practice`,
    url: `/mock-tests/${category}`
  });

  if (count === 0) {
    metadata.robots = {
      index: false,
      follow: true,
      googleBot: { index: false, follow: true }
    };
  }

  return metadata;
}

export default async function Page({ params }) {
  const { category: rawCategory } = await params;
  const category = sanitizeSubject(rawCategory);

  if (!category || category === 'universities') {
    notFound();
  }

  return <UniversityMockTestsPage params={Promise.resolve({ category, target: category, label: humanizeSlug(category) })} />;
}
