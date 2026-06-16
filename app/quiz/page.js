import Navbar from '../../src/components/Navbar'
import Quiz from '../../src/components/Quiz'
import Footer from '../../src/components/Footer'
import { ReCaptchaProvider } from '../../src/components/recaptcha'
import { generateSEOMetadata } from '../../src/components/SEO'

export async function generateMetadata() {
  return generateSEOMetadata({
    title: 'Online Quiz Practice for Pakistan Exams - McqsBase',
    description: 'Take interactive quizzes for Pakistan competitive exams. Practice timed questions by subject and improve speed, accuracy, and retention.',
    keywords: 'online quiz Pakistan exams, FPSC quiz, SPSC quiz, PPSC quiz, NTS quiz, MCQ quiz practice',
    url: '/quiz'
  });
}

export default function QuizPage() {
  const recaptchaSiteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || 'your-recaptcha-site-key';

  return (
    <ReCaptchaProvider siteKey={recaptchaSiteKey}>
      <Navbar />
      <Quiz />
      <Footer />
    </ReCaptchaProvider>
  )
}
