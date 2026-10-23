// Note: In Next.js App Router, use generateMetadata() in page.js instead of this component.
// This component is deprecated; use metadata API in page.js files.

import { SITE_URL } from '../../lib/utils/siteUrl';
export const DEFAULT_BASE_URL = SITE_URL;

function toCanonicalUrl(input = '/') {
  if (!input || input === '/') return `${DEFAULT_BASE_URL}/`;

  const isAbsolute = /^https?:\/\//i.test(input);
  let normalizedPath = isAbsolute ? input : `${DEFAULT_BASE_URL}${input.startsWith('/') ? input : `/${input}`}`;

  if (isAbsolute) {
    try {
      const url = new URL(input);
      const base = new URL(DEFAULT_BASE_URL);
      if (url.hostname === 'mcqsbase.com' || url.hostname === 'www.mcqsbase.com') {
        url.protocol = base.protocol;
        url.hostname = base.hostname;
        normalizedPath = url.toString();
      }
    } catch {
      normalizedPath = input;
    }
  }

  return normalizedPath.replace(/\/+$/, '');
}

export const generateSEOMetadata = ({
  title,
  description,
  keywords,
  url,
  canonical,
  image = `${DEFAULT_BASE_URL}/eagle.svg`
}) => {
  const canonicalUrl = toCanonicalUrl(url || canonical || '/');

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

const SEO = () => {
  console.warn('SEO component is deprecated in App Router. Use generateMetadata() function instead.');
  return null;
};

export default SEO;
