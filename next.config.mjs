/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
  },
  compress: true,
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
        ],
      },
      {
        source: "/images/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/:path*.svg",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ]
  },
  // Removed page.tsx files that used redirect() which returns 307 (temporary)
  async redirects() {
    return [
      // Legacy/cleanup redirects
      {
        source: '/index.html',
        destination: '/',
        permanent: true, // 301
      },
      {
        source: '/',
        has: [
          {
            type: 'query',
            key: 'page_id',
          },
        ],
        destination: '/',
        permanent: true, // 301
      },
      {
        source: '/',
        has: [
          {
            type: 'query',
            key: 'feed',
          },
        ],
        destination: '/',
        permanent: true, // 301
      },
      // SEO canonical redirects - duplicate content consolidation
      {
        source: '/revenue-management-agriturismi',
        destination: '/revenue-management-agriturismo',
        permanent: true, // 301
      },
      {
        source: '/revenue-management-bed-and-breakfast',
        destination: '/revenue-management-bed-breakfast',
        permanent: true, // 301
      },
      {
        source: '/yield-management-camere-hotel',
        destination: '/yield-management-hotel',
        permanent: true, // 301
      },
    ]
  },
}

export default nextConfig
