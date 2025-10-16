/** @type {import('next').NextConfig} */
import CopyWebpackPlugin from 'copy-webpack-plugin'
import { env } from 'process'
import bundleAnalyzer from '@next/bundle-analyzer'

/** @type {import('next').NextConfig} */
const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true'
})

const nextConfig = {
  trailingSlash: false, // Add trailing slash to all paths
  typescript: {
    ignoreBuildErrors: false
  },
  reactStrictMode: false,
  eslint: {
    ignoreDuringBuilds: false
  },
  experimental: {
    cpus: 1,
    workerThreads: false,
    optimizeCss: true,
    optimizeImages: true
  },
  env: {
    APPLICATION_HOST: env.APPLICATION_HOST || 'http://localhost:3000',
    SSO_ALLOWED_PROVIDERS: env.SSO_ALLOWED_PROVIDERS || 'google,apple'
  },
  trailingSlash: true,
  images: {
    domains: [
      'raw.githubusercontent.com',
      'avatars.githubusercontent.com',
      'github.com',
      'kuray-dev.s3.amazonaws.com',
      'www.gravatar.com',
      '*.core.windows.net',
      'via.placeholder.com',
      'localhost',
      'localhost.com'
    ]
  },
  experimental: {
    cpus: 1,
    workerThreads: false,
    forceSwcTransforms: true
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production'
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.plugins.push(
        new CopyWebpackPlugin({
          patterns: [
            {
              from: 'views',
              to: 'views'
            }
          ]
        })
      )
    }
    return config
  }
}

export default withBundleAnalyzer(nextConfig)
