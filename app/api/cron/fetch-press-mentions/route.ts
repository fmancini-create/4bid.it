import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server-admin"
import { fetchAllNews, pressDedupHash } from "@/lib/press/google-news"
import { sendEmail } from "@/lib/email-resend"

const NOTIFY_EMAIL = process.env.PRESS_NOTIFY_EMAIL || "f.mancini@4bid.it"
const SITE_URL = "https://www.4bid.it"

/** Costruisce l'email di notifica con le nuove menzioni in attesa di moderazione. */
function buildNotificationHtml(items: { title: string; source: string | null; keyword: string }[]) {
  const rows = items
    .map(
      (it) => `
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #eee;font-size:14px;color:#1f2937;">
          <strong>${escapeHtml(it.title)}</strong><br/>
          <span style="color:#6b7280;font-size:12px;">${escapeHtml(it.source || "Fonte sconosciuta")} · ricerca: ${escapeHtml(it.keyword)}</span>
        </td>
      </tr>`,
    )
    .join("")

  return `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;">
    <h2 style="color:#1f4e79;font-size:20px;margin-bottom:4px;">Nuove menzioni stampa da moderare</h2>
    <p style="color:#374151;font-size:14px;margin-top:0;">
      Il monitoraggio giornaliero ha trovato <strong>${items.length}</strong> nuova/e notizia/e su 4BID e i suoi prodotti.
      Sono in attesa della tua approvazione prima di comparire sul sito.
    </p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0;border:1px solid #eee;border-radius:8px;overflow:hidden;">
      ${rows}
    </table>
    <a href="${SITE_URL}/admin/parlano-di-noi"
       style="display:inline-block;background:#1f4e79;color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px;font-size:14px;font-weight:bold;">
      Vai al pannello di moderazione
    </a>
    <p style="color:#9ca3af;font-size:12px;margin-top:20px;">
      Ricevi questa email perché sei l'amministratore di 4BID.IT. La pubblicazione resta manuale: nulla appare online senza la tua approvazione.
    </p>
  </div>`
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

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
  const insertedItems: { title: string; source: string | null; keyword: string }[] = []

  try {
    const supabase = createAdminClient()

    const { items, errors } = await fetchAllNews()
    stats.fetched = items.length
    stats.errors.push(...errors)

    // Dedup intra-run (stessa notizia trovata da più keyword)
    const seen = new Set<string>()

    for (const item of items) {
      const url_hash = pressDedupHash(item.title, item.source)
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
        insertedItems.push({ title: item.title, source: item.source, keyword: item.keyword })
      }
    }

    console.log("[PressMentions] Completato:", {
      fetched: stats.fetched,
      inserted: stats.inserted,
      duplicates: stats.duplicates,
      errors: stats.errors.length,
    })

    // Notifica email al super admin SOLO se ci sono nuove menzioni da moderare.
    if (insertedItems.length > 0) {
      try {
        const res = await sendEmail({
          to: NOTIFY_EMAIL,
          subject: `[4BID] ${insertedItems.length} nuova/e menzione/i stampa da moderare`,
          html: buildNotificationHtml(insertedItems),
        })
        if (!res.success) {
          console.error("[PressMentions] Notifica email fallita:", res.error)
        }
      } catch (e) {
        console.error("[PressMentions] Eccezione invio notifica:", e)
      }
    }

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
