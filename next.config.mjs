/** @type {import('next').NextConfig} */

const nextConfig = {
    trailingSlash: true, // Add trailing slash to all paths
    typescript: {
      ignoreBuildErrors: true,
    },
    reactStrictMode: false,
    eslint: {
      ignoreDuringBuilds: true,
    },
    images: {
      domains: ['raw.githubusercontent.com', 'avatars.githubusercontent.com', 'github.com'],
    },
};


export default nextConfig;
