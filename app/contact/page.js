import Navbar from '../../src/components/Navbar'
import ContactUsForm from '../../src/components/ContactUsForm'
import Footer from '../../src/components/Footer'
import { ReCaptchaProvider } from '../../src/components/recaptcha'
import { generateSEOMetadata } from '../../src/components/SEO'

export async function generateMetadata() {
  return generateSEOMetadata({
    title: 'Contact McqsBase - Exam Preparation Support',
    description: 'Contact McqsBase for feedback, corrections, collaboration, and support related to Pakistan competitive exam preparation resources.',
    keywords: 'contact McqsBase, MCQ correction, exam preparation support, Pakistan exam resources',
    url: '/contact'
  });
}

export default function ContactPage() {
  const recaptchaSiteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || 'your-recaptcha-site-key';

  return (
    <ReCaptchaProvider siteKey={recaptchaSiteKey}>
      <Navbar />
      <ContactUsForm />
      <Footer />
    </ReCaptchaProvider>
  )
}
