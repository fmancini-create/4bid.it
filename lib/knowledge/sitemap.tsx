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
