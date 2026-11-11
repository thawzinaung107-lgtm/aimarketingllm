import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Required: compiles Tailwind CSS v4 under Turbopack. Without this rule no
  // utility classes are generated (this was accidentally removed earlier).
  turbopack: {
    rules: {
      '*.css': {
        loaders: ['@tailwindcss/turbopack'],
        as: '*.css',
      },
    },
  },
  images: {
    // Only allow images from our own Supabase project storage. The previous
    // `hostname: '**'` allowed the image optimizer to fetch from any host.
    remotePatterns: process.env.NEXT_PUBLIC_SUPABASE_URL
      ? [new URL(`${process.env.NEXT_PUBLIC_SUPABASE_URL.replace(/\/$/, '')}/storage/v1/object/public/**`)]
      : [],
  },
}

export default nextConfig
