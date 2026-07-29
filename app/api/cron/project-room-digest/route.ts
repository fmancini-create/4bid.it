import { type NextRequest, NextResponse } from "next/server"
import { runProjectRoomDigest } from "@/lib/project-room/digest"

export const maxDuration = 120

/**
 * Cron ogni 5 minuti: manda il riepilogo delle novita' ai partecipanti dei
 * progetti la cui sessione di lavoro si e' appena chiusa.
 *
 * Non decide nulla: la logica (finestra di silenzio, watermark, lock, destinatari)
 * sta in `lib/project-room/digest.ts`, cosi' e' testabile senza passare da HTTP.
 *
 * Girare a vuoto e' il caso normale: nella maggior parte dei passaggi non c'e'
 * nulla da mandare e la risposta e' `sent: 0`.
 */
async function handle(request: NextRequest) {
  const authHeader = request.headers.get("authorization")
  const isVercelCron =
    request.headers.has("x-vercel-cron-signature") || request.headers.get("user-agent")?.includes("vercel-cron")
  const isManuallyAuthorized = Boolean(process.env.CRON_SECRET) && authHeader === `Bearer ${process.env.CRON_SECRET}`
  // Come gli altri cron del progetto. Nota: significa che una prova sul dev
  // server NON dimostra che l'autorizzazione funzioni in produzione.
  const isDev = process.env.NODE_ENV === "development"

  if (!isDev && !isVercelCron && !isManuallyAuthorized) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
  }

  try {
    const result = await runProjectRoomDigest()
    return NextResponse.json({ ok: true, ...result })
  } catch (error) {
    const message = error instanceof Error ? error.message : "errore sconosciuto"
    console.log("[v0] project-room-digest cron failed:", message)
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  return handle(request)
}

/** Vercel Cron usa GET; POST resta comodo per l'esecuzione manuale con curl. */
export async function POST(request: NextRequest) {
  return handle(request)
}
