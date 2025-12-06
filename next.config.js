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
}

module.exports = nextConfig

