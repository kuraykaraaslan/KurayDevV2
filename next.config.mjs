/** @type {import('next').NextConfig} */
import CopyWebpackPlugin from 'copy-webpack-plugin';
import { env } from 'process';

const nextConfig = {
    trailingSlash: false, // Add trailing slash to all paths
    typescript: {
      ignoreBuildErrors: true,
    },
    reactStrictMode: false,
    eslint: {
      ignoreDuringBuilds: true,
    },
    env: {
      "APPLICATION_HOST" : env.APPLICATION_HOST || "http://localhost:3000"
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
      ],
    },
    webpack: (config, { isServer }) => {
      if (isServer) {
        config.plugins.push(
          new CopyWebpackPlugin({
            patterns: [
              {
                from: 'views',
                to: 'views',
              },
            ],
          })
        );
      }
      return config;
    },
};


export default nextConfig;
