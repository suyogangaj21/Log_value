import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.royaleapi.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "royaleapi.com",
        pathname: "/static/**",
      },
      {
        protocol: "https",
        hostname: "api-assets.clashroyale.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
