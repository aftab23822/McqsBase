/** @type {import('next').NextConfig} */
const nextConfig = {
  // false: avoid 308 redirects from /path to /path/ (fixes GSC "Page with redirect" for question URLs)
  trailingSlash: false,
  async redirects() {
    return [{ source: '/blog/100-english-mcqs-with-answers-2026-10-05', destination: '/blog/100-english-mcqs-with-answers-2026-10-04', permanent: true }, {
      source: '/:path*',
      has: [{ type: 'host', value: 'mcqsbase.com' }],
      destination: 'https://www.mcqsbase.com/:path*',
      permanent: true,
    }];
  },
  async headers() {
    return [{ source: '/blog/:slug/article.md', headers: [{ key: 'X-Robots-Tag', value: 'noindex' }] }];
  },
  images: {
    unoptimized: true
  },
  turbopack: {},
  // Disable source maps in production
  productionBrowserSourceMaps: false,
  // Disable source maps in development to fix Turbopack source map errors
  webpack: (config, { dev, isServer }) => {
    if (dev) {
      // Disable source maps in development to avoid parsing errors
      config.devtool = false;
    }
    return config;
  },
}

export default nextConfig;
