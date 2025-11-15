import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import Navbar from '../../../../src/components/Navbar';
import Footer from '../../../../src/components/Footer';
import { ReCaptchaProvider } from '../../../../src/components/recaptcha';
import SubcategoryQuiz from '../../../../src/components/QuizCategory/SubcategoryQuiz';
import { generateSEOMetadata } from '../../../../src/components/SEO';
import { normalizeCategoryName } from '../../../../src/utils/categoryConfig';

function humanize(slug) {
  if (!slug) return '';
  return slug
    .split('-')
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function humanizePath(segments) {
  if (!Array.isArray(segments) || segments.length === 0) return '';
  return segments.map(humanize).join(' / ');
}

function normalizeSegments(rawSegments) {
  if (!Array.isArray(rawSegments)) return [];
  const normalized = [];
  for (const segment of rawSegments) {
    const norm = normalizeCategoryName(segment || '');
    if (!norm) return [];
    normalized.push(norm);
  }
  return normalized;
}

export async function generateMetadata({ params }) {
  // In Next.js 15+, params is a Promise and must be awaited
  const resolvedParams = await params;
  const { subject } = resolvedParams;
  const rawSegments = Array.isArray(resolvedParams.subcategory)
    ? resolvedParams.subcategory
    : typeof resolvedParams.subcategory === 'string'
      ? [resolvedParams.subcategory]
      : [];

  const displaySubject = humanize(subject);
  const displaySubPath = humanizePath(rawSegments);
  const title = displaySubPath
    ? `${displaySubject} - ${displaySubPath} Quiz`
    : `${displaySubject} Quiz`;

  return generateSEOMetadata({
    title,
    description: `Practice ${displaySubPath || displaySubject} quizzes from ${displaySubject} with detailed explanations.`,
    keywords: `${subject} ${rawSegments.join(' ')} quiz`.trim(),
    url: `/quiz/${[subject, ...rawSegments].join('/')}`
  });
}

export default async function SubcategoryQuizPage({ params, searchParams }) {
  // In Next.js 15+, params and searchParams are Promises and must be awaited
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const { subject } = resolvedParams;
  const rawSegments = Array.isArray(resolvedParams.subcategory)
    ? resolvedParams.subcategory
    : typeof resolvedParams.subcategory === 'string'
      ? [resolvedParams.subcategory]
      : [];

  const normalizedSubject = normalizeCategoryName(subject || '');
  const normalizedSegments = normalizeSegments(rawSegments);

  if (!normalizedSubject || normalizedSegments.length === 0) {
    notFound();
  }

  const pageParam = parseInt(resolvedSearchParams?.page || '1', 10);
  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
  const recaptchaSiteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || 'your-recaptcha-site-key';

  return (
    <ReCaptchaProvider siteKey={recaptchaSiteKey}>
      <Navbar />
      <Suspense fallback={<div className="py-12 text-center text-gray-500">Loading quiz…</div>}>
        <SubcategoryQuiz
          subject={normalizedSubject}
          subcategorySegments={normalizedSegments}
          initialPage={page}
        />
      </Suspense>
      <Footer />
    </ReCaptchaProvider>
  );
}

export const dynamic = 'force-dynamic';


