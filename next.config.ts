import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["playwright", "playwright-core", "sharp", "fedapay", "@prisma/client"],
  poweredByHeader: false,
  allowedDevOrigins: ["*.e2b.app", "*.e2b.dev"],
  experimental: { serverActions: { allowedOrigins: ["*.e2b.app"] } },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
