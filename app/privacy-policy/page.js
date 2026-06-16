import Navbar from '../../src/components/Navbar'
import PrivacyPolicy from '../../src/components/PrivacyPolicy'
import Footer from '../../src/components/Footer'
import { ReCaptchaProvider } from '../../src/components/recaptcha'
import { generateSEOMetadata } from '../../src/components/SEO'

export async function generateMetadata() {
  return generateSEOMetadata({
    title: 'Privacy Policy - McqsBase',
    description: 'Read the McqsBase privacy policy and learn how we handle information for visitors using our exam preparation platform.',
    keywords: 'McqsBase privacy policy, exam preparation privacy, website privacy policy',
    url: '/privacy-policy'
  });
}

export default function PrivacyPolicyPage() {
  const recaptchaSiteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || 'your-recaptcha-site-key';

  return (
    <ReCaptchaProvider siteKey={recaptchaSiteKey}>
      <Navbar />
      <PrivacyPolicy />
      <Footer />
    </ReCaptchaProvider>
  )
}
