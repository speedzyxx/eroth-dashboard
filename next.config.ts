import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "render.albiononline.com",
        pathname: "/v1/item/**",
      },
      {
        protocol: "https",
        hostname: "gameinfo.albiononline.com",
      },
      {
        protocol: "https",
        hostname: "gameinfo-ams.albiononline.com",
      },
      {
        protocol: "https",
        hostname: "gameinfo-sgp.albiononline.com",
      },
    ],
  },
};

export default nextConfig;
