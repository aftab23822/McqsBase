import Navbar from '../../src/components/Navbar'
import Blog from '../../src/components/Blog'
import Footer from '../../src/components/Footer'
import { ReCaptchaProvider } from '../../src/components/recaptcha'
import { generateSEOMetadata } from '../../src/components/SEO'

export async function generateMetadata() {
  return generateSEOMetadata({
    title: 'Exam Preparation Articles & Blog - McqsBase',
    description: 'Read expert articles, preparation tips, study guides, and strategies for competitive exams in Pakistan. Learn effective techniques for FPSC, SPSC, PPSC, and NTS exam preparation.',
    keywords: 'exam preparation articles, competitive exam tips, study strategies pakistan, FPSC preparation guide, SPSC tips, PPSC study guide, NTS preparation articles, CSS preparation blog',
    canonical: 'https://mcqsbase.com/blog'
  });
}

export default function BlogPage() {
  const recaptchaSiteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || 'your-recaptcha-site-key';

  return (
    <ReCaptchaProvider siteKey={recaptchaSiteKey}>
      <Navbar />
      <Blog />
      <Footer />
    </ReCaptchaProvider>
  )
}
