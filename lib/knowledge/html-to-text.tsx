/**
 * Extract clean text from HTML
 * No external dependencies - uses regex for tag stripping
 */

/**
 * Extract content from <main> tag or fallback to full body text
 */
export function extractMainContent(html: string): string {
  // Try to extract <main>...</main> content first
  const mainMatch = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i)
  let content = mainMatch ? mainMatch[1] : html

  // Remove script and style tags with their content
  content = content.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
  content = content.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")

  // Remove nav and footer
  content = content.replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, "")
  content = content.replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, "")
  content = content.replace(/<header[^>]*>[\s\S]*?<\/header>/gi, "")

  // Remove all HTML tags
  content = content.replace(/<[^>]+>/g, " ")

  // Decode HTML entities
  content = content
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&rsquo;/g, "'")
    .replace(/&lsquo;/g, "'")
    .replace(/&rdquo;/g, '"')
    .replace(/&ldquo;/g, '"')
    .replace(/&mdash;/g, "—")
    .replace(/&ndash;/g, "–")

  // Normalize whitespace
  content = content.replace(/\s+/g, " ").trim()

  return content
}

/**
 * Extract page title from HTML
 */
export function extractTitle(html: string): string {
  // Try <title> tag first
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
  if (titleMatch) {
    return titleMatch[1].trim().split("|")[0].split("-")[0].trim()
  }

  // Fallback to first <h1>
  const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i)
  if (h1Match) {
    return h1Match[1].trim()
  }

  return "Untitled"
}
