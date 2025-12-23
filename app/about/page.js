import Navbar from '../../src/components/Navbar'
import About from '../../src/components/About'
import Footer from '../../src/components/Footer'
import { ReCaptchaProvider } from '../../src/components/recaptcha'
import { generateSEOMetadata } from '../../src/components/SEO'

export async function generateMetadata() {
  return generateSEOMetadata({
    title: 'About Us - McqsBase | Pakistan\'s Premier MCQ Platform',
    description: 'Learn about McqsBase, Pakistan\'s leading free platform for competitive exam preparation. Discover our mission, vision, values, and commitment to providing quality education resources for FPSC, SPSC, PPSC, and NTS exams.',
    keywords: 'about mcqsbase, mcq platform pakistan, competitive exam preparation, free education resources, FPSC preparation, SPSC preparation, PPSC preparation, NTS preparation',
    canonical: 'https://mcqsbase.com/about'
  });
}

export default function AboutPage() {
  const recaptchaSiteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || 'your-recaptcha-site-key';

  return (
    <ReCaptchaProvider siteKey={recaptchaSiteKey}>
      <Navbar />
      <About />
      <Footer />
    </ReCaptchaProvider>
  )
}
