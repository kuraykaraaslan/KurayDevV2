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
  productionBrowserSourceMaps: false,

  serverExternalPackages: ['@xenova/transformers', 'pg', 'openai'],

  reactStrictMode: true,

  // Tree-shake heavy icon libraries — each `import { faGithub } from '@fortawesome/free-brands-svg-icons'`
  // resolves to the single-icon file instead of pulling in the entire icon pack.
  modularizeImports: {
    '@fortawesome/free-brands-svg-icons': {
      transform: '@fortawesome/free-brands-svg-icons/{{member}}',
      skipDefaultConversion: true,
    },
    '@fortawesome/free-solid-svg-icons': {
      transform: '@fortawesome/free-solid-svg-icons/{{member}}',
      skipDefaultConversion: true,
    },
    '@fortawesome/free-regular-svg-icons': {
      transform: '@fortawesome/free-regular-svg-icons/{{member}}',
      skipDefaultConversion: true,
    },
  },

  experimental: {
    optimizePackageImports: [
      '@fortawesome/free-brands-svg-icons',
      '@fortawesome/free-solid-svg-icons',
      '@fortawesome/free-regular-svg-icons',
      'lucide-react',
      'date-fns',
    ],
  },

  env: {
    NEXT_PUBLIC_APPLICATION_HOST: env.NEXT_PUBLIC_APPLICATION_HOST || 'http://localhost:3000',
    SSO_ALLOWED_PROVIDERS: env.SSO_ALLOWED_PROVIDERS || 'google,apple'
  },

  trailingSlash: false,

  async redirects() {
    return [
      { source: '/about', destination: '/faq', permanent: true },
      { source: '/:lang/about', destination: '/:lang/faq', permanent: true },
    ]
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), browsing-topics=(), interest-cohort=()'
          },
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin-allow-popups'
          }
        ]
      },
      {
        source: '/sitemap.xml',
        headers: [{ key: 'Cache-Control', value: 's-maxage=3600, stale-while-revalidate=86400' }]
      },
      {
        source: '/robots.txt',
        headers: [{ key: 'Cache-Control', value: 's-maxage=3600, stale-while-revalidate=86400' }]
      },
      {
        source: '/api/(.*)',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex' }]
      },
      {
        source: '/llms-full.txt',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex' }]
      },
      {
        source: '/s/:code',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex' }]
      },
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/javascript; charset=utf-8'
          },
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate'
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self'"
          }
        ]
      }
    ]
  },

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
