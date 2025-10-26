import Navbar from '../src/components/Navbar'
import Home from '../src/components/Home'
import Footer from '../src/components/Footer'
import { ReCaptchaProvider } from '../src/components/recaptcha'

export default function HomePage() {
  // You'll need to replace this with your actual reCAPTCHA site key
  const recaptchaSiteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || 'your-recaptcha-site-key';

  return (
    <ReCaptchaProvider siteKey={recaptchaSiteKey}>
      <Navbar />
      <Home />
      <Footer />
    </ReCaptchaProvider>
  )
}
