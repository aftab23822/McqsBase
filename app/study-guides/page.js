import Navbar from '../../src/components/Navbar'
import StudyGuides from '../../src/components/StudyGuides'
import Footer from '../../src/components/Footer'
import { ReCaptchaProvider } from '../../src/components/recaptcha'
import { generateSEOMetadata } from '../../src/components/SEO'

export async function generateMetadata() {
  return generateSEOMetadata({
    title: 'Study Guides & Preparation Tips - McqsBase',
    description: 'Comprehensive study guides and preparation tips for FPSC, SPSC, PPSC, and NTS exams. Learn effective strategies, time management techniques, and subject-wise preparation methods to excel in competitive examinations.',
    keywords: 'study guides, exam preparation tips, FPSC preparation guide, SPSC preparation, PPSC study guide, NTS test preparation, competitive exam strategy, exam tips pakistan',
    canonical: 'https://mcqsbase.com/study-guides'
  });
}

export default function StudyGuidesPage() {
  const recaptchaSiteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || 'your-recaptcha-site-key';

  return (
    <ReCaptchaProvider siteKey={recaptchaSiteKey}>
      <Navbar />
      <StudyGuides />
      <Footer />
    </ReCaptchaProvider>
  )
}
