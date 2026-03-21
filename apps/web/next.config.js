/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@wacke/ui", "@wacke/db"],
  images: {
    domains: [
      "image.mux.com",
      "stream.mux.com",
      "thumbnails.mux.com",
    ],
  },
  // Mark Node.js-only packages as server externals so webpack never tries to bundle them
  serverExternalPackages: [
    "@mux/mux-node",
    "@neondatabase/serverless",
    "drizzle-orm",
  ],
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000", "wacke.vercel.app"],
    },
  },
};

module.exports = nextConfig;
