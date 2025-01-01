/** @type {import('next').NextConfig} */

const nextConfig = {
    trailingSlash: false, // Add trailing slash to all paths
    typescript: {
      ignoreBuildErrors: true,
    },
    reactStrictMode: false,
    eslint: {
      ignoreDuringBuilds: true,
    },
    images: {
      domains: ['raw.githubusercontent.com', 'avatars.githubusercontent.com', 'github.com', 'kuray-dev.s3.amazonaws.com', 'www.gravatar.com', '*.core.windows.net', 'via.placeholder.com'],
    },
};


export default nextConfig;
