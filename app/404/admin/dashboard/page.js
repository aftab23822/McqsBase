import Navbar from '../../../../src/components/Navbar'
import AdminLogin from '../../../../src/components/AdminLogin'
import Footer from '../../../../src/components/Footer'
import { ReCaptchaProvider } from '../../../../src/components/recaptcha'

export const metadata = { title: 'Admin login - McqsBase', robots: { index: false, follow: false } };

export default function AdminLoginPage() {
  const recaptchaSiteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || 'your-recaptcha-site-key';

  return (
    <ReCaptchaProvider siteKey={recaptchaSiteKey}>
      <Navbar />
      <AdminLogin />
      <Footer />
    </ReCaptchaProvider>
  )
}
