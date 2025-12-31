import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { fetchSitemapUrls, filterGuideUrls } from "@/lib/knowledge/sitemap"
import { extractMainContent, extractTitle } from "@/lib/knowledge/html-to-text"
import { chunkText } from "@/lib/knowledge/chunk"

/**
 * CRON: Crawl Internal Guide Pages
 *
 * Indicizza le pagine /guida-* del sito 4bid.it nella knowledge_base
 *
 * SICUREZZA: Solo POST con header x-cron-secret o Authorization: Bearer
 *
 * COME TESTARE:
 * curl -i -X POST "https://www.4bid.it/api/cron/crawl-internal-guides" ^
 *   -H "x-cron-secret: IL_TUO_CRON_SECRET"
 *
 * GET non è supportato -> 405 Method Not Allowed
 * POST senza header -> 401 Unauthorized
 */

const SITEMAP_URL = "https://www.4bid.it/sitemap.xml"

// Keywords for guide pages
const BASE_KEYWORDS = ["guida", "4bid", "revenue management", "hotel"]

function getKeywordsForUrl(url: string): string[] {
  const keywords = [...BASE_KEYWORDS]

  if (url.includes("pricing")) {
    keywords.push("pricing", "tariffe", "prezzi", "dynamic pricing")
  }
  if (url.includes("prenotazioni-dirette")) {
    keywords.push("prenotazioni dirette", "direct booking", "disintermediazione", "OTA")
  }
  if (url.includes("revenue-management")) {
    keywords.push("revenue manager", "RevPAR", "ADR", "occupancy")
  }

  return keywords
}

export async function POST(request: Request) {
  try {
    const cronSecret =
      request.headers.get("x-cron-secret") || request.headers.get("authorization")?.replace("Bearer ", "")

    if (!cronSecret || cronSecret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = await createClient()

    const stats = {
      scanned: 0,
      indexed: 0,
      skipped: 0,
      errors: 0,
      details: [] as string[],
    }

    // Step 1: Fetch sitemap
    console.log("[CrawlGuides] Fetching sitemap from", SITEMAP_URL)
    const allUrls = await fetchSitemapUrls(SITEMAP_URL)
    console.log("[CrawlGuides] Found", allUrls.length, "total URLs in sitemap")

    // Step 2: Filter to guide pages only
    const guideUrls = filterGuideUrls(allUrls)
    console.log("[CrawlGuides] Filtered to", guideUrls.length, "guide URLs")
    stats.scanned = guideUrls.length

    // Step 3: Process each guide URL
    for (const url of guideUrls) {
      try {
        console.log("[CrawlGuides] Processing:", url)

        // Fetch HTML
        const response = await fetch(url, {
          headers: {
            Accept: "text/html",
            "User-Agent": "4BID-Internal-Crawler/1.0",
          },
        })

        if (!response.ok) {
          console.error("[CrawlGuides] Failed to fetch:", url, response.status)
          stats.errors++
          stats.details.push(`${url}: HTTP ${response.status}`)
          continue
        }

        const html = await response.text()

        // Extract content
        const title = extractTitle(html)
        const content = extractMainContent(html)

        if (!content || content.length < 100) {
          console.log("[CrawlGuides] Skipping empty/short content:", url)
          stats.skipped++
          stats.details.push(`${url}: content too short`)
          continue
        }

        // Chunk content if needed
        const chunks = chunkText(content)
        const keywords = getKeywordsForUrl(url)

        // Process each chunk
        for (const chunk of chunks) {
          const sourceUrl = chunk.totalParts > 1 ? `${url}#part=${chunk.partNumber}` : url

          const chunkTitle = chunk.totalParts > 1 ? `${title} (parte ${chunk.partNumber})` : title

          // Check if record exists
          const { data: existing } = await supabase
            .from("knowledge_base")
            .select("id, content")
            .eq("source_url", sourceUrl)
            .single()

          if (existing) {
            // Compare content - skip if identical
            if (existing.content === chunk.content) {
              console.log("[CrawlGuides] Content unchanged, skipping:", sourceUrl)
              stats.skipped++
              continue
            }

            // Update existing record
            const { error: updateError } = await supabase
              .from("knowledge_base")
              .update({
                title: chunkTitle,
                content: chunk.content,
                keywords,
                priority: 8,
                last_scraped_at: new Date().toISOString(),
              })
              .eq("id", existing.id)

            if (updateError) {
              console.error("[CrawlGuides] Update error:", updateError)
              stats.errors++
              stats.details.push(`${sourceUrl}: update failed - ${updateError.message}`)
            } else {
              console.log("[CrawlGuides] Updated:", sourceUrl)
              stats.indexed++
            }
          } else {
            // Insert new record
            const { error: insertError } = await supabase.from("knowledge_base").insert({
              source: "internal",
              source_url: sourceUrl,
              category: "guide",
              title: chunkTitle,
              content: chunk.content,
              keywords,
              is_active: true,
              priority: 8,
              last_scraped_at: new Date().toISOString(),
              created_by: "system",
            })

            if (insertError) {
              console.error("[CrawlGuides] Insert error:", insertError)
              stats.errors++
              stats.details.push(`${sourceUrl}: insert failed - ${insertError.message}`)
            } else {
              console.log("[CrawlGuides] Inserted:", sourceUrl)
              stats.indexed++
            }
          }
        }

        // Log to crawl_logs (use null for site_id since this is internal)
        await supabase.from("crawl_logs").insert({
          site_id: null,
          url,
          status: "success",
          pages_found: 1,
          knowledge_items_added: chunks.length,
        })
      } catch (urlError: any) {
        console.error("[CrawlGuides] Error processing URL:", url, urlError)
        stats.errors++
        stats.details.push(`${url}: ${urlError.message}`)

        await supabase.from("crawl_logs").insert({
          site_id: null,
          url,
          status: "error",
          error_message: urlError.message,
        })
      }
    }

    console.log("[CrawlGuides] Completed:", stats)

    return NextResponse.json({
      success: true,
      ...stats,
    })
  } catch (error: any) {
    console.error("[CrawlGuides] Fatal error:", error)
    return NextResponse.json(
      {
        success: false,
        scanned: 0,
        indexed: 0,
        skipped: 0,
        errors: 1,
        details: [error.message || "Internal error"],
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 })
}
