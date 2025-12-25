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

  async headers () {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value:
              'camera=(), microphone=(), geolocation=(self), interest-cohort=()'
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https: blob: data:",
              "style-src 'self' 'unsafe-inline' https: data:",
              "img-src 'self' data: blob: https: http: *",
              "font-src 'self' data: https: *",
              "connect-src 'self' https: wss: ws: blob: http://localhost:* http://127.0.0.1:*",
              "media-src 'self' https: blob: data:",
              "worker-src 'self' blob:",
              "child-src 'self' blob:",
              "object-src 'none'",
              "frame-src 'self' https:",
              "frame-ancestors 'self'",
              "base-uri 'self'",
              "form-action 'self' https:"
            ].join('; ')
          }
        ]
      }
    ]
  },

  images: {
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
      }
    ]
  }
}

export default withBundleAnalyzer(nextConfig)
