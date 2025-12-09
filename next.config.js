/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Remove standalone output for dev server compatibility
  // output: 'standalone', // Only for production builds
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: '**.supabase.in',
      },
    ],
    // Suppress hydration warnings for browser automation attributes
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  // Webpack configuration for path aliases (Vercel compatibility)
  webpack: (config, { isServer }) => {
    const path = require('path')
    config.resolve.alias = {
      ...config.resolve.alias,
      '@/lib': path.resolve(__dirname, 'src/lib'),
      '@/shared': path.resolve(__dirname, 'src/shared'),
      '@/infrastructure': path.resolve(__dirname, 'src/infrastructure'),
      '@/core': path.resolve(__dirname, 'src/core'),
      '@/contexts': path.resolve(__dirname, 'src/contexts'),
      '@/components': path.resolve(__dirname, 'components'),
      '@/app': path.resolve(__dirname, 'app'),
    }
    return config
  },
  // Experimental features
  experimental: {
    optimizePackageImports: ['@google/generative-ai', 'openai'],
  },
  // Suppress hydration warnings in development
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
}

module.exports = nextConfig

