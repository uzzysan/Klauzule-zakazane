/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // Optimize for production
  reactStrictMode: true,
  swcMinify: true,
};

module.exports = nextConfig;
