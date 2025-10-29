import Navbar from '../../src/components/Navbar'
import Footer from '../../src/components/Footer'
import { ReCaptchaProvider } from '../../src/components/recaptcha'
import MockTests from '../../src/components/MockTests'

export default function MockTestsPage() {
  const recaptchaSiteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || 'your-recaptcha-site-key';

  return (
    <ReCaptchaProvider siteKey={recaptchaSiteKey}>
      <Navbar />
      <MockTests />
      <Footer />
    </ReCaptchaProvider>
  )
}


