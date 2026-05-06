import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { fetchSitemapUrls, filterIndexableUrls } from "@/lib/knowledge/sitemap"
import { extractMainContent, extractTitle } from "@/lib/knowledge/html-to-text"
import { chunkText } from "@/lib/knowledge/chunk"

/**
 * CRON: Crawl Internal Site Pages
 *
 * Indicizza nel knowledge_base tutte le pagine pubbliche del sito 4bid.it:
 * - /guida-* (guide tematiche)
 * - /progetti/* (schede prodotti: Santaddeo, HotelProfitAI, Manubot, Hotel Accelerator,
 *   4BID Ecomobility, Autoexel, MyPetSenseAI, Risparmio Compulsivo)
 * - /eventi/* (eventi e lanci)
 * - Home + pagine marketing chiave (about, features, team, partner-info)
 *
 * Schedulato giornalmente (4 AM) in vercel.json. Triggerabile manualmente da
 * /admin/knowledge-base con il bottone "Sincronizza ora".
 *
 * SICUREZZA: Solo POST con header x-cron-secret o Authorization: Bearer
 */

const SITEMAP_URL = "https://www.4bid.it/sitemap.xml"

const BASE_KEYWORDS = ["4bid", "4bid srl"]

function getKeywordsForUrl(url: string): string[] {
  const keywords = [...BASE_KEYWORDS]
  const path = (() => {
    try {
      return new URL(url).pathname
    } catch {
      return ""
    }
  })()

  // Guide pages
  if (path.includes("/guida-")) {
    keywords.push("guida", "revenue management", "hotel")
    if (path.includes("pricing")) keywords.push("pricing", "tariffe", "prezzi", "dynamic pricing")
    if (path.includes("prenotazioni-dirette"))
      keywords.push("prenotazioni dirette", "direct booking", "disintermediazione", "OTA")
    if (path.includes("revenue-management")) keywords.push("revenue manager", "RevPAR", "ADR", "occupancy")
    return keywords
  }

  // Project pages -> ricco di keyword per il chatbot
  if (path.startsWith("/progetti/")) {
    keywords.push("prodotti 4bid", "ecosistema 4bid", "suite horeca")

    if (path.includes("santaddeo"))
      keywords.push(
        "santaddeo",
        "revenue management hotel",
        "rms",
        "dynamic pricing",
        "online",
        "santaddeo.com",
      )
    if (path.includes("hotelprofit-ai") || path.includes("hotelprofitai"))
      keywords.push(
        "hotelprofit ai",
        "hotelprofitai",
        "controllo di gestione hotel",
        "online",
        "hotelprofitai.com",
      )
    if (path.includes("manubot"))
      keywords.push(
        "manubot",
        "manutenzioni",
        "whatsapp bot",
        "telegram bot",
        "online",
        "manubot.it",
      )
    if (path.includes("hotel-accelerator") || path.includes("hotelaccelerator"))
      keywords.push("hotel accelerator", "acceleratore hotel", "in sviluppo")
    if (path.includes("ecomobility"))
      keywords.push("ecomobility", "4bid ecomobility", "mobilità elettrica", "colonnine ricarica")
    if (path.includes("autoexel"))
      keywords.push("autoexel", "excel ai", "analisi dati")
    if (path.includes("mypetsense") || path.includes("petsense"))
      keywords.push("mypetsenseai", "pet care", "animali domestici")
    if (path.includes("risparmio-compulsivo"))
      keywords.push("risparmio compulsivo", "app risparmio", "gamification")
    return keywords
  }

  // Eventi
  if (path.startsWith("/eventi/")) {
    keywords.push("evento", "lancio", "4bid")
    return keywords
  }

  // Home / pagine marketing
  if (path === "/") {
    keywords.push(
      "4bid holding",
      "ecosistema 4bid",
      "suite horeca",
      "software hotel",
      "tool turismo",
      "santaddeo",
      "hotelprofit ai",
      "manubot",
      "hotel accelerator",
      "ecomobility",
    )
    return keywords
  }
  if (path === "/about") keywords.push("chi siamo", "azienda", "4bid srl", "holding")
  if (path === "/features") keywords.push("funzionalità", "caratteristiche", "prodotti")
  if (path === "/team") keywords.push("team", "fondatori", "filippo mancini")
  if (path === "/partner" || path === "/partner-info") keywords.push("partner", "collaborazioni", "rivenditori")

  return keywords
}

function getCategoryForUrl(url: string): string {
  const path = (() => {
    try {
      return new URL(url).pathname
    } catch {
      return ""
    }
  })()
  if (path.includes("/guida-")) return "guide"
  if (path.startsWith("/progetti/")) return "project"
  if (path.startsWith("/eventi/")) return "event"
  if (path === "/") return "company"
  return "marketing"
}

function getPriorityForUrl(url: string): number {
  const path = (() => {
    try {
      return new URL(url).pathname
    } catch {
      return ""
    }
  })()
  // Priorità max per le pagine prodotto (informazioni più cercate dal chatbot)
  if (path.startsWith("/progetti/")) return 10
  if (path === "/" || path === "/about") return 9
  if (path.includes("/guida-")) return 8
  return 6
}

export async function POST(request: Request) {
  try {
    const cronSecret =
      request.headers.get("x-cron-secret") || request.headers.get("authorization")?.replace("Bearer ", "")
    const isVercelCron =
      request.headers.has("x-vercel-cron-signature") || request.headers.get("user-agent")?.includes("vercel-cron")
    const isManuallyAuthorized = cronSecret === process.env.CRON_SECRET
    const isDev = process.env.NODE_ENV === "development"

    if (!isDev && !isVercelCron && !isManuallyAuthorized) {
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

    // Step 2: Filter to indexable pages (guide + progetti + home + marketing)
    const indexableUrls = filterIndexableUrls(allUrls)
    console.log("[CrawlGuides] Filtered to", indexableUrls.length, "indexable URLs")
    stats.scanned = indexableUrls.length

    // Step 3: Process each URL
    for (const url of indexableUrls) {
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
        const category = getCategoryForUrl(url)
        const priority = getPriorityForUrl(url)

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
                category,
                priority,
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
              category,
              title: chunkTitle,
              content: chunk.content,
              keywords,
              is_active: true,
              priority,
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
