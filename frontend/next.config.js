const { withSentryConfig } = require("@sentry/nextjs");

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  reactStrictMode: true,
  swcMinify: true,
  generateBuildId: async () => "build-20250323-001",
  headers: async () => [
    {
      source: "/:all*(\.js|\.css|\.html)",
      headers: [
        { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
        { key: "Pragma", value: "no-cache" },
        { key: "Expires", value: "0" },
      ],
    },
  ],
};

module.exports = withSentryConfig(nextConfig, { silent: true, hideSourceMaps: true });
