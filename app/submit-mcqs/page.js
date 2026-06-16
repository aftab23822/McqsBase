import Navbar from '../../src/components/Navbar'
import SubmitMcqs from '../../src/components/SubmitMcqs'
import Footer from '../../src/components/Footer'
import { ReCaptchaProvider } from '../../src/components/recaptcha'
import { generateSEOMetadata } from '../../src/components/SEO'

export async function generateMetadata() {
  return generateSEOMetadata({
    title: 'Submit MCQs to McqsBase - Contribute Exam Questions',
    description: 'Submit verified MCQs, answers, and explanations to help Pakistan competitive exam candidates practice with better study material.',
    keywords: 'submit MCQs, contribute exam questions, Pakistan MCQ database, exam preparation community',
    url: '/submit-mcqs'
  });
}

export default function SubmitMcqsPage() {
  const recaptchaSiteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || 'your-recaptcha-site-key';

  return (
    <ReCaptchaProvider siteKey={recaptchaSiteKey}>
      <Navbar />
      <SubmitMcqs />
      <Footer />
    </ReCaptchaProvider>
  )
}
