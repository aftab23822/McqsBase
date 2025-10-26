import Navbar from '../../src/components/Navbar'
import Mcqs from '../../src/components/Mcqs'
import Footer from '../../src/components/Footer'
import { ReCaptchaProvider } from '../../src/components/recaptcha'

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
