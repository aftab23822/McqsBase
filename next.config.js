/** @type {import('next').NextConfig} */
const nextConfig = {
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  experimental: {
    missingSuspenseWithCSRBailout: false,
  }
}

export default nextConfig;
