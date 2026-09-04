import { notFound } from 'next/navigation';
import connectToDatabase from '../../../../lib/mongodb';
import MockTest from '../../../../models/mockTest';
import { generateSEOMetadata } from '../../../../src/components/SEO';
import UniversityMockTestsPage from '../../../../src/components/UniversityMockTestsPage';
import { sanitizeSubject } from '../../../../lib/utils/security';

export const dynamic = 'force-dynamic';

function humanizeSlug(value = '') {
  return value
    .split('-')
    .filter(Boolean)
    .map((word) => word.toUpperCase() === word ? word : word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

async function getTestCount(university) {
  await connectToDatabase();
  return MockTest.countDocuments({
    universitySlug: university,
    $or: [{ category: 'universities' }, { category: { $exists: false } }]
  });
}

export async function generateMetadata({ params }) {
  const { university: rawUniversity } = await params;
  const university = sanitizeSubject(rawUniversity);
  const label = humanizeSlug(university || rawUniversity);

  if (!university) {
    return { title: 'Mock Tests Not Found - McqsBase', robots: { index: false, follow: false } };
  }

  const count = await getTestCount(university).catch(() => 0);
  const metadata = generateSEOMetadata({
    title: `${label} Mock Tests - McqsBase`,
    description: `Practice ${label} mock tests with timed MCQs, answers, and explanations for entry test and competitive exam preparation.`,
    keywords: `${label} mock tests, ${label} entry test, university MCQ practice, Pakistan mock tests`,
    url: `/mock-tests/universities/${university}`
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
  const { university: rawUniversity } = await params;
  const university = sanitizeSubject(rawUniversity);

  if (!university) {
    notFound();
  }

  return <UniversityMockTestsPage params={Promise.resolve({ category: 'universities', target: university, university })} />;
}
