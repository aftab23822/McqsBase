import { notFound } from 'next/navigation';
import connectToDatabase from '../../../../../lib/mongodb';
import MockTest from '../../../../../models/mockTest';
import { generateSEOMetadata } from '../../../../../src/components/SEO';
import MockTestRunnerPage from '../../../../../src/components/MockTestRunnerPage';
import { sanitizeString, sanitizeSubject } from '../../../../../lib/utils/security';

export const dynamic = 'force-dynamic';

function humanizeSlug(value = '') {
  return value
    .split('-')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

async function getMockTest(university, slug) {
  await connectToDatabase();
  return MockTest.findOne({ universitySlug: university, slug }).lean();
}

export async function generateMetadata({ params }) {
  const { university: rawUniversity, slug: rawSlug } = await params;
  const university = sanitizeSubject(rawUniversity);
  const slug = sanitizeString(rawSlug || '', 200);

  if (!university || !slug) {
    return { title: 'Mock Test Not Found - McqsBase', robots: { index: false, follow: false } };
  }

  const test = await getMockTest(university, slug).catch(() => null);
  if (!test) {
    return { title: 'Mock Test Not Found - McqsBase', robots: { index: false, follow: false } };
  }

  const questionCount = Array.isArray(test.questions) ? test.questions.length : 0;
  const metadata = generateSEOMetadata({
    title: `${test.name} - Mock Test | McqsBase`,
    description: `Attempt ${test.name} with ${questionCount} timed MCQs, answers, and explanations for ${humanizeSlug(university)} exam preparation.`,
    keywords: `${test.name}, ${humanizeSlug(university)} mock test, timed MCQ test, entry test practice`,
    url: `/mock-tests/universities/${university}/${slug}`
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
  const { university: rawUniversity, slug: rawSlug } = await params;
  const university = sanitizeSubject(rawUniversity);
  const slug = sanitizeString(rawSlug || '', 200);

  if (!university || !slug) {
    notFound();
  }

  const test = await getMockTest(university, slug).catch(() => null);
  if (!test) {
    notFound();
  }

  return <MockTestRunnerPage params={Promise.resolve({ university, slug })} />;
}
