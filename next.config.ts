import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  // Public reports moved from /monthly-report to /monthly-bill; keep old shared links working.
  async redirects() {
    return [
      { source: "/monthly-report", destination: "/monthly-bill", permanent: true },
      { source: "/monthly-report/:path*", destination: "/monthly-bill/:path*", permanent: true },
    ];
  },
};

export default nextConfig;
