/** @type {import('next').NextConfig} */
import CopyWebpackPlugin from 'copy-webpack-plugin';

const nextConfig = {
    trailingSlash: false, // Add trailing slash to all paths
    typescript: {
      ignoreBuildErrors: true,
    },
    reactStrictMode: false,
    eslint: {
      ignoreDuringBuilds: true,
    },
    i18n: {
      // English, German, Estonian, Greek, Turkish 
      locales: ["en", "de", "et", "el", "tr"],
      defaultLocale: "en",
    },
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
