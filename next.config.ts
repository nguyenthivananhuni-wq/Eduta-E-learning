import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // libSQL + Prisma adapter use native bindings — exclude from webpack bundling
  serverExternalPackages: [
    "@libsql/client",
    "@prisma/adapter-libsql",
    "libsql",
  ],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "img.youtube.com" },
      { protocol: "https", hostname: "i.ytimg.com" },
    ],
  },
};

export default nextConfig;
