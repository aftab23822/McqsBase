import Navbar from '../../src/components/Navbar'
import TermsOfService from '../../src/components/TermsOfService'
import Footer from '../../src/components/Footer'
import { ReCaptchaProvider } from '../../src/components/recaptcha'

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
