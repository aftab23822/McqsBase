import Navbar from '../../src/components/Navbar'
import ComingSoon from '../../src/components/ComingSoon'
import Footer from '../../src/components/Footer'
import { ReCaptchaProvider } from '../../src/components/recaptcha'

export const metadata = {
  title: 'Coming Soon - McqsBase',
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

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
