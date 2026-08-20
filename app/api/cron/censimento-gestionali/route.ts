import { type NextRequest, NextResponse } from "next/server"
import { CENSIMENTO_LOTTO, processaLottoCensimento } from "@/lib/hospitality/census"

export const dynamic = "force-dynamic"
export const maxDuration = 180

async function handler(request: NextRequest) {
  const authorization = request.headers.get("authorization")
  const validSecret = Boolean(process.env.CRON_SECRET) && authorization === `Bearer ${process.env.CRON_SECRET}`
  const isDev = process.env.NODE_ENV === "development"

  // Fail closed, come le altre rotte cron: senza il segreto non si entra. Questa
  // rotta scrive su 25.442 righe, quindi lasciarla aperta significherebbe dare a
  // chiunque il modo di far ripartire un censimento.
  if (!isDev && !validSecret) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
  }

  try {
    const richiesto = Number(new URL(request.url).searchParams.get("limite") || CENSIMENTO_LOTTO)
    // Il limite arriva da fuori: va tenuto dentro un intervallo sensato,
    // altrimenti un valore enorme fa uccidere la funzione a metà lotto.
    const limite = Number.isFinite(richiesto) ? Math.min(Math.max(Math.trunc(richiesto), 1), 1000) : CENSIMENTO_LOTTO

    const esito = await processaLottoCensimento(limite)
    return NextResponse.json({ ok: true, ...esito })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Errore censimento gestionali"
    console.log("[v0] Censimento gestionali fallito:", message)
    // 500 e non 200: un cron che risponde "ok" quando ha fallito e' il modo in
    // cui un censimento resta fermo per giorni senza che nessuno se ne accorga.
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  return handler(request)
}

export async function POST(request: NextRequest) {
  return handler(request)
}
