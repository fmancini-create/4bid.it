import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server-admin"
import { fetchAllNews, hashUrl } from "@/lib/press/google-news"

/**
 * CRON: Parlano di noi
 *
 * Ogni giorno interroga Google News RSS per le keyword di azienda e prodotti
 * (vedi lib/press/google-news.ts) e inserisce le notizie trovate nella tabella
 * press_mentions in stato "pending". Un super admin le approva/rifiuta da
 * /admin/parlano-di-noi prima che compaiano sulla pagina pubblica /parlano-di-noi.
 *
 * Dedup: url_hash univoco (insert con onConflict ignore).
 * Schedulato giornalmente in vercel.json. Triggerabile manualmente con
 * header x-cron-secret o Authorization: Bearer <CRON_SECRET>.
 */

export const dynamic = "force-dynamic"
export const maxDuration = 60

async function handler(request: Request) {
  const cronSecret =
    request.headers.get("x-cron-secret") || request.headers.get("authorization")?.replace("Bearer ", "")
  const isVercelCron =
    request.headers.has("x-vercel-cron-signature") || request.headers.get("user-agent")?.includes("vercel-cron")
  const isManuallyAuthorized = cronSecret === process.env.CRON_SECRET
  const isDev = process.env.NODE_ENV === "development"

  if (!isDev && !isVercelCron && !isManuallyAuthorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const stats = {
    fetched: 0,
    inserted: 0,
    duplicates: 0,
    errors: [] as string[],
  }

  try {
    const supabase = createAdminClient()

    const { items, errors } = await fetchAllNews()
    stats.fetched = items.length
    stats.errors.push(...errors)

    // Dedup intra-run (stessa notizia trovata da più keyword)
    const seen = new Set<string>()

    for (const item of items) {
      const url_hash = hashUrl(item.url)
      if (seen.has(url_hash)) continue
      seen.add(url_hash)

      const { error } = await supabase
        .from("press_mentions")
        .insert({
          title: item.title,
          url: item.url,
          source: item.source,
          snippet: item.snippet,
          keyword: item.keyword,
          published_at: item.publishedAt,
          status: "pending",
          url_hash,
        })

      if (error) {
        // 23505 = unique_violation -> notizia già presente (qualunque stato)
        if (error.code === "23505") {
          stats.duplicates++
        } else {
          stats.errors.push(`${item.url}: ${error.message}`)
        }
      } else {
        stats.inserted++
      }
    }

    console.log("[PressMentions] Completato:", {
      fetched: stats.fetched,
      inserted: stats.inserted,
      duplicates: stats.duplicates,
      errors: stats.errors.length,
    })

    return NextResponse.json({ success: true, ...stats })
  } catch (error: any) {
    console.error("[PressMentions] Errore fatale:", error)
    return NextResponse.json({ success: false, ...stats, fatal: error.message }, { status: 500 })
  }
}

export async function GET(request: Request) {
  return handler(request)
}

export async function POST(request: Request) {
  return handler(request)
}
