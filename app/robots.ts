import type { MetadataRoute } from "next"
import { PRIVATE_AREA_PREFIXES } from "@/lib/is-private-area"

// User-agent AI esplicitamente ammessi (GEO / AI discovery).
// OAI-SearchBot e' il crawler di OpenAI usato per la discovery in ChatGPT
// Search; GPTBot ha uno scopo distinto legato al potenziale training.
const AI_CRAWLERS = [
  "OAI-SearchBot",
  "GPTBot",
  "Google-Extended",
  "anthropic-ai",
  "ClaudeBot",
  "CCBot",
  "PerplexityBot",
  "Bytespider",
]

// IMPORTANT: use the exact same source of truth used by GA/GTM/Yandex.
// If a route is private for analytics it must also be private for crawlers;
// otherwise Google Tag Coverage can discover that URL from public navigation,
// crawl it, and correctly report it as "without tag" even though we deliberately
// never initialise marketing analytics there.
const PRIVATE_CRAWL_PATHS = [...PRIVATE_AREA_PREFIXES]

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        // CSS and JS must stay crawlable. Both Google and Bing render pages
        // before ranking them, so blocking stylesheets and scripts leaves every
        // engine except Googlebot looking at an unstyled, non-hydrated page.
        // Private application areas are excluded at the route-prefix level.
        allow: ["/", "/llms.txt"],
        disallow: [...PRIVATE_CRAWL_PATHS, "/api/", "/scripts/", "/*.json$"],
      },
      {
        userAgent: "Googlebot",
        allow: "/",
        // Keep public Next.js assets crawlable; block the same private route
        // prefixes that are excluded from public analytics.
        disallow: [...PRIVATE_CRAWL_PATHS, "/api/"],
      },
      ...AI_CRAWLERS.map((userAgent) => ({
        userAgent,
        allow: ["/", "/llms.txt"],
        disallow: [...PRIVATE_CRAWL_PATHS, "/api/"],
      })),
    ],
    sitemap: "https://www.4bid.it/sitemap.xml",
    host: "https://www.4bid.it",
  }
}
