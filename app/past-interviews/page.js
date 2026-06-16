import Navbar from '../../src/components/Navbar';
import Footer from '../../src/components/Footer';
import PastInterview from '../../src/components/PastInterview';
import { ReCaptchaProvider } from '../../src/components/recaptcha';
import { generateSEOMetadata } from '../../src/components/SEO';

export async function generateMetadata() {
  return generateSEOMetadata({
    title: 'Past Interview Questions for Pakistan Government Jobs - McqsBase',
    description: 'Prepare for FPSC, SPSC, PPSC, NTS, and Pakistan government job interviews with past interview questions, answers, and category-wise interview preparation material.',
    keywords: 'past interview questions Pakistan, FPSC interview questions, SPSC interview questions, PPSC interview preparation, government job interview questions',
    url: '/past-interviews'
  });
}

export default function PastInterviewsPage() {
  const recaptchaSiteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || 'your-recaptcha-site-key';

  return (
    <ReCaptchaProvider siteKey={recaptchaSiteKey}>
      <Navbar />
      <PastInterview />
      <Footer />
    </ReCaptchaProvider>
  );
}
