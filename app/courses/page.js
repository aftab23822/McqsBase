import Navbar from '../../src/components/Navbar'
import Courses from '../../src/components/Courses'
import Footer from '../../src/components/Footer'
import { ReCaptchaProvider } from '../../src/components/recaptcha'

export default function CoursesPage() {
  const recaptchaSiteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || 'your-recaptcha-site-key';

  return (
    <ReCaptchaProvider siteKey={recaptchaSiteKey}>
      <Navbar />
      <Courses />
      <Footer />
    </ReCaptchaProvider>
  )
}
