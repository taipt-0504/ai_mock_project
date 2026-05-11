import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/a/**",
      },
      // Sun* Kudos seed (Phase 2) — KudoImage rows use picsum.photos as a
      // placeholder gallery host until the upload pipeline lands (Q-PLAN4).
      {
        protocol: "https",
        hostname: "picsum.photos",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
