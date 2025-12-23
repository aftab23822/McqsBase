import { notFound } from 'next/navigation';
import Navbar from '../../../src/components/Navbar';
import Footer from '../../../src/components/Footer';
import { ReCaptchaProvider } from '../../../src/components/recaptcha';
import { generateSEOMetadata } from '../../../src/components/SEO';
import StudyGuideDetail from '../../../src/components/StudyGuideDetail';
import { studyGuides } from '../../../src/data/studyGuides';

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const guide = studyGuides[slug];
  
  if (!guide) {
    return {
      title: 'Study Guide Not Found - McqsBase'
    };
  }

  return generateSEOMetadata({
    title: `${guide.title} - McqsBase`,
    description: `Comprehensive study guide: ${guide.title}. Learn effective preparation strategies, tips, and techniques for competitive exams in Pakistan.`,
    keywords: `${guide.category.toLowerCase()}, study guide, exam preparation, competitive exams pakistan, ${guide.title.toLowerCase()}`,
    canonical: `https://mcqsbase.com/study-guides/${slug}`
  });
}

export async function generateStaticParams() {
  return Object.keys(studyGuides).map((slug) => ({
    slug: slug,
  }));
}

export default async function StudyGuidePage({ params }) {
  const { slug } = await params;
  const guide = studyGuides[slug];
  
  if (!guide) {
    notFound();
  }

  const recaptchaSiteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || 'your-recaptcha-site-key';

  return (
    <ReCaptchaProvider siteKey={recaptchaSiteKey}>
      <Navbar />
      <StudyGuideDetail guide={guide} />
      <Footer />
    </ReCaptchaProvider>
  );
}
