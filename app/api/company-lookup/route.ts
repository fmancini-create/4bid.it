import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { lookupCompany } from "@/lib/company-lookup/openapi"

/**
 * Verifica di una partita IVA sui registri camerali.
 *
 * QUESTA ROTTA SPENDE DENARO REALE a ogni chiamata (circa 0,05 EUR sul nostro
 * conto OpenAPI). Il file `proxy.ts` protegge le PAGINE `/admin` ma NON le
 * rotte `/api`, quindi la sessione va verificata qui: senza questo controllo
 * chiunque conoscesse l'indirizzo potrebbe svuotare il nostro credito.
 */

const CONTROLLI_PER_MINUTO = 20
const finestra = new Map<string, number[]>()

function troppiControlli(chiave: string): boolean {
  const ora = Date.now()
  const precedenti = (finestra.get(chiave) || []).filter((t) => ora - t < 60_000)
  precedenti.push(ora)
  finestra.set(chiave, precedenti)
  return precedenti.length > CONTROLLI_PER_MINUTO
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Accesso riservato: effettua l'accesso." }, { status: 401 })
  }

  if (troppiControlli(user.id)) {
    return NextResponse.json({ error: "Troppi controlli in poco tempo. Attendi un minuto." }, { status: 429 })
  }

  let body: any
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Richiesta non valida." }, { status: 400 })
  }

  const identificativo = typeof body?.vat === "string" ? body.vat : ""
  if (!identificativo.trim()) {
    return NextResponse.json({ error: "Inserisci una partita IVA o un codice fiscale." }, { status: 400 })
  }

  const esito = await lookupCompany(identificativo)

  if (!esito.ok) {
    // Il motivo viaggia insieme al messaggio: a schermo serve distinguere
    // "dato sbagliato" (colpa di chi scrive) da "servizio non configurato"
    // (colpa nostra), altrimenti si invita a riprovare cio' che non puo' funzionare.
    const stato = esito.reason === "identificativo_non_valido" ? 400 : esito.reason === "non_trovata" ? 404 : 502
    return NextResponse.json({ error: esito.message, reason: esito.reason }, { status: stato })
  }

  console.log("[company-lookup]", user.email, identificativo, esito.fromCache ? "(da cache)" : "(chiamata a pagamento)")

  return NextResponse.json({ data: esito.data, fromCache: esito.fromCache })
}
