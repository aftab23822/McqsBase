import { notFound } from 'next/navigation';
import Navbar from '../../../src/components/Navbar';
import Footer from '../../../src/components/Footer';
import { ReCaptchaProvider } from '../../../src/components/recaptcha';
import { generateSEOMetadata } from '../../../src/components/SEO';
import BlogArticleDetail from '../../../src/components/BlogArticleDetail';
import { blogArticles } from '../../../src/data/blogArticles';
import { getPublishedBlogBySlug } from '../../../lib/services/blogService';
import { estimateReadTime } from '../../../lib/utils/blogContent';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const databaseArticle = await getPublishedBlogBySlug(slug).catch((error) => {
    console.error('Failed to load blog metadata:', error);
    return null;
  });
  const article = databaseArticle || blogArticles[slug];
  
  if (!article) {
    return {
      title: 'Article Not Found - McqsBase'
    };
  }

  return generateSEOMetadata({
    title: databaseArticle ? article.seoTitle : `${article.title} - McqsBase`,
    description: databaseArticle ? article.metaDescription : article.excerpt || `Read about ${article.title}. Expert advice and strategies for competitive exam preparation in Pakistan.`,
    keywords: databaseArticle
      ? [article.primaryKeyword, ...(article.seoKeywords || [])].filter(Boolean).join(', ')
      : `${article.category.toLowerCase()}, exam preparation, competitive exams pakistan, ${article.title.toLowerCase()}, study tips`,
    url: `/blog/${slug}`
  });
}

export async function generateStaticParams() {
  return Object.keys(blogArticles).map((slug) => ({
    slug: slug,
  }));
}

export default async function BlogArticlePage({ params }) {
  const { slug } = await params;
  const databaseArticle = await getPublishedBlogBySlug(slug).catch((error) => {
    console.error('Failed to load blog article:', error);
    return null;
  });
  const article = databaseArticle
    ? {
        ...databaseArticle,
        date: databaseArticle.publishedAt ? new Date(databaseArticle.publishedAt).getFullYear().toString() : 'New',
        readTime: estimateReadTime(databaseArticle.body)
      }
    : blogArticles[slug];
  
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
