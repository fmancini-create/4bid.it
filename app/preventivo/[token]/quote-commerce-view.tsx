"use client"

import { useMemo, useState } from "react"
import Image from "next/image"
import { toast } from "sonner"
import { Banknote, Check, CheckCircle2, CreditCard, FileText, Loader2, Receipt, ShieldCheck, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  calculateQuoteLine,
  decodeCredential,
  encodeCredential,
  formatQuoteAmount,
  type QuoteBillingDetails,
  type QuoteLineItem,
  type QuoteRequestedField,
  type SalesChannelQuote,
} from "@/lib/quotes/types"
import { QUOTE_BANK_DETAILS, quoteTransferReason } from "@/lib/quotes/bank"

type Props = { token: string; quote: Partial<SalesChannelQuote>; expired: boolean }
type PaymentMethod = "bonifico" | "card"

const SAAS_PROJECTS = new Set(["hotelaccelerator", "santaddeo", "hotelprofitai", "manubot"])
const projectNames: Record<string, string> = {
  hotelaccelerator: "HotelAccelerator",
  santaddeo: "Santaddeo",
  hotelprofitai: "HotelProfitAI",
  manubot: "ManuBot",
  consulting: "Consulenza 4BID",
  custom: "Servizio personalizzato",
}
const periodNames: Record<string, string> = { one_time: "una tantum", monthly: "mese", quarterly: "trimestre", yearly: "anno" }

function hasCommerceData(item: QuoteLineItem) {
  return Boolean(item.project || item.features?.length || item.discount || item.trial_days || item.support || item.optional)
}

function LineItemCard({
  item,
  currency,
  selected,
  locked,
  onSelectedChange,
}: {
  item: QuoteLineItem
  currency: string
  selected: boolean
  locked: boolean
  onSelectedChange: (value: boolean) => void
}) {
  const calculated = calculateQuoteLine(item)
  const listAmount = Number(calculated.list_amount ?? 0)
  const discountAmount = Number(calculated.discount_amount ?? 0)
  const hasDiscount = discountAmount > 0 && listAmount > calculated.amount
  const period = periodNames[calculated.billing_period || "one_time"] || calculated.billing_period

  return (
    <article className={`rounded-xl border bg-background p-5 space-y-4 transition ${selected ? "border-primary/40" : "border-border opacity-60"}`}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3 min-w-0">
          {item.optional ? (
            <Checkbox checked={selected} disabled={locked} onCheckedChange={(value) => onSelectedChange(value === true)} className="mt-1" />
          ) : (
            <div className="mt-1 flex h-4 w-4 items-center justify-center rounded-sm bg-primary text-primary-foreground"><Check className="h-3 w-3" /></div>
          )}
          <div className="min-w-0">
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-primary">{projectNames[item.project || "custom"] || item.project || "4BID"}</span>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${item.optional ? "bg-amber-100 text-amber-800" : "bg-muted text-muted-foreground"}`}>{item.optional ? "Opzionale" : "Inclusa"}</span>
              {item.trial_days ? <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">{item.trial_days} giorni di prova</span> : null}
            </div>
            <h3 className="text-lg font-semibold">{item.name || item.description}</h3>
            {item.name && item.description && item.description !== item.name ? <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{item.description}</p> : null}
          </div>
        </div>
        <div className="shrink-0 text-left sm:text-right">
          {hasDiscount ? <div className="text-sm text-muted-foreground line-through">{formatQuoteAmount(listAmount, currency)}</div> : null}
          <div className="text-xl font-bold">{formatQuoteAmount(calculated.amount, currency)}</div>
          <div className="text-xs text-muted-foreground">/{period}</div>
          {hasDiscount ? <div className="mt-1 text-xs font-semibold text-emerald-700">Risparmio {formatQuoteAmount(discountAmount, currency)}{item.discount?.type === "percentage" ? ` (${item.discount.value}%)` : ""}</div> : null}
        </div>
      </div>

      {(calculated.quantity || 1) > 1 ? <p className="text-xs text-muted-foreground">Quantità: <strong className="text-foreground">{calculated.quantity}</strong>{calculated.unit_amount != null ? ` × ${formatQuoteAmount(calculated.unit_amount, currency)}` : ""}</p> : null}
      {item.discount?.duration_months ? <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">Sconto valido per i primi <strong>{item.discount.duration_months} mesi</strong>{item.discount.reason ? ` · ${item.discount.reason}` : ""}</div> : item.discount?.reason ? <p className="text-xs text-muted-foreground">Condizione promozionale: {item.discount.reason}</p> : null}

      {item.features?.length ? <div><p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Incluso</p><div className="grid gap-1.5 sm:grid-cols-2">{item.features.map((feature, index) => <div key={`${feature}-${index}`} className="flex items-start gap-2 text-sm"><Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /><span>{feature}</span></div>)}</div></div> : null}

      {item.support && Object.values(item.support).some(Boolean) ? <div className="rounded-lg bg-muted/50 p-3 text-sm"><div className="mb-1 flex items-center gap-2 font-medium"><ShieldCheck className="h-4 w-4 text-primary" /> Assistenza e onboarding</div><div className="space-y-1 text-muted-foreground">{item.support.level ? <p>Livello: {item.support.level}</p> : null}{item.support.channels?.length ? <p>Canali: {item.support.channels.join(", ")}</p> : null}{item.support.response_time ? <p>Tempo di risposta: {item.support.response_time}</p> : null}{item.support.availability ? <p>Disponibilità: {item.support.availability}</p> : null}{item.support.account_manager ? <p>Account manager dedicato incluso</p> : null}{item.support.onboarding ? <p>Onboarding: {item.support.onboarding}</p> : null}{item.support.training_hours ? <p>Formazione inclusa: {item.support.training_hours} ore</p> : null}{item.support.notes ? <p>{item.support.notes}</p> : null}</div></div> : null}
    </article>
  )
}

export default function QuoteCommerceView({ token, quote, expired }: Props) {
  const alreadyPaid = quote.status === "paid" || quote.payment_status === "paid"
  const alreadyAccepted = quote.status === "accepted" || alreadyPaid
  const requestedFields = (quote.requested_fields || []) as QuoteRequestedField[]
  const lineItems = ((quote.line_items || []) as QuoteLineItem[]).map(calculateQuoteLine)
  const currency = quote.currency || "eur"

  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set(
    lineItems.filter((item) => !item.optional || (alreadyAccepted ? item.customer_selected !== false : item.default_selected !== false)).map((item) => item.id).filter((id): id is string => !!id),
  ))
  const selectedItems = useMemo(() => lineItems.filter((item) => !item.optional || (!!item.id && selectedIds.has(item.id))), [lineItems, selectedIds])
  const requiresCard = useMemo(() => selectedItems.some((item) => SAAS_PROJECTS.has(item.project || "") || (item.billing_period && item.billing_period !== "one_time")), [selectedItems])

  const [fieldValues, setFieldValues] = useState<Record<string, string>>(() => (quote.submitted_fields as Record<string, string>) || {})
  const [billing, setBilling] = useState<QuoteBillingDetails>(() => {
    const saved = (quote.billing_details as QuoteBillingDetails) || {}
    return {
      company: saved.company || quote.client_company || "", vat: saved.vat || quote.client_vat || "", tax_code: saved.tax_code || "",
      address: saved.address || quote.client_address || "", zip: saved.zip || "", city: saved.city || "", province: saved.province || "",
      sdi_code: saved.sdi_code || "", pec: saved.pec || "", reference: saved.reference || quote.client_name || "",
    }
  })
  const [acceptanceName, setAcceptanceName] = useState(quote.acceptance_name || "")
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const initialMethod = (quote.payment_method as PaymentMethod) || (requiresCard ? "card" : null)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(initialMethod)
  const [confirmedMethod, setConfirmedMethod] = useState<PaymentMethod | null>(alreadyAccepted ? ((quote.payment_method as PaymentMethod) || null) : null)
  const [accepting, setAccepting] = useState(false)
  const [paying, setPaying] = useState(false)

  const totals = useMemo(() => {
    const oneTime = selectedItems.filter((i) => (i.billing_period || "one_time") === "one_time").reduce((sum, i) => sum + Number(i.amount || 0), 0)
    const monthly = selectedItems.filter((i) => i.billing_period === "monthly").reduce((sum, i) => sum + Number(i.amount || 0), 0)
    const quarterly = selectedItems.filter((i) => i.billing_period === "quarterly").reduce((sum, i) => sum + Number(i.amount || 0), 0)
    const yearly = selectedItems.filter((i) => i.billing_period === "yearly").reduce((sum, i) => sum + Number(i.amount || 0), 0)
    const savings = selectedItems.reduce((sum, i) => sum + Number(i.discount_amount || 0), 0)
    return { oneTime, monthly, quarterly, yearly, savings }
  }, [selectedItems])

  function setItemSelected(item: QuoteLineItem, value: boolean) {
    if (!item.optional || !item.id || alreadyAccepted) return
    setSelectedIds((current) => {
      const next = new Set(current)
      value ? next.add(item.id!) : next.delete(item.id!)
      return next
    })
    if (value && (SAAS_PROJECTS.has(item.project || "") || (item.billing_period && item.billing_period !== "one_time"))) setPaymentMethod("card")
  }

  function setBillingField(key: keyof QuoteBillingDetails, value: string) { setBilling((current) => ({ ...current, [key]: value })) }
  function setCredentialPart(key: string, part: "id" | "password", value: string) {
    const current = decodeCredential(fieldValues[key])
    setFieldValues((values) => ({ ...values, [key]: encodeCredential(part === "id" ? value : current.id, part === "password" ? value : current.password) }))
  }

  async function startCardPayment() {
    setPaying(true)
    try {
      const response = await fetch(`/api/quotes/shared/${token}/checkout`, { method: "POST" })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || "Impossibile avviare il pagamento")
      if (!data.url) throw new Error("URL di pagamento non disponibile")
      window.location.assign(data.url)
    } catch (error: any) { toast.error(error.message || "Errore nel pagamento"); setPaying(false) }
  }

  async function acceptQuote() {
    if (!selectedItems.length) return toast.error("Seleziona almeno una voce del preventivo")
    if (!acceptanceName.trim()) return toast.error("Inserisci nome e cognome dell'accettante")
    if (!acceptedTerms) return toast.error("Accetta il preventivo e le condizioni")
    const effectivePaymentMethod: PaymentMethod | null = requiresCard ? "card" : paymentMethod
    if (!effectivePaymentMethod) return toast.error("Scegli una modalità di pagamento")

    for (const field of requestedFields) {
      if (!field.required) continue
      if (field.type === "credentials") {
        const credential = decodeCredential(fieldValues[field.key])
        if (!credential.id.trim() || !credential.password.trim()) return toast.error(`Compila ${field.label}`)
      } else if (!(fieldValues[field.key] || "").trim()) return toast.error(`Compila il campo obbligatorio: ${field.label}`)
    }
    const required: Array<[keyof QuoteBillingDetails, string]> = [["company", "Ragione sociale"], ["vat", "Partita IVA"], ["address", "Indirizzo"], ["zip", "CAP"], ["city", "Città"], ["province", "Provincia"]]
    for (const [key, label] of required) if (!(billing[key] || "").trim()) return toast.error(`Compila ${label}`)
    if (!(billing.sdi_code || "").trim() && !(billing.pec || "").trim()) return toast.error("Inserisci Codice SDI oppure PEC")

    setAccepting(true)
    try {
      const response = await fetch(`/api/quotes/shared/${token}/accept`, {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({
          submitted_fields: fieldValues,
          billing_details: billing,
          acceptance_name: acceptanceName.trim(),
          accepted: true,
          payment_method: effectivePaymentMethod,
          selected_item_ids: selectedItems.map((item) => item.id).filter(Boolean),
        }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || "Accettazione non riuscita")
      setConfirmedMethod(effectivePaymentMethod)
      toast.success("Preventivo accettato")
      if (effectivePaymentMethod === "card") await startCardPayment()
    } catch (error: any) { toast.error(error.message || "Errore nell'accettazione") } finally { setAccepting(false) }
  }

  return <div className="min-h-screen bg-muted/30">
    <header className="border-b border-border bg-background"><div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-5 sm:px-6"><Image src="/logo.png" alt="4BID" width={110} height={44} className="h-10 w-auto" priority /><div className="text-right"><p className="text-sm font-semibold">Proposta commerciale</p>{quote.quote_number ? <p className="text-xs text-muted-foreground">N. {quote.quote_number}</p> : null}</div></div></header>
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6">
      {expired ? <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-destructive">Questo preventivo è scaduto. Contatta 4BID per riceverne uno aggiornato.</div> : null}
      {alreadyPaid ? <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900"><CheckCircle2 className="h-5 w-5" />Pagamento confermato. L'attivazione dei servizi selezionati è stata avviata.</div> : null}

      <section className="overflow-hidden rounded-2xl border border-border bg-card"><div className="bg-primary px-6 py-7 text-primary-foreground"><div className="mb-3 flex items-center gap-2 text-sm font-medium opacity-90"><FileText className="h-4 w-4" />4BID · Soluzioni digitali e consulenza</div><h1 className="text-3xl font-bold tracking-tight">{quote.title}</h1>{quote.description ? <p className="mt-3 max-w-3xl whitespace-pre-wrap text-sm leading-relaxed opacity-90">{quote.description}</p> : null}</div><div className="grid gap-4 px-6 py-5 text-sm sm:grid-cols-2"><div><p className="text-xs uppercase tracking-wide text-muted-foreground">Cliente</p><p className="mt-1 font-semibold">{quote.client_company || quote.client_name}</p>{quote.client_company && quote.client_name ? <p className="text-muted-foreground">Att.ne {quote.client_name}</p> : null}</div><div className="sm:text-right"><p className="text-xs uppercase tracking-wide text-muted-foreground">Validità</p><p className="mt-1 font-medium">{quote.expires_at ? `fino al ${new Date(quote.expires_at).toLocaleDateString("it-IT")}` : "Secondo condizioni indicate"}</p></div></div></section>

      <section className="space-y-3"><div className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" /><div><h2 className="text-xl font-semibold">Configura la tua proposta</h2>{lineItems.some((item) => item.optional) && !alreadyAccepted ? <p className="text-sm text-muted-foreground">Puoi selezionare o deselezionare le voci opzionali. Il riepilogo economico si aggiorna automaticamente.</p> : null}</div></div>{lineItems.map((item, index) => <LineItemCard key={item.id || index} item={item} currency={currency} selected={!item.optional || (!!item.id && selectedIds.has(item.id))} locked={alreadyAccepted} onSelectedChange={(value) => setItemSelected(item, value)} />)}</section>

      <section className="sticky bottom-3 z-10 rounded-2xl border border-primary/20 bg-background/95 p-6 shadow-lg backdrop-blur"><div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div><h2 className="mb-3 text-lg font-semibold">Riepilogo della tua selezione</h2><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{totals.oneTime > 0 ? <div><p className="text-xs text-muted-foreground">Una tantum</p><p className="text-xl font-bold">{formatQuoteAmount(totals.oneTime, currency)}</p></div> : null}{totals.monthly > 0 ? <div><p className="text-xs text-muted-foreground">Mensile</p><p className="text-xl font-bold">{formatQuoteAmount(totals.monthly, currency)}</p></div> : null}{totals.quarterly > 0 ? <div><p className="text-xs text-muted-foreground">Trimestrale</p><p className="text-xl font-bold">{formatQuoteAmount(totals.quarterly, currency)}</p></div> : null}{totals.yearly > 0 ? <div><p className="text-xs text-muted-foreground">Annuale</p><p className="text-xl font-bold">{formatQuoteAmount(totals.yearly, currency)}</p></div> : null}</div>{totals.savings > 0 ? <p className="mt-2 text-sm font-medium text-emerald-700">Risparmio complessivo: {formatQuoteAmount(totals.savings, currency)}</p> : null}</div><p className="text-xs text-muted-foreground">{quote.vat_included ? "Importi IVA inclusa" : "Importi IVA esclusa"}</p></div></section>

      {quote.payment_terms ? <section className="rounded-2xl border border-border bg-card p-6"><h2 className="mb-2 font-semibold">Condizioni commerciali e di pagamento</h2><p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{quote.payment_terms}</p></section> : null}

      {!alreadyAccepted && !expired ? <>
        {requestedFields.length ? <section className="rounded-2xl border border-border bg-card p-6 space-y-4"><h2 className="font-semibold">Dati necessari all'attivazione</h2>{requestedFields.map((field) => { const credential = field.type === "credentials" ? decodeCredential(fieldValues[field.key]) : null; return <div key={field.key} className="space-y-1.5"><Label>{field.label}{field.required ? " *" : ""}</Label>{field.type === "credentials" ? <div className="grid gap-2 sm:grid-cols-2"><Input placeholder="ID / Username" value={credential?.id || ""} onChange={(e) => setCredentialPart(field.key, "id", e.target.value)} /><Input type="password" placeholder="Password" value={credential?.password || ""} onChange={(e) => setCredentialPart(field.key, "password", e.target.value)} /></div> : field.type === "textarea" ? <Textarea value={fieldValues[field.key] || ""} onChange={(e) => setFieldValues((v) => ({ ...v, [field.key]: e.target.value }))} /> : <Input type={field.type === "email" ? "email" : field.type === "url" ? "url" : field.type === "password" ? "password" : "text"} value={fieldValues[field.key] || ""} onChange={(e) => setFieldValues((v) => ({ ...v, [field.key]: e.target.value }))} />}{field.help ? <p className="text-xs text-muted-foreground">{field.help}</p> : null}</div> })}</section> : null}
        <section className="rounded-2xl border border-border bg-card p-6 space-y-4"><div className="flex items-center gap-2"><Receipt className="h-5 w-5 text-primary" /><h2 className="font-semibold">Dati di fatturazione</h2></div><div className="grid gap-4 sm:grid-cols-2"><div className="sm:col-span-2"><Label>Ragione sociale *</Label><Input value={billing.company || ""} onChange={(e) => setBillingField("company", e.target.value)} /></div><div><Label>Partita IVA *</Label><Input value={billing.vat || ""} onChange={(e) => setBillingField("vat", e.target.value)} /></div><div><Label>Codice fiscale</Label><Input value={billing.tax_code || ""} onChange={(e) => setBillingField("tax_code", e.target.value)} /></div><div className="sm:col-span-2"><Label>Indirizzo *</Label><Input value={billing.address || ""} onChange={(e) => setBillingField("address", e.target.value)} /></div><div><Label>CAP *</Label><Input value={billing.zip || ""} onChange={(e) => setBillingField("zip", e.target.value)} /></div><div><Label>Città *</Label><Input value={billing.city || ""} onChange={(e) => setBillingField("city", e.target.value)} /></div><div><Label>Provincia *</Label><Input maxLength={2} value={billing.province || ""} onChange={(e) => setBillingField("province", e.target.value.toUpperCase())} /></div><div><Label>Referente amministrativo</Label><Input value={billing.reference || ""} onChange={(e) => setBillingField("reference", e.target.value)} /></div><div><Label>Codice SDI</Label><Input value={billing.sdi_code || ""} onChange={(e) => setBillingField("sdi_code", e.target.value.toUpperCase())} /></div><div><Label>PEC</Label><Input type="email" value={billing.pec || ""} onChange={(e) => setBillingField("pec", e.target.value)} /></div></div></section>
        <section className="rounded-2xl border-2 border-primary/20 bg-card p-6 space-y-5"><div><h2 className="text-xl font-semibold">Accetta la configurazione selezionata</h2><p className="text-sm text-muted-foreground">Con l'accettazione vengono congelate le voci selezionate, i prezzi, gli sconti, i trial e le condizioni di assistenza.</p></div><div><Label>Nome e cognome dell'accettante *</Label><Input value={acceptanceName} onChange={(e) => setAcceptanceName(e.target.value)} /></div>{requiresCard ? <div className="rounded-xl border border-primary/20 bg-primary/5 p-4"><CreditCard className="mb-2 h-5 w-5" /><strong className="block">Carta di credito richiesta</strong><span className="text-xs text-muted-foreground">La selezione contiene prodotti SaaS o canoni ricorrenti. La carta è necessaria per attivazione e rinnovi.</span></div> : <div className="grid gap-3 sm:grid-cols-2"><button type="button" onClick={() => setPaymentMethod("card")} className={`rounded-xl border p-4 text-left transition ${paymentMethod === "card" ? "border-primary bg-primary/5" : "border-border"}`}><CreditCard className="mb-2 h-5 w-5" /><strong className="block">Carta di credito</strong><span className="text-xs text-muted-foreground">Pagamento sicuro</span></button><button type="button" onClick={() => setPaymentMethod("bonifico")} className={`rounded-xl border p-4 text-left transition ${paymentMethod === "bonifico" ? "border-primary bg-primary/5" : "border-border"}`}><Banknote className="mb-2 h-5 w-5" /><strong className="block">Bonifico bancario</strong><span className="text-xs text-muted-foreground">Per servizi una tantum</span></button></div>}<label className="flex items-start gap-3 text-sm"><Checkbox checked={acceptedTerms} onCheckedChange={(value) => setAcceptedTerms(value === true)} /><span>Confermo di aver letto e accettato la configurazione selezionata, il preventivo e le relative condizioni economiche e operative.</span></label><Button size="lg" className="w-full" onClick={acceptQuote} disabled={accepting || paying}>{accepting || paying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}{requiresCard || paymentMethod === "card" ? "Accetta e vai al pagamento" : "Accetta preventivo"}</Button></section>
      </> : null}

      {alreadyAccepted && !alreadyPaid && confirmedMethod === "card" ? <section className="rounded-2xl border border-primary/20 bg-card p-6 text-center"><h2 className="font-semibold">Preventivo accettato</h2><p className="mb-4 text-sm text-muted-foreground">Completa il pagamento per avviare automaticamente l'attivazione dei servizi selezionati.</p><Button size="lg" onClick={startCardPayment} disabled={paying}>{paying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CreditCard className="mr-2 h-4 w-4" />}Vai al pagamento</Button></section> : null}
      {alreadyAccepted && !alreadyPaid && confirmedMethod === "bonifico" ? <section className="rounded-2xl border border-border bg-card p-6"><div className="mb-3 flex items-center gap-2"><Banknote className="h-5 w-5 text-primary" /><h2 className="font-semibold">Coordinate per il bonifico</h2></div><div className="space-y-1 text-sm"><p><strong>Beneficiario:</strong> {QUOTE_BANK_DETAILS.holder}</p><p><strong>Banca:</strong> {QUOTE_BANK_DETAILS.bank}</p><p><strong>IBAN:</strong> <span className="font-mono">{QUOTE_BANK_DETAILS.iban}</span></p><p><strong>Causale:</strong> {quoteTransferReason(quote.quote_number, token.slice(0, 8))}</p></div></section> : null}
    </main>
  </div>
}

export { hasCommerceData }
