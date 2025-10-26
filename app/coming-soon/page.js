import Navbar from '../../src/components/Navbar'
import ComingSoon from '../../src/components/ComingSoon'
import Footer from '../../src/components/Footer'
import { ReCaptchaProvider } from '../../src/components/recaptcha'

export default function ComingSoonPage() {
  const recaptchaSiteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || 'your-recaptcha-site-key';

  return (
    <ReCaptchaProvider siteKey={recaptchaSiteKey}>
      <Navbar />
      <ComingSoon />
      <Footer />
    </ReCaptchaProvider>
  )
}
