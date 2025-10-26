import Navbar from '../../src/components/Navbar'
import PrivacyPolicy from '../../src/components/PrivacyPolicy'
import Footer from '../../src/components/Footer'
import { ReCaptchaProvider } from '../../src/components/recaptcha'

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
