/** @type {import('next').NextConfig} */
import CopyWebpackPlugin from 'copy-webpack-plugin'
import { env } from 'process'

const nextConfig = {
  trailingSlash: false, // Add trailing slash to all paths
  typescript: {
    ignoreBuildErrors: false
  },
  reactStrictMode: false,
  eslint: {
    ignoreDuringBuilds: false
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
    workerThreads: false
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

export default nextConfig
