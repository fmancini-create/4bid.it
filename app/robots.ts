import type { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/api/", "/_next/static/", "/_next/image", "/scripts/", "/*.js$", "/*.css$", "/*.json$"],
      },
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: ["/admin/", "/api/", "/_next/static/", "/_next/image"],
      },
    ],
    sitemap: "https://4bid.it/sitemap.xml",
    host: "https://4bid.it",
  }
}
