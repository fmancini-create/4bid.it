import type { MetadataRoute } from "next"

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

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        // CSS and JS must stay crawlable. Both Google and Bing render pages
        // before ranking them, so blocking stylesheets and scripts leaves every
        // engine except Googlebot (which had its own allow-rule below) looking
        // at an unstyled, non-hydrated page. The previous rule disallowed
        // "/*.js$" and "/*.css$" for "*", which is exactly the configuration
        // Google's own guidance warns against.
        allow: ["/", "/llms.txt"],
        disallow: ["/admin/", "/api/", "/scripts/", "/*.json$"],
      },
      {
        userAgent: "Googlebot",
        allow: "/",
        // "/_next/static/" and "/_next/image" used to be disallowed here too,
        // which blocked Googlebot from the very chunks and optimised images it
        // needs to render the page. Only genuinely private paths stay blocked.
        disallow: ["/admin/", "/api/"],
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
