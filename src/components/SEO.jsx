// Note: In Next.js App Router, use generateMetadata() in page.js instead of this component
// This component is deprecated - use metadata API in your page.js files

// Utility function for generating metadata objects
export const generateSEOMetadata = ({ 
  title, 
  description, 
  keywords, 
  url, 
  image = "https://mcqsbase.com/eagle.svg"
}) => {
  const fullUrl = `https://mcqsbase.com${url}`;
  
  return {
    title,
    description,
    keywords,
    robots: 'index, follow',
    openGraph: {
      title,
      description,
      url: fullUrl,
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
      canonical: fullUrl,
    },
  };
};

// Deprecated component - kept for backward compatibility but will not render
const SEO = () => {
  console.warn('SEO component is deprecated in App Router. Use generateMetadata() function instead.');
  return null;
};

export default SEO;