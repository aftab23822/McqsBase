import Navbar from '../../src/components/Navbar'
import Mcqs from '../../src/components/Mcqs'
import Footer from '../../src/components/Footer'
import { ReCaptchaProvider } from '../../src/components/recaptcha'
import { generateSEOMetadata } from '../../src/components/SEO'

export async function generateMetadata() {
  return generateSEOMetadata({
    title: 'MCQs for Pakistan Competitive Exams - McqsBase',
    description: 'Practice subject-wise MCQs for FPSC, SPSC, PPSC, NTS, CSS, PMS, and other Pakistan competitive exams with answers and explanations.',
    keywords: 'MCQs Pakistan, FPSC MCQs, SPSC MCQs, PPSC MCQs, NTS MCQs, CSS MCQs, competitive exam questions',
    url: '/mcqs'
  });
}

export default function McqsPage() {
  const recaptchaSiteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || 'your-recaptcha-site-key';

  return (
    <ReCaptchaProvider siteKey={recaptchaSiteKey}>
      <Navbar />
      <Mcqs />
      <Footer />
    </ReCaptchaProvider>
  )
}
