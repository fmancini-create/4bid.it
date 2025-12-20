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

    const { url, category = "website" } = await request.json()

    console.log("[v0] Starting scrape for URL:", url)

    // Fetch the page
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.statusText}`)
    }

    const html = await response.text()
    const $ = cheerio.load(html)

    // Extract content from the page
    const title = $("title").text() || $("h1").first().text() || "Untitled"

    // Remove scripts, styles, nav, footer
    $("script, style, nav, footer, header").remove()

    // Get main content
    const mainContent = $("main").text() || $("article").text() || $("body").text()
    const content = mainContent.replace(/\s+/g, " ").trim().substring(0, 5000) // Limit to 5000 chars

    // Extract keywords from meta tags
    const metaKeywords =
      $('meta[name="keywords"]')
        .attr("content")
        ?.split(",")
        .map((k) => k.trim()) || []
    const metaDescription = $('meta[name="description"]').attr("content") || ""

    // Extract important words from title and headings
    const headings = $("h1, h2, h3")
      .map((_, el) => $(el).text())
      .get()
    const keywords = [...new Set([...metaKeywords, ...headings.slice(0, 5)])]

    console.log("[v0] Scraped content:", { title, contentLength: content.length, keywords })

    // Save to knowledge base
    const { data, error } = await supabase
      .from("knowledge_base")
      .insert({
        source: "website",
        source_url: url,
        category,
        title,
        content,
        keywords,
        priority: 5,
        last_scraped_at: new Date().toISOString(),
        created_by: user.email,
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Error saving to knowledge base:", error)
      throw error
    }

    console.log("[v0] Successfully saved to knowledge base:", data.id)

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error("[v0] Scrape error:", error)
    return NextResponse.json({ error: error.message || "Failed to scrape URL" }, { status: 500 })
  }
}
