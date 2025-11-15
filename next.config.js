/** @type {import('next').NextConfig} */
const nextConfig = {
  trailingSlash: true,
  images: {
    unoptimized: true
  },
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
