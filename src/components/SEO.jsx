// Note: In Next.js App Router, use generateMetadata() in page.js instead of this component
// This component is deprecated - use metadata API in your page.js files

const DEFAULT_BASE_URL = (process.env.NEXT_PUBLIC_BASE_URL || 'https://www.mcqsbase.com').replace(/\/+$/, '');

function toCanonicalUrl(input = '/') {
  if (!input || input === '/') return `${DEFAULT_BASE_URL}/`;
  const isAbsolute = /^https?:\/\//i.test(input);
  const normalizedPath = isAbsolute ? input : `${DEFAULT_BASE_URL}${input.startsWith('/') ? input : `/${input}`}`;
  // Match Next.js trailingSlash: false — no trailing slash on paths (home keeps trailing slash above)
  return normalizedPath.replace(/\/+$/, '');
}

// Utility function for generating metadata objects
export const generateSEOMetadata = ({ 
  title, 
  description, 
  keywords, 
  url = '/', 
  image = "https://mcqsbase.com/eagle.svg"
}) => {
  const canonicalUrl = toCanonicalUrl(url);

  return {
    title,
    description,
    keywords,
    robots: 'index, follow',
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      images: [image],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
    alternates: {
      canonical: canonicalUrl,
    },
  };
};

// Deprecated component - kept for backward compatibility but will not render
const SEO = () => {
  console.warn('SEO component is deprecated in App Router. Use generateMetadata() function instead.');
  return null;
};

export default SEO;