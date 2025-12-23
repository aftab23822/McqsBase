import { notFound } from 'next/navigation';
import Navbar from '../../../src/components/Navbar';
import Footer from '../../../src/components/Footer';
import { ReCaptchaProvider } from '../../../src/components/recaptcha';
import { generateSEOMetadata } from '../../../src/components/SEO';
import BlogArticleDetail from '../../../src/components/BlogArticleDetail';
import { blogArticles } from '../../../src/data/blogArticles';

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const article = blogArticles[slug];
  
  if (!article) {
    return {
      title: 'Article Not Found - McqsBase'
    };
  }

  return generateSEOMetadata({
    title: `${article.title} - McqsBase`,
    description: article.excerpt || `Read about ${article.title}. Expert advice and strategies for competitive exam preparation in Pakistan.`,
    keywords: `${article.category.toLowerCase()}, exam preparation, competitive exams pakistan, ${article.title.toLowerCase()}, study tips`,
    canonical: `https://mcqsbase.com/blog/${slug}`
  });
}

export async function generateStaticParams() {
  return Object.keys(blogArticles).map((slug) => ({
    slug: slug,
  }));
}

export default async function BlogArticlePage({ params }) {
  const { slug } = await params;
  const article = blogArticles[slug];
  
  if (!article) {
    notFound();
  }

  const recaptchaSiteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || 'your-recaptcha-site-key';

  return (
    <ReCaptchaProvider siteKey={recaptchaSiteKey}>
      <Navbar />
      <BlogArticleDetail article={article} />
      <Footer />
    </ReCaptchaProvider>
  );
}
