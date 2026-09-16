import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  compress: true,
  productionBrowserSourceMaps: false,
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 31536000,
    dangerouslyAllowSVG: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.mondialbusiness.eu",
      },
      {
        protocol: "https",
        hostname: "mondialbusiness.eu",
      },
      // Demo seed/profile imagery (creator profiles, avatars). Required or
      // next/image throws at runtime on those pages.
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "i.pravatar.cc",
      },
    ],
  },
  async rewrites() {
    const backendOrigin =
      process.env.NEXT_PUBLIC_API_ORIGIN || "http://localhost:5093";
    return [
      {
        source: "/brand-assets/:path*",
        destination: `${backendOrigin}/brand-assets/:path*`,
      },
    ];
  },
};

export default nextConfig;
