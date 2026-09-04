import { notFound } from 'next/navigation';
import connectToDatabase from '../../../../lib/mongodb';
import MockTest from '../../../../models/mockTest';
import { generateSEOMetadata } from '../../../../src/components/SEO';
import MockTestRunnerPage from '../../../../src/components/MockTestRunnerPage';
import { sanitizeString, sanitizeSubject } from '../../../../lib/utils/security';

export const dynamic = 'force-dynamic';

function humanizeSlug(value = '') {
  return value
    .split('-')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

async function getMockTest(category, slug) {
  await connectToDatabase();
  return MockTest.findOne({ category, universitySlug: category, slug }).lean();
}

export async function generateMetadata({ params }) {
  const { category: rawCategory, slug: rawSlug } = await params;
  const category = sanitizeSubject(rawCategory);
  const slug = sanitizeString(rawSlug || '', 200);

  if (!category || category === 'universities' || !slug) {
    return { title: 'Mock Test Not Found - McqsBase', robots: { index: false, follow: false } };
  }

  const test = await getMockTest(category, slug).catch(() => null);
  if (!test) {
    return { title: 'Mock Test Not Found - McqsBase', robots: { index: false, follow: false } };
  }

  const questionCount = Array.isArray(test.questions) ? test.questions.length : 0;
  const label = humanizeSlug(category);
  const metadata = generateSEOMetadata({
    title: `${test.name} - Mock Test | McqsBase`,
    description: `Attempt ${test.name} with ${questionCount} timed MCQs, answers, and explanations for ${label} exam preparation.`,
    keywords: `${test.name}, ${label} mock test, timed MCQ test, exam practice`,
    url: `/mock-tests/${category}/${slug}`
  });

  if (questionCount < 5) {
    metadata.robots = {
      index: false,
      follow: true,
      googleBot: { index: false, follow: true }
    };
  }

  return metadata;
}

export default async function Page({ params }) {
  const { category: rawCategory, slug: rawSlug } = await params;
  const category = sanitizeSubject(rawCategory);
  const slug = sanitizeString(rawSlug || '', 200);

  if (!category || category === 'universities' || !slug) {
    notFound();
  }

  const test = await getMockTest(category, slug).catch(() => null);
  if (!test) {
    notFound();
  }

  return <MockTestRunnerPage params={Promise.resolve({ category, target: category, label: humanizeSlug(category), slug })} />;
}
