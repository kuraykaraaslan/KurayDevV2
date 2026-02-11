/** @type {import('next').NextConfig} */
import { env } from 'process'
import bundleAnalyzer from '@next/bundle-analyzer'

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true'
})

const nextConfig = {
  /** Enable Turbopack explicitly */
  turbopack: {},
  typescript: {
    ignoreBuildErrors: false
  },

  reactStrictMode: false,

  eslint: {
    ignoreDuringBuilds: true
  },

  env: {
    APPLICATION_HOST: env.APPLICATION_HOST || 'http://localhost:3000',
    SSO_ALLOWED_PROVIDERS: env.SSO_ALLOWED_PROVIDERS || 'google,apple'
  },

  experimental: {
    nodeMiddleware: true // Enable Node.js middleware
  },

  trailingSlash: false,

  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'raw.githubusercontent.com'
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com'
      },
      {
        protocol: 'https',
        hostname: 'github.com'
      },
      {
        protocol: 'https',
        hostname: 'kuray-dev.s3.amazonaws.com'
      },
      {
        protocol: 'https',
        hostname: 'www.gravatar.com'
      },
      {
        protocol: 'https',
        hostname: '*.core.windows.net'
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com'
      },
      {
        protocol: 'https',
        hostname: 'kuray.dev'
      },
      {
        protocol: 'https',
        hostname: 'www.kuray.dev'
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000'
      }
    ]
  }
}

export default withBundleAnalyzer(nextConfig)
