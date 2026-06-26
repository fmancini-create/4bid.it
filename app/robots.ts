import type { MetadataRoute } from "next"

// Crawler AI esplicitamente ammessi (GEO): consentono a 4BID di essere
// citata da ChatGPT, Gemini, Claude, Perplexity, ecc.
const AI_CRAWLERS = ["GPTBot", "Google-Extended", "anthropic-ai", "ClaudeBot", "CCBot", "PerplexityBot", "Bytespider"]

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/llms.txt"],
        disallow: ["/admin/", "/api/", "/_next/static/", "/_next/image", "/scripts/", "/*.js$", "/*.css$", "/*.json$"],
      },
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: ["/admin/", "/api/", "/_next/static/", "/_next/image"],
      },
      ...AI_CRAWLERS.map((userAgent) => ({
        userAgent,
        allow: ["/", "/llms.txt"],
        disallow: ["/admin/", "/api/"],
      })),
    ],
    sitemap: "https://www.4bid.it/sitemap.xml",
    host: "https://www.4bid.it",
  }
}
