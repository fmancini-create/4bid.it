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
          // Permissions-Policy is intentionally set in proxy.ts so camera and
          // microphone remain denied everywhere except the virtual quote call.
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
      // Direct-booking pages targeted the same search intent. Keep one strong URL.
      {
        source: '/strategie-prenotazioni-dirette-hotel',
        destination: '/prenotazioni-dirette-hotel',
        permanent: true, // 301
      },
      {
        source: '/strategie-vendita-diretta-hotel',
        destination: '/prenotazioni-dirette-hotel',
        permanent: true, // 301
      },
      // ADR pages overlapped on the same informational/commercial intent.
      {
        source: '/adr-hotel-come-aumentarlo',
        destination: '/ottimizzazione-adr-hotel',
        permanent: true, // 301
      },
      // KPI pages competed for the same hotel/revenue KPI queries.
      {
        source: '/kpi-hotel-revenue-management',
        destination: '/kpi-metriche-hotel',
        permanent: true, // 301
      },

      // Problem-cluster slugs launched with transactional wording. Redirect them
      // to diagnostic URLs so they do not compete with the established service pages.
      {
        source: '/problemi-hotel/kpi-hotel-revpar-adr-occupazione',
        destination: '/problemi-hotel/non-capisco-kpi-hotel-revpar-adr',
        permanent: true,
      },
      {
        source: '/problemi-hotel/forecast-occupazione-domanda-hotel',
        destination: '/problemi-hotel/prevedere-occupazione-domanda-hotel',
        permanent: true,
      },
      {
        source: '/problemi-hotel/ridurre-commissioni-booking-expedia-ota',
        destination: '/problemi-hotel/dipendenza-booking-expedia-commissioni-hotel',
        permanent: true,
      },
      {
        source: '/problemi-hotel/aumentare-prenotazioni-dirette-hotel',
        destination: '/problemi-hotel/perche-poche-prenotazioni-dirette-hotel',
        permanent: true,
      },
      {
        source: '/problemi-hotel/mix-canali-distribuzione-hotel',
        destination: '/problemi-hotel/quali-canali-vendita-rendono-hotel',
        permanent: true,
      },
      {
        source: '/problemi-hotel/budget-hotel-forecast-economico',
        destination: '/problemi-hotel/budget-hotel-poco-affidabile-scostamenti',
        permanent: true,
      },
      {
        source: '/problemi-hotel/gestione-multi-struttura-hotel',
        destination: '/problemi-hotel/dati-processi-piu-strutture-hotel',
        permanent: true,
      },
      {
        source: '/problemi-hotel/software-su-misura-hotel',
        destination: '/problemi-hotel/software-hotel-non-adatto-al-processo',
        permanent: true,
      },
    ]
  },
}

export default nextConfig