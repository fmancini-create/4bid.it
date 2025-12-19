/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
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
    ]
  },
  async redirects() {
    return [
      {
        source: '/index.html',
        destination: '/',
        permanent: true,
      },
      {
        source: '/',
        has: [
          {
            type: 'query',
            key: 'page_id',
            value: '.*',
          },
        ],
        destination: '/',
        permanent: true,
      },
      {
        source: '/',
        has: [
          {
            type: 'query',
            key: 'feed',
            value: '.*',
          },
        ],
        destination: '/',
        permanent: true,
      },
      // Redirect www URLs to non-www (handled by Vercel but adding as backup)
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'www.4bid.it',
          },
        ],
        destination: 'https://4bid.it/:path*',
        permanent: true,
      },
    ]
  },
}

export default nextConfig
