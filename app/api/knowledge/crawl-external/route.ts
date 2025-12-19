import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import * as cheerio from "cheerio"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Check admin auth
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user || user.email !== "f.mancini@4bid.it") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { siteId } = await request.json()

    console.log("[v0] Starting crawl for site:", siteId)

    // Get site details
    const { data: site, error: siteError } = await supabase.from("external_sites").select("*").eq("id", siteId).single()

    if (siteError || !site) {
      throw new Error("Site not found")
    }

    console.log("[v0] Crawling site:", site.name, site.base_url)

    let pagesFound = 0
    let knowledgeItemsAdded = 0
    const errors: string[] = []

    try {
      // Fetch homepage
      const response = await fetch(site.base_url)
      if (!response.ok) {
        throw new Error(`Failed to fetch ${site.base_url}`)
      }

      const html = await response.text()
      const $ = cheerio.load(html)

      // Extract homepage content
      $("script, style, nav, footer").remove()
      const title = $("title").text() || site.name
      const mainContent = $("main").text() || $("article").text() || $("body").text()
      const content = mainContent.replace(/\s+/g, " ").trim().substring(0, 5000)

      // Save homepage to knowledge base
      const { error: insertError } = await supabase.from("knowledge_base").insert({
        source: "external",
        source_url: site.base_url,
        category: "project",
        title: `${site.name} - Homepage`,
        content,
        keywords: [site.name, site.description || ""],
        priority: 8,
        last_scraped_at: new Date().toISOString(),
        created_by: user.email,
      })

      if (!insertError) {
        knowledgeItemsAdded++
      }

      pagesFound++

      // Find and crawl additional pages (limit to 5 pages per site)
      const links = $("a[href]")
        .map((_, el) => $(el).attr("href"))
        .get()
        .filter((href) => href && (href.startsWith("/") || href.startsWith(site.base_url)))
        .map((href) => (href.startsWith("/") ? `${site.base_url}${href}` : href))
        .filter((href, index, self) => self.indexOf(href) === index) // unique
        .slice(0, 5)

      console.log("[v0] Found links:", links.length)

      for (const link of links) {
        try {
          const pageResponse = await fetch(link)
          if (pageResponse.ok) {
            const pageHtml = await pageResponse.text()
            const page$ = cheerio.load(pageHtml)

            page$("script, style, nav, footer").remove()
            const pageTitle = page$("title").text() || page$("h1").first().text()
            const pageContent = (page$("main").text() || page$("body").text())
              .replace(/\s+/g, " ")
              .trim()
              .substring(0, 5000)

            await supabase.from("knowledge_base").insert({
              source: "external",
              source_url: link,
              category: "project",
              title: `${site.name} - ${pageTitle}`,
              content: pageContent,
              keywords: [site.name],
              priority: 7,
              last_scraped_at: new Date().toISOString(),
              created_by: user.email,
            })

            knowledgeItemsAdded++
            pagesFound++
          }
        } catch (pageError: any) {
          console.error("[v0] Error crawling page:", link, pageError.message)
          errors.push(`${link}: ${pageError.message}`)
        }
      }

      // Update site last crawled
      await supabase
        .from("external_sites")
        .update({
          last_crawled_at: new Date().toISOString(),
          pages_crawled: pagesFound,
        })
        .eq("id", siteId)

      // Log crawl
      await supabase.from("crawl_logs").insert({
        site_id: siteId,
        url: site.base_url,
        status: "success",
        pages_found: pagesFound,
        knowledge_items_added: knowledgeItemsAdded,
        error_message: errors.length > 0 ? errors.join("; ") : null,
      })

      console.log("[v0] Crawl completed:", { pagesFound, knowledgeItemsAdded })

      return NextResponse.json({
        success: true,
        pagesFound,
        knowledgeItemsAdded,
        errors,
      })
    } catch (crawlError: any) {
      console.error("[v0] Crawl error:", crawlError)

      await supabase.from("crawl_logs").insert({
        site_id: siteId,
        url: site.base_url,
        status: "failed",
        error_message: crawlError.message,
      })

      throw crawlError
    }
  } catch (error: any) {
    console.error("[v0] External crawl error:", error)
    return NextResponse.json({ error: error.message || "Failed to crawl site" }, { status: 500 })
  }
}
