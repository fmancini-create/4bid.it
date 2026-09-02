import { NextRequest } from "next/server"
import { generateText } from "ai"
import { createAdminClient } from "@/lib/supabase/server-admin"
import {
  calculateQuoteLine,
  formatQuoteAmount,
  isQuoteLineSelected,
  type QuoteLineItem,
  type SalesChannelQuote,
} from "@/lib/quotes/types"
import { getCommercialMeta, getIncludedCredits } from "@/lib/quotes/commercial"
import { QUOTE_BRANDS, quoteBenefits } from "@/lib/quotes/branding"

export const runtime = "nodejs"
export const maxDuration = 30

const REQUESTS_PER_MINUTE = 8
const requestWindows = new Map<string, number[]>()
const CORE_4BID_PROJECTS = ["hotelaccelerator", "santaddeo", "hotelprofitai", "manubot"] as const

function isRateLimited(key: string): boolean {
  const now = Date.now()
  const previous = (requestWindows.get(key) || []).filter((timestamp) => now - timestamp < 60_000)
  previous.push(now)
  requestWindows.set(key, previous)
  return previous.length > REQUESTS_PER_MINUTE
}

function describeLine(item: QuoteLineItem, currency: string): string {
  const calculated = calculateQuoteLine(item)
  const meta = getCommercialMeta(item)
  const benefits = quoteBenefits(item, 4)
  const credits = getIncludedCredits(item)
  const parts = [
    `Nome: ${item.name || item.description || "Voce"}`,
    `Descrizione: ${item.description || "non indicata"}`,
    `Stato: ${item.optional ? (isQuoteLineSelected(item) ? "opzionale selezionata" : "opzionale non selezionata") : "inclusa"}`,
    `Prezzo: ${formatQuoteAmount(calculated.amount, currency)}${calculated.billing_period === "monthly" ? " al mese" : calculated.billing_period === "yearly" ? " all'anno" : calculated.billing_period === "quarterly" ? " a trimestre" : " una tantum"}`,
  ]

  if (item.features?.length) parts.push(`Funzionalita: ${item.features.join("; ")}`)
  if (benefits.length) parts.push(`Benefici da evidenziare: ${benefits.join("; ")}`)
  if (item.trial_days) parts.push(`Prova inclusa: ${item.trial_days} giorni`)
  if (item.support?.notes || item.support?.level) parts.push(`Assistenza: ${item.support.notes || item.support.level}`)
  if (credits) parts.push(`Crediti inclusi: ${formatQuoteAmount(credits.amount, currency)} (${credits.recharge === "recurring" ? "ricaricati a ogni rinnovo" : "una tantum"})`)

  const monthly = meta.billing_options?.monthly
  const yearly = meta.billing_options?.yearly
  if (monthly?.unit_amount) parts.push(`Opzione mensile: ${formatQuoteAmount(monthly.unit_amount, currency)}`)
  if (yearly?.unit_amount) parts.push(`Opzione annuale: ${formatQuoteAmount(yearly.unit_amount, currency)}${yearly.discount_pct ? `, sconto ${yearly.discount_pct}%` : ""}`)

  return parts.join("\n")
}

function complementaryProducts(items: QuoteLineItem[]): string[] {
  const quoted = new Set(items.map((item) => (item.project || "").trim().toLowerCase()).filter(Boolean))
  return CORE_4BID_PROJECTS
    .filter((project) => !quoted.has(project))
    .map((project) => `${QUOTE_BRANDS[project].name}: ${QUOTE_BRANDS[project].promise} [NON incluso nel preventivo attuale]`)
}

function quoteSource(quote: Partial<SalesChannelQuote>, items: QuoteLineItem[]): string {
  const currency = quote.currency || "eur"
  const recipient = [quote.client_name, quote.client_company].filter(Boolean).join(" - ") || "cliente"
  const selected = items.filter(isQuoteLineSelected)
  const optional = items.filter((item) => item.optional && !isQuoteLineSelected(item))
  const complements = complementaryProducts(items)

  return [
    `Destinatario: ${recipient}`,
    `Numero preventivo: ${quote.quote_number || "non indicato"}`,
    `Titolo: ${quote.title || "Proposta 4BID"}`,
    quote.description ? `Obiettivo / descrizione: ${quote.description}` : null,
    `Totale attuale: ${formatQuoteAmount(quote.total_amount, currency)} (${quote.vat_included ? "IVA inclusa" : "IVA esclusa"})`,
    quote.payment_terms ? `Pagamento: ${quote.payment_terms}` : null,
    "",
    "SOLUZIONE SELEZIONATA:",
    ...selected.map((item) => describeLine(item, currency)),
    optional.length ? "\nOPZIONI NON ANCORA SELEZIONATE:" : null,
    ...optional.map((item) => describeLine(item, currency)),
    complements.length ? "\nECOSISTEMA 4BID COMPLEMENTARE (NON incluso nel preventivo):" : null,
    ...complements,
  ].filter(Boolean).join("\n\n")
}

async function synthesizeSpeech(text: string): Promise<Uint8Array> {
  const token = process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN
  if (!token) throw new Error("AI Gateway non configurato")

  const authMethod = process.env.AI_GATEWAY_API_KEY ? "api-key" : "oidc"
  const response = await fetch("https://ai-gateway.vercel.sh/v4/ai/speech-model", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "ai-model-id": "openai/tts-1-hd",
      "ai-gateway-protocol-version": "0.0.1",
      "ai-gateway-auth-method": authMethod,
    },
    body: JSON.stringify({
      text,
      voice: "shimmer",
      outputFormat: "mp3",
      speed: 0.96,
      language: "it",
    }),
  })

  if (!response.ok) {
    const details = await response.text()
    throw new Error(`Sintesi vocale non disponibile (${response.status}): ${details.slice(0, 300)}`)
  }

  const payload = await response.json() as { audio?: string }
  if (!payload.audio) throw new Error("Audio non restituito dal provider")
  return Uint8Array.from(Buffer.from(payload.audio, "base64"))
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params
    const body = await request.json().catch(() => ({})) as { lineId?: string | null; spokenText?: string | null }
    const lineId = typeof body.lineId === "string" && body.lineId.trim() ? body.lineId.trim() : null
    const spokenText = typeof body.spokenText === "string" ? body.spokenText.trim() : ""
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown"

    if (isRateLimited(`${token}:${ip}`)) {
      return Response.json({ error: "Troppe richieste audio. Riprova tra un minuto." }, { status: 429 })
    }

    if (spokenText.length > 1200) {
      return Response.json({ error: "Risposta troppo lunga per la sintesi vocale" }, { status: 400 })
    }

    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from("sales_channel_quotes")
      .select("quote_number, title, description, line_items, total_amount, vat_included, currency, payment_terms, client_name, client_company, status, payment_status, expires_at, expired_at")
      .eq("token", token)
      .maybeSingle<Partial<SalesChannelQuote>>()

    if (error || !data) return Response.json({ error: "Preventivo non trovato" }, { status: 404 })

    if (spokenText) {
      const audio = await synthesizeSpeech(spokenText)
      return new Response(audio, {
        status: 200,
        headers: {
          "Content-Type": "audio/mpeg",
          "Content-Length": String(audio.byteLength),
          "Cache-Control": "private, no-store",
          "X-Content-Type-Options": "nosniff",
        },
      })
    }

    const items = (data.line_items || []) as QuoteLineItem[]
    const requestedLine = lineId ? items.find((item) => item.id === lineId) : null
    if (lineId && !requestedLine) return Response.json({ error: "Modulo non trovato nel preventivo" }, { status: 404 })

    const recipient = [data.client_name, data.client_company].filter(Boolean).join(" - ") || "il cliente"
    const source = requestedLine
      ? `Destinatario: ${recipient}\nNumero preventivo: ${data.quote_number || "non indicato"}\n\nMODULO DA RACCONTARE:\n${describeLine(requestedLine, data.currency || "eur")}`
      : quoteSource(data, items)

    const { text } = await generateText({
      model: "openai/gpt-4o-mini",
      temperature: 0.55,
      maxOutputTokens: requestedLine ? 180 : 360,
      system: `Sei la voce commerciale di 4BID. Trasforma esclusivamente i dati forniti in una breve presentazione parlata in italiano.\n\nTONO: caldo, elegante, rassicurante, umano, competente e coinvolgente. Deve far percepire il valore concreto senza sembrare una televendita.\n\nREGOLE:\n- Non inventare mai funzioni, risultati, numeri, tempi o garanzie non presenti nei dati.\n- Parla direttamente al destinatario; usa il nome con naturalezza al massimo una volta.\n- Spiega prima il problema/beneficio, poi la funzione: non leggere una lista tecnica.\n- Se racconti un singolo modulo: 55-85 parole, circa 25-35 secondi; NON introdurre altri prodotti 4BID, perche' il focus e' quel modulo.\n- Se racconti l'intero preventivo: 130-190 parole. Prima racconta bene cio' che e' incluso/proposto. Poi, solo in chiusura e se naturale, puoi citare 1-2 prodotti complementari dell'ecosistema 4BID presenti nei dati, dichiarando chiaramente che NON sono inclusi nel preventivo attuale.\n- Scegli eventuali prodotti complementari in base alla struttura e al problema che il preventivo sta risolvendo; niente catalogo completo e niente cross-sell casuale.\n- Prezzi e sconti vanno citati solo quando aiutano a capire la proposta; niente elenco notarile.\n- Non attribuire mai a un prodotto complementare prezzi, condizioni o funzioni che non siano esplicitamente indicate nei dati.\n- Chiudi con una frase morbida che faccia immaginare il risultato operativo, senza promesse assolute.\n- Niente markdown, titoli, emoji o elenchi: solo testo naturale da pronunciare.`,
      prompt: source,
    })

    const narration = text.trim()
    if (!narration) return Response.json({ error: "Non e' stato possibile generare la spiegazione" }, { status: 502 })

    const audio = await synthesizeSpeech(narration)
    return new Response(audio, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": String(audio.byteLength),
        "Cache-Control": "private, max-age=3600",
        "X-Content-Type-Options": "nosniff",
      },
    })
  } catch (error) {
    console.error("[quote-narration]", error)
    return Response.json({ error: error instanceof Error ? error.message : "Errore nella narrazione" }, { status: 500 })
  }
}
