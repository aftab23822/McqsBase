import Navbar from '../../src/components/Navbar'
import ContactUsForm from '../../src/components/ContactUsForm'
import Footer from '../../src/components/Footer'
import { ReCaptchaProvider } from '../../src/components/recaptcha'

export default function ContactPage() {
  const recaptchaSiteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || 'your-recaptcha-site-key';

  return (
    <ReCaptchaProvider siteKey={recaptchaSiteKey}>
      <Navbar />
      <ContactUsForm />
      <Footer />
    </ReCaptchaProvider>
  )
}
