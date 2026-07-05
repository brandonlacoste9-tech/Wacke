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
  // serverExternalPackages is supported in Next 13+, keeping for server-only bundles
  // serverExternalPackages: [
  //   "@mux/mux-node",
  //   "@neondatabase/serverless",
  //   "drizzle-orm",
  // ],
  experimental: {
    serverActions: {
      allowedOrigins: [
        "localhost:3000",
        "wacke.vercel.app",
        "wacke.live",
        "www.wacke.live",
        "wacke.ca",
        "www.wacke.ca"
      ],
    },
  },
};

module.exports = nextConfig;
