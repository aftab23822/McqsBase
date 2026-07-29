/** @type {import('next').NextConfig} */
const nextConfig = {
  // false: avoid 308 redirects from /path to /path/ (fixes GSC "Page with redirect" for question URLs)
  trailingSlash: false,
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
