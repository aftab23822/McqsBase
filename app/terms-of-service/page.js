import Navbar from '../../src/components/Navbar'
import TermsOfService from '../../src/components/TermsOfService'
import Footer from '../../src/components/Footer'
import { ReCaptchaProvider } from '../../src/components/recaptcha'
import { generateSEOMetadata } from '../../src/components/SEO'

export async function generateMetadata() {
  return generateSEOMetadata({
    title: 'Terms of Service - McqsBase',
    description: 'Review the McqsBase terms of service for using our Pakistan competitive exam preparation resources and community features.',
    keywords: 'McqsBase terms, terms of service, exam preparation website terms',
    url: '/terms-of-service'
  });
}

export default function TermsOfServicePage() {
  const recaptchaSiteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || 'your-recaptcha-site-key';

  return (
    <ReCaptchaProvider siteKey={recaptchaSiteKey}>
      <Navbar />
      <TermsOfService />
      <Footer />
    </ReCaptchaProvider>
  )
}
