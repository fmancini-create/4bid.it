/**
 * Fetch and parse sitemap.xml to extract URLs
 * No external dependencies - uses native fetch and regex
 */

export async function fetchSitemapUrls(sitemapUrl: string, timeoutMs = 15000): Promise<string[]> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

    const response = await fetch(sitemapUrl, {
      signal: controller.signal,
      headers: {
        Accept: "application/xml, text/xml",
        "User-Agent": "4BID-Internal-Crawler/1.0",
      },
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`Failed to fetch sitemap: ${response.status}`)
    }

    const xml = await response.text()

    // Extract all <loc>...</loc> URLs using regex (no external XML parser)
    const locRegex = /<loc>([^<]+)<\/loc>/g
    const urls: string[] = []
    let match

    while ((match = locRegex.exec(xml)) !== null) {
      const url = match[1].trim()
      if (url) {
        urls.push(url)
      }
    }

    return urls
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`Sitemap fetch timeout after ${timeoutMs}ms`)
    }
    throw error
  }
}

/**
 * Filter URLs to only include guide pages
 */
export function filterGuideUrls(urls: string[]): string[] {
  return urls.filter((url) => url.includes("/guida-"))
}

/**
 * Filter URLs to include all pages relevant to the chatbot knowledge base:
 * - Guide pages (/guida-*)
 * - Product/project pages (/progetti/*)
 * - Key marketing pages (home, about, features, team, partner-info, request-info)
 *
 * Excludes admin areas, auth, dashboards, blog, seo landing pages and tools.
 */
const PUBLIC_PAGES_WHITELIST = new Set([
  "/",
  "/about",
  "/features",
  "/team",
  "/partner",
  "/partner-info",
  "/request-info",
  "/volantino",
  "/coming-soon",
])

const EXCLUDED_PATH_PREFIXES = [
  "/admin",
  "/superadmin",
  "/dashboard",
  "/dashboard-v2",
  "/dashboard-v3",
  "/dati",
  "/onboarding",
  "/auth",
  "/profile",
  "/profilo",
  "/settings",
  "/notifiche",
  "/notifications",
  "/calendar",
  "/occupancy",
  "/api",
  "/blog/",
  "/seo/",
]

export function filterIndexableUrls(urls: string[]): string[] {
  const seen = new Set<string>()
  const result: string[] = []

  for (const url of urls) {
    if (seen.has(url)) continue
    seen.add(url)

    let pathname: string
    try {
      pathname = new URL(url).pathname
    } catch {
      continue
    }

    // Exclude private/admin/auth areas and noisy SEO landings
    if (EXCLUDED_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
      continue
    }

    // Include: guide pages
    if (pathname.includes("/guida-")) {
      result.push(url)
      continue
    }

    // Include: product / project pages
    if (pathname.startsWith("/progetti/") || pathname.startsWith("/progetti")) {
      result.push(url)
      continue
    }

    // Include: events
    if (pathname.startsWith("/eventi/")) {
      result.push(url)
      continue
    }

    // Include: explicit whitelist
    if (PUBLIC_PAGES_WHITELIST.has(pathname)) {
      result.push(url)
      continue
    }
  }

  return result
}
