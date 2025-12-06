/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost'],
  },
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    PORT: process.env.PORT || '3000',
  },
  // Allow dynamic port configuration
  serverRuntimeConfig: {
    port: process.env.PORT || 3000,
  },
  // Webpack configuration for path aliases (Vercel compatibility)
  webpack: (config, { isServer }) => {
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
}

module.exports = nextConfig

