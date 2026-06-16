import Navbar from '../../src/components/Navbar'
import Blog from '../../src/components/Blog'
import Footer from '../../src/components/Footer'
import { ReCaptchaProvider } from '../../src/components/recaptcha'
import { generateSEOMetadata } from '../../src/components/SEO'
import { listPublishedBlogs } from '../../lib/services/blogService'
import { estimateReadTime } from '../../lib/utils/blogContent'

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  return generateSEOMetadata({
    title: 'Exam Preparation Articles & Blog - McqsBase',
    description: 'Read expert articles, preparation tips, study guides, and strategies for competitive exams in Pakistan. Learn effective techniques for FPSC, SPSC, PPSC, and NTS exam preparation.',
    keywords: 'exam preparation articles, competitive exam tips, study strategies pakistan, FPSC preparation guide, SPSC tips, PPSC study guide, NTS preparation articles, CSS preparation blog',
    canonical: 'https://mcqsbase.com/blog'
  });
}

export default async function BlogPage() {
  const recaptchaSiteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || 'your-recaptcha-site-key';
  let dynamicArticles = [];

  try {
    const blogs = await listPublishedBlogs(100);
    dynamicArticles = blogs.map((blog) => ({
      ...blog,
      readTime: estimateReadTime(blog.body)
    }));
  } catch (error) {
    console.error('Failed to load dynamic blog articles:', error);
  }

  return (
    <ReCaptchaProvider siteKey={recaptchaSiteKey}>
      <Navbar />
      <Blog dynamicArticles={dynamicArticles} />
      <Footer />
    </ReCaptchaProvider>
  )
}
