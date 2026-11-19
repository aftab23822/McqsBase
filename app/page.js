import Navbar from '../src/components/Navbar'
import Home from '../src/components/Home'
import Footer from '../src/components/Footer'
import { ReCaptchaProvider } from '../src/components/recaptcha'
import BlogLinkList from '../src/components/BlogLinkList'
import { blogArticles } from '../src/data/blogArticles'
import { latestArticles } from '../lib/utils/blogLinks'

export const metadata = { alternates: { canonical: 'https://www.mcqsbase.com/' } };

export default function HomePage() {
  // You'll need to replace this with your actual reCAPTCHA site key
  const recaptchaSiteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || 'your-recaptcha-site-key';

  return (
    <ReCaptchaProvider siteKey={recaptchaSiteKey}>
      <Navbar />
      <Home />
      {/* Every daily article is a new deploy, so this list stays current. */}
      <BlogLinkList title="Latest practice articles" articles={latestArticles(blogArticles, { limit: 8 })} viewAll />
      <Footer />
    </ReCaptchaProvider>
  )
}
