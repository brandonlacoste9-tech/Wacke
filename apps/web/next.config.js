/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@wacke/ui", "@wacke/db"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "a.kick.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "customer-*.cloudflarestream.com" },
      { protocol: "https", hostname: "image.mux.com" },
      { protocol: "https", hostname: "stream.mux.com" },
      { protocol: "https", hostname: "image.mux.com" },
    ],
  },
  // serverExternalPackages is supported in Next 13+, keeping for server-only bundles
  // serverExternalPackages: [
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
