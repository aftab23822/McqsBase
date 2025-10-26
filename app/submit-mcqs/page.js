import Navbar from '../../src/components/Navbar'
import SubmitMcqs from '../../src/components/SubmitMcqs'
import Footer from '../../src/components/Footer'
import { ReCaptchaProvider } from '../../src/components/recaptcha'

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
