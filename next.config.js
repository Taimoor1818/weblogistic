/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

  // Optimize for Vercel deployment
  output: 'standalone',

  // Ensure proper error handling during build
  typescript: {
    // Don't fail build on TypeScript errors in production (will still show in dev)
    // Change this to false if you want strict builds
    ignoreBuildErrors: false,
  },

  eslint: {
    // Don't fail build on ESLint errors in production
    // Change this to false if you want strict builds
    ignoreDuringBuilds: false,
  },
}

module.exports = nextConfig