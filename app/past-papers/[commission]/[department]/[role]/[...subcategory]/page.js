// Server entry for past-paper listings and single questions. The page used to be a pure
// client component, so crawlers received a spinner with homepage metadata and every
// unknown path returned 200 (soft 404). Questions are now server-rendered with their own
// title, canonical and structured data; listings keep the client UI but get real metadata
// and a 404 when no category backs the path.
import { cache } from 'react';
import { notFound } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import IndividualQuestion from '@/components/IndividualQuestion';
import PastPaperSubcategoryClient from '@/components/PastPapers/PastPaperSubcategoryClient';
import { pastPaperListingMetadata } from '@/components/PastPapers/listingMetadata';
import { DEFAULT_BASE_URL, generateSEOMetadata } from '@/components/SEO';
import generateIntro from '@/lib/generateIntro';
import { findPastPaperQuestion, pastPaperListingExists } from '@/lib/services/pastPaperQuestion';

const QUESTION_SEGMENT = 'question';

const getQuestion = cache((categoryKey, slug) => findPastPaperQuestion(categoryKey.split('/'), slug));
const listingExists = cache((categoryKey) => pastPaperListingExists(categoryKey.split('/')));

function humanize(slug) {
  return (slug || '').split('-').filter(Boolean).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

async function routeOf(params) {
  const { commission, department, role, subcategory } = await params;
  const raw = Array.isArray(subcategory) ? subcategory : subcategory ? [subcategory] : [];
  const isQuestion = raw.length >= 2 && raw[raw.length - 2] === QUESTION_SEGMENT;
  const sub = isQuestion ? raw.slice(0, -2) : raw;
  const categorySegments = [commission, department, role, ...sub].filter(Boolean);
  return {
    commission, department, role, sub, isQuestion,
    questionSlug: isQuestion ? raw[raw.length - 1] : null,
    categoryKey: categorySegments.join('/'),
    label: sub.length ? humanize(sub[sub.length - 1]) : humanize(role),
    roleLabel: humanize(role),
    commissionLabel: humanize(commission),
  };
}

export async function generateMetadata({ params }) {
  const route = await routeOf(params);
  if (route.isQuestion) {
    const data = await getQuestion(route.categoryKey, route.questionSlug);
    if (data.notFound) notFound();
    const text = (data.question.question || '').trim();
    const preview = text.length > 150 ? `${text.slice(0, 147)}...` : text;
    return generateSEOMetadata({
      title: `${preview} - ${route.label} Past Paper | McqsBase.com`,
      description: `${route.commissionLabel} ${route.label} past paper question: ${preview} See the correct answer and explanation on McqsBase.`,
      keywords: [route.label, route.roleLabel, route.commissionLabel, 'past paper', 'mcq', 'answer'].join(', ').toLowerCase(),
      url: `/past-papers/${route.categoryKey}/question/${route.questionSlug}`,
    });
  }
  if (!(await listingExists(route.categoryKey))) notFound();
  return pastPaperListingMetadata(route.categoryKey.split('/'));
}

export default async function PastPaperSubcategoryPage({ params }) {
  const route = await routeOf(params);

  if (!route.isQuestion) {
    if (!(await listingExists(route.categoryKey))) notFound();
    return <PastPaperSubcategoryClient />;
  }

  const data = await getQuestion(route.categoryKey, route.questionSlug);
  if (data.notFound) notFound();
  const q = JSON.parse(JSON.stringify(data.question)); // plain props for the client component
  const pageUrl = `${DEFAULT_BASE_URL}/past-papers/${route.categoryKey}/question/${route.questionSlug}`;
  const answerText = q.options?.find(
    (opt) => typeof opt === 'string' && q.answer && opt.trim().toLowerCase() === q.answer.trim().toLowerCase()
  ) || q.answer;

  const structuredData = [
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      url: pageUrl,
      mainEntity: {
        '@type': 'Question',
        name: q.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: q.explanation ? `Correct answer: ${answerText}. Explanation: ${q.explanation}` : `Correct answer: ${answerText}`,
        },
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${DEFAULT_BASE_URL}/` },
        { '@type': 'ListItem', position: 2, name: 'Past Papers', item: `${DEFAULT_BASE_URL}/past-papers` },
        { '@type': 'ListItem', position: 3, name: route.label, item: `${DEFAULT_BASE_URL}/past-papers/${route.categoryKey}` },
        { '@type': 'ListItem', position: 4, name: (q.question || '').slice(0, 110), item: pageUrl },
      ],
    },
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <Navbar />
      <IndividualQuestion
        question={q}
        subject="past-papers"
        subjectPath={route.categoryKey}
        categoryName={route.label}
        nextQuestionId={data.nextQuestionSlug || data.nextQuestionId}
        prevQuestionId={data.prevQuestionSlug || data.prevQuestionId}
        introText={generateIntro(q.question || '', route.label, route.label)}
      />
      <Footer />
    </>
  );
}
