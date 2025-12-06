/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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
  },
  // Webpack configuration for path aliases (Vercel compatibility)
  webpack: (config) => {
    const path = require('path')
    config.resolve.alias = {
      ...config.resolve.alias,
      '@/lib': path.resolve(__dirname, 'src/lib'),
      '@/shared': path.resolve(__dirname, 'src/shared'),
      '@/infrastructure': path.resolve(__dirname, 'src/infrastructure'),
      '@/components': path.resolve(__dirname, 'components'),
      '@/app': path.resolve(__dirname, 'app'),
    }
    return config
  },
  // Output configuration for Vercel
  output: 'standalone',
  // Experimental features
  experimental: {
    optimizePackageImports: ['@google/generative-ai', 'openai'],
  },
}

module.exports = nextConfig

