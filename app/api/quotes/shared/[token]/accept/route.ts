import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server-admin"
import { notifyAdminQuoteAccepted } from "@/lib/quotes/email"
import { decodeCredential, encodeCredential, type QuoteBillingDetails, type QuoteRequestedField, type SalesChannelQuote } from "@/lib/quotes/types"

const SUPER_ADMIN_EMAIL = "f.mancini@4bid.it"
const MAX_FIELD_LENGTH = 5000

export async function POST(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const supabase = createAdminClient()
  const body = await request.json().catch(() => null)
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Dati non validi" }, { status: 400 })

  const { data: quote, error } = await supabase.from("sales_channel_quotes").select("*").eq("token", token).maybeSingle<SalesChannelQuote>()
  if (error || !quote) return NextResponse.json({ error: "Preventivo non trovato" }, { status: 404 })
  if (quote.status === "paid") return NextResponse.json({ error: "Preventivo già completato" }, { status: 409 })
  if (quote.accepted_at) return NextResponse.json({ success: true, payment_method: quote.payment_method, already_accepted: true })
  if (quote.expires_at && new Date(quote.expires_at) < new Date()) return NextResponse.json({ error: "Questo preventivo è scaduto" }, { status: 410 })

  const acceptanceName = String(body.acceptance_name || "").trim().slice(0, 200)
  if (!acceptanceName) return NextResponse.json({ error: "Il nome per l'accettazione è obbligatorio" }, { status: 400 })
  if (body.accepted !== true) return NextResponse.json({ error: "Devi accettare il preventivo e le condizioni" }, { status: 400 })

  const paymentMethod = body.payment_method
  if (paymentMethod !== "bonifico" && paymentMethod !== "card") return NextResponse.json({ error: "Metodo di pagamento non valido" }, { status: 400 })

  const submitted: Record<string, string> = {}
  const requested = (quote.requested_fields || []) as QuoteRequestedField[]
  const incoming = (body.submitted_fields && typeof body.submitted_fields === "object" ? body.submitted_fields : {}) as Record<string, unknown>
  for (const field of requested) {
    if (field.type === "credentials") {
      const cred = decodeCredential(String(incoming[field.key] || ""))
      if (field.required && (!cred.id.trim() || !cred.password.trim())) return NextResponse.json({ error: `Compila ID e password per: ${field.label}` }, { status: 400 })
      submitted[field.key] = encodeCredential(cred.id.slice(0, 1000), cred.password.slice(0, 1000))
    } else {
      const value = String(incoming[field.key] ?? "").trim().slice(0, MAX_FIELD_LENGTH)
      if (field.required && !value) return NextResponse.json({ error: `Campo obbligatorio mancante: ${field.label}` }, { status: 400 })
      submitted[field.key] = value
    }
  }

  const rawBilling = (body.billing_details && typeof body.billing_details === "object" ? body.billing_details : {}) as Record<string, unknown>
  const billing: QuoteBillingDetails = {}
  const billingKeys: (keyof QuoteBillingDetails)[] = ["company","vat","tax_code","address","zip","city","province","sdi_code","pec","reference"]
  for (const key of billingKeys) {
    const value = String(rawBilling[key] ?? "").trim().slice(0, 500)
    if (value) billing[key] = value
  }
  for (const [key, label] of [["company","Ragione sociale"],["vat","Partita IVA"],["address","Indirizzo"],["zip","CAP"],["city","Città"],["province","Provincia"]] as const) {
    if (!billing[key]) return NextResponse.json({ error: `Dati di fatturazione: ${label} obbligatorio` }, { status: 400 })
  }
  if (!billing.sdi_code && !billing.pec) return NextResponse.json({ error: "Inserisci Codice SDI oppure PEC" }, { status: 400 })

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || null
  const nowIso = new Date().toISOString()
  const { data: updated, error: updateError } = await supabase.from("sales_channel_quotes").update({
    submitted_fields: submitted, billing_details: billing, submitted_at: nowIso, accepted_at: nowIso,
    acceptance_name: acceptanceName, acceptance_ip: ip, payment_method: paymentMethod,
    payment_status: paymentMethod === "bonifico" ? "awaiting_transfer" : "pending", status: "accepted", updated_at: nowIso,
  }).eq("id", quote.id).is("accepted_at", null).select().single<SalesChannelQuote>()

  if (updateError || !updated) return NextResponse.json({ error: updateError?.message || "Preventivo già accettato o errore salvataggio" }, { status: 409 })
  try { await notifyAdminQuoteAccepted(updated, SUPER_ADMIN_EMAIL) } catch (e) { console.error("[quotes] notify accepted error:", e) }
  return NextResponse.json({ success: true, payment_method: paymentMethod })
}
