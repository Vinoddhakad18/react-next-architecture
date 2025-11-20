/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  transpilePackages: ['@repo/ui', '@repo/utils'],
};

module.exports = nextConfig;
