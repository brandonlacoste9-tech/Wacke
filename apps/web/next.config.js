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
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000"],
    },
  },
};

module.exports = nextConfig;
