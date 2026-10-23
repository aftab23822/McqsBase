import { generateSEOMetadata } from '../../src/components/SEO';
import Navbar from '../../src/components/Navbar'
import Sitemap from '../../src/components/Sitemap'
import Footer from '../../src/components/Footer'
import { ReCaptchaProvider } from '../../src/components/recaptcha'

export const metadata = generateSEOMetadata({ title: 'Sitemap - McqsBase', description: 'Browse McqsBase practice subjects, quizzes, articles and information pages.', url: '/sitemap' });

export default function SitemapPage() {
  const recaptchaSiteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || 'your-recaptcha-site-key';

  return (
    <ReCaptchaProvider siteKey={recaptchaSiteKey}>
      <Navbar />
      <Sitemap />
      <Footer />
    </ReCaptchaProvider>
  )
}
