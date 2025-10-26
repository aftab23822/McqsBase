import Navbar from '../../src/components/Navbar'
import PastInterview from '../../src/components/PastInterview'
import Footer from '../../src/components/Footer'
import { ReCaptchaProvider } from '../../src/components/recaptcha'

export default function PastInterviewsPage() {
  const recaptchaSiteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || 'your-recaptcha-site-key';

  return (
    <ReCaptchaProvider siteKey={recaptchaSiteKey}>
      <Navbar />
      <PastInterview />
      <Footer />
    </ReCaptchaProvider>
  )
}
