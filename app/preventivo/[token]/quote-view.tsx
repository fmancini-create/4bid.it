"use client"

import { useState } from "react"
import Image from "next/image"
import { toast } from "sonner"
import {
  CheckCircle2,
  CreditCard,
  Banknote,
  ShieldCheck,
  Loader2,
  FileText,
  Receipt,
  KeyRound,
  Printer,
  Mail,
  Copy,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import ContractTermsSection, { acceptanceLabel } from "./contract-terms-section"
import ComparisonTablesPreview from "@/components/quotes/comparison-tables-preview"
import DiscountedAmount from "@/components/quotes/discounted-amount"
import { lineGrossAmount } from "@/lib/quotes/commercial"
import { normalizeQuoteTables } from "@/lib/quotes/comparison"
import { economicTerms, parseContractTerms } from "@/lib/quotes/terms"
import {
  decodeCredential,
  encodeCredential,
  formatQuoteAmount,
  type QuoteBillingDetails,
  type QuoteRequestedField,
  type SalesChannelQuote,
} from "@/lib/quotes/types"
import { QUOTE_BANK_DETAILS, quoteTransferReason } from "@/lib/quotes/bank"

interface Props {
  token: string
  quote: Partial<SalesChannelQuote>
  expired: boolean
}

export default function QuoteView({ token, quote, expired }: Props) {
  const alreadyPaid = quote.status === "paid"
  const alreadyAccepted = quote.status === "accepted" || alreadyPaid

  const [fieldValues, setFieldValues] = useState<Record<string, string>>(
    () => (quote.submitted_fields as Record<string, string>) || {},
  )
  // Billing details: prefill from what the client already submitted, otherwise
  // from the rough data the admin entered on the quote.
  const [billing, setBilling] = useState<QuoteBillingDetails>(() => {
    const existing = (quote.billing_details as QuoteBillingDetails) || {}
    return {
      company: existing.company || quote.client_company || "",
      vat: existing.vat || quote.client_vat || "",
      tax_code: existing.tax_code || "",
      address: existing.address || quote.client_address || "",
      zip: existing.zip || "",
      city: existing.city || "",
      province: existing.province || "",
      sdi_code: existing.sdi_code || "",
      pec: existing.pec || "",
      reference: existing.reference || quote.client_name || "",
    }
  })
  const [acceptanceName, setAcceptanceName] = useState(quote.acceptance_name || "")
  const [accepted, setAccepted] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<"bonifico" | "card" | null>(
    (quote.payment_method as "bonifico" | "card") || null,
  )
  const [submitting, setSubmitting] = useState(false)
  const [accepting, setAccepting] = useState(false)
  const [confirmedMethod, setConfirmedMethod] = useState<"bonifico" | "card" | null>(
    alreadyAccepted ? (quote.payment_method as "bonifico" | "card") || null : null,
  )

  const requestedFields = (quote.requested_fields as QuoteRequestedField[]) || []
  const lineItems = quote.line_items || []
  const cardAmount = quote.deposit_amount ?? quote.total_amount ?? null
  // Totali per il riepilogo: LISTINO (pre-sconto) da barrare e NETTO effettivo.
  const grossTotal = lineItems.reduce((sum, li) => sum + lineGrossAmount(li), 0)
  const netTotal = quote.total_amount ?? lineItems.reduce((sum, li) => sum + Number(li.amount || 0), 0)

  function setField(key: string, value: string) {
    setFieldValues((prev) => ({ ...prev, [key]: value }))
  }

  function setBillingField(key: keyof QuoteBillingDetails, value: string) {
    setBilling((prev) => ({ ...prev, [key]: value }))
  }

  // Credentials are kept JSON-encoded in fieldValues[key]; update one half.
  function setCredentialPart(key: string, part: "id" | "password", value: string) {
    const current = decodeCredential(fieldValues[key])
    const next = { ...current, [part]: value }
    setField(key, encodeCredential(next.id, next.password))
  }

  async function handleAccept() {
    if (!acceptanceName.trim()) {
      toast.error("Inserisci nome e cognome per accettare")
      return
    }
    if (!accepted) {
      toast.error("Devi accettare il preventivo e le condizioni")
      return
    }
    if (!paymentMethod) {
      toast.error("Scegli una modalità di pagamento")
      return
    }
    for (const f of requestedFields) {
      if (!f.required) continue
      if (f.type === "credentials") {
        const cred = decodeCredential(fieldValues[f.key])
        if (!cred.id.trim() || !cred.password.trim()) {
          toast.error(`Compila ID e password per: ${f.label}`)
          return
        }
      } else if (!(fieldValues[f.key] || "").trim()) {
        toast.error(`Compila il campo obbligatorio: ${f.label}`)
        return
      }
    }
    // Billing data required to issue the invoice.
    const requiredBilling: [keyof QuoteBillingDetails, string][] = [
      ["company", "Ragione sociale"],
      ["vat", "Partita IVA"],
      ["address", "Indirizzo"],
      ["zip", "CAP"],
      ["city", "Città"],
      ["province", "Provincia"],
    ]
    for (const [key, label] of requiredBilling) {
      if (!(billing[key] || "").trim()) {
        toast.error(`Dati di fatturazione: compila il campo "${label}"`)
        return
      }
    }
    if (!(billing.sdi_code || "").trim() && !(billing.pec || "").trim()) {
      toast.error("Dati di fatturazione: inserisci il Codice SDI oppure la PEC")
      return
    }

    setAccepting(true)
    try {
      const res = await fetch(`/api/quotes/shared/${token}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submitted_fields: fieldValues,
          billing_details: billing,
          acceptance_name: acceptanceName.trim(),
          accepted: true,
          payment_method: paymentMethod,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "Errore nell'accettazione")
      setConfirmedMethod(paymentMethod)
      toast.success("Preventivo accettato")
      if (paymentMethod === "card") {
        await startCardPayment()
      }
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setAccepting(false)
    }
  }

  async function startCardPayment() {
    setSubmitting(true)
    try {
      const res = await fetch(`/api/quotes/shared/${token}/checkout`, { method: "POST" })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "Errore nel pagamento")
      if (data.url) {
        window.location.href = data.url
      }
    } catch (e: any) {
      toast.error(e.message)
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="bg-background border-b border-border">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-5 flex items-center justify-between">
          <Image src="/logo.png" alt="4BID" width={110} height={44} className="h-10 w-auto" priority />
          <span className="text-sm text-muted-foreground">Preventivo</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {expired && (
          <div className="bg-destructive/10 border border-destructive/30 text-destructive rounded-lg p-4">
            Questo preventivo è scaduto. Contatta 4BID per riceverne uno aggiornato.
          </div>
        )}

        {alreadyPaid && (
          <div className="bg-green-50 border border-green-200 text-green-800 rounded-lg p-4 flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5" />
            Pagamento completato. Grazie! Procederemo con l&apos;avvio delle attività.
          </div>
        )}

        {/* Intestazione preventivo */}
        <section className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-start justify-between gap-4 mb-2">
            <div className="flex items-center gap-2 text-primary">
              <FileText className="h-5 w-5" />
              <span className="text-sm font-medium uppercase tracking-wide">Preventivo</span>
            </div>
            {(quote.quote_number || quote.created_at) && (
              <div className="text-right shrink-0">
                {quote.quote_number && (
                  <p className="text-sm font-bold text-foreground">N. {quote.quote_number}</p>
                )}
                {quote.created_at && (
                  <p className="text-xs text-muted-foreground">
                    del{" "}
                    {new Date(quote.created_at).toLocaleDateString("it-IT", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })}
                  </p>
                )}
              </div>
            )}
          </div>
          <h1 className="text-2xl font-bold text-balance">{quote.title}</h1>
          <div className="mt-4 text-sm text-muted-foreground space-y-0.5">
            {(quote.client_company || quote.client_name) && (
              <p className="text-foreground font-medium">
                {quote.client_company || quote.client_name}
              </p>
            )}
            {quote.client_company && quote.client_name && <p>Att.ne {quote.client_name}</p>}
            {quote.client_vat && <p>P.IVA/CF: {quote.client_vat}</p>}
            {quote.client_address && <p>{quote.client_address}</p>}
          </div>
        </section>

        {/* Descrizione */}
        {quote.description && (
          <section className="bg-card border border-border rounded-lg p-6">
            <h2 className="font-semibold mb-3">Descrizione delle attività</h2>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
              {quote.description}
            </p>
          </section>
        )}

        {/* Importi */}
        {(lineItems.length > 0 || quote.total_amount != null) && (
          <section className="bg-card border border-border rounded-lg p-6">
            <h2 className="font-semibold mb-3">Dettaglio economico</h2>
            {lineItems.length > 0 && (
              <div className="divide-y divide-border mb-3">
                {lineItems.map((li, i) => (
                  <div key={i} className="flex justify-between gap-4 py-2 text-sm">
                    <span className="text-muted-foreground">{li.description}</span>
                    <DiscountedAmount
                      net={Number(li.amount || 0)}
                      gross={lineGrossAmount(li)}
                      currency={quote.currency}
                      netClassName="font-medium"
                      align="right"
                    />
                  </div>
                ))}
              </div>
            )}
            <div className="flex justify-between items-start gap-4 border-t border-border pt-3">
              <span className="font-semibold">Totale</span>
              <DiscountedAmount
                net={Number(netTotal || 0)}
                gross={grossTotal}
                currency={quote.currency}
                netClassName="text-xl font-bold"
                align="right"
              />
            </div>
            <p className="text-xs text-muted-foreground text-right mt-1">
              {quote.vat_included ? "IVA inclusa" : "IVA esclusa"}
            </p>
          </section>
        )}

        {/* Tabelle comparative (in fondo, prima delle condizioni) */}
        <ComparisonTablesPreview tables={normalizeQuoteTables(quote.comparison_tables)} />

        {/* Condizioni di pagamento */}
      <ContractTermsSection
        terms={parseContractTerms(quote.contract_terms)}
                economic={economicTerms(lineItems, "monthly", quote.currency || "eur", { expiresAt: quote.expires_at, vatIncluded: quote.vat_included })}
                paymentTerms={quote.payment_terms}
      />

        {/* Dati richiesti al cliente */}
        {requestedFields.length > 0 && (
          <section className="bg-card border border-border rounded-lg p-6">
            <h2 className="font-semibold mb-1">Dati necessari per l&apos;avvio</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Compila i seguenti dati, utili allo svolgimento delle attività e alla fatturazione.
            </p>
            <div className="space-y-4">
              {requestedFields.map((f) => {
                const cred = f.type === "credentials" ? decodeCredential(fieldValues[f.key]) : null
                return (
                  <div key={f.key} className="space-y-1.5">
                    <Label className="flex items-center gap-1.5">
                      {f.type === "credentials" && <KeyRound className="h-3.5 w-3.5 text-muted-foreground" />}
                      {f.label}
                      {f.required && <span className="text-destructive ml-1">*</span>}
                    </Label>
                    {f.type === "credentials" ? (
                      <div className="grid sm:grid-cols-2 gap-2">
                        <Input
                          placeholder="ID / Username"
                          autoComplete="off"
                          value={cred?.id || ""}
                          disabled={alreadyAccepted}
                          onChange={(e) => setCredentialPart(f.key, "id", e.target.value)}
                        />
                        <Input
                          placeholder="Password"
                          autoComplete="off"
                          value={cred?.password || ""}
                          disabled={alreadyAccepted}
                          onChange={(e) => setCredentialPart(f.key, "password", e.target.value)}
                        />
                      </div>
                    ) : f.type === "textarea" ? (
                      <Textarea
                        rows={3}
                        value={fieldValues[f.key] || ""}
                        disabled={alreadyAccepted}
                        onChange={(e) => setField(f.key, e.target.value)}
                      />
                    ) : (
                      <Input
                        type={
                          f.type === "email" ? "email" : f.type === "url" ? "url" : "text"
                        }
                        value={fieldValues[f.key] || ""}
                        disabled={alreadyAccepted}
                        onChange={(e) => setField(f.key, e.target.value)}
                      />
                    )}
                    {f.help && <p className="text-xs text-muted-foreground">{f.help}</p>}
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* Dati di fatturazione (compilati dal cliente) */}
        {!alreadyAccepted && !expired && (
          <section className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center gap-2 mb-1">
              <Receipt className="h-5 w-5 text-primary" />
              <h2 className="font-semibold">Dati di fatturazione</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Inserisci i dati con cui emettere la fattura. Verifica i campi precompilati.
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Ragione sociale <span className="text-destructive">*</span></Label>
                <Input
                  value={billing.company || ""}
                  onChange={(e) => setBillingField("company", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Partita IVA <span className="text-destructive">*</span></Label>
                <Input
                  value={billing.vat || ""}
                  onChange={(e) => setBillingField("vat", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Codice Fiscale</Label>
                <Input
                  value={billing.tax_code || ""}
                  onChange={(e) => setBillingField("tax_code", e.target.value)}
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Indirizzo (sede legale) <span className="text-destructive">*</span></Label>
                <Input
                  value={billing.address || ""}
                  onChange={(e) => setBillingField("address", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>CAP <span className="text-destructive">*</span></Label>
                <Input
                  value={billing.zip || ""}
                  onChange={(e) => setBillingField("zip", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Città <span className="text-destructive">*</span></Label>
                <Input
                  value={billing.city || ""}
                  onChange={(e) => setBillingField("city", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Provincia <span className="text-destructive">*</span></Label>
                <Input
                  maxLength={2}
                  placeholder="Es. FI"
                  value={billing.province || ""}
                  onChange={(e) => setBillingField("province", e.target.value.toUpperCase())}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Referente amministrativo</Label>
                <Input
                  value={billing.reference || ""}
                  onChange={(e) => setBillingField("reference", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Codice destinatario (SDI)</Label>
                <Input
                  placeholder="7 caratteri"
                  value={billing.sdi_code || ""}
                  onChange={(e) => setBillingField("sdi_code", e.target.value.toUpperCase())}
                />
              </div>
              <div className="space-y-1.5">
                <Label>PEC</Label>
                <Input
                  type="email"
                  value={billing.pec || ""}
                  onChange={(e) => setBillingField("pec", e.target.value)}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Per la fatturazione elettronica indica il Codice destinatario (SDI) oppure la PEC.
            </p>
          </section>
        )}

        {/* Accettazione + pagamento */}
        {!alreadyAccepted && !expired && (
          <section className="bg-card border border-border rounded-lg p-6 space-y-5">
            <h2 className="font-semibold">Accettazione e pagamento</h2>

            <div className="space-y-1.5">
              <Label>Nome e cognome (firma) <span className="text-destructive">*</span></Label>
              <Input
                value={acceptanceName}
                onChange={(e) => setAcceptanceName(e.target.value)}
                placeholder="Il tuo nome e cognome"
              />
            </div>

            <label className="flex items-start gap-3 cursor-pointer">
              <Checkbox
                checked={accepted}
                onCheckedChange={(v) => setAccepted(v === true)}
                className="mt-0.5"
              />
              <span className="text-sm text-muted-foreground">
                {acceptanceLabel(parseContractTerms(quote.contract_terms))}
              </span>
            </label>

            <div className="space-y-2">
              <Label>Modalità di pagamento</Label>
              <div className="grid sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("bonifico")}
                  className={`flex items-center gap-3 rounded-lg border p-4 text-left transition-colors ${
                    paymentMethod === "bonifico"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-muted"
                  }`}
                >
                  <Banknote className="h-5 w-5 text-primary shrink-0" />
                  <div>
                    <p className="font-medium text-sm">Bonifico bancario</p>
                    <p className="text-xs text-muted-foreground">Ricevi i dati per il bonifico</p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod("card")}
                  className={`flex items-center gap-3 rounded-lg border p-4 text-left transition-colors ${
                    paymentMethod === "card"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-muted"
                  }`}
                >
                  <CreditCard className="h-5 w-5 text-primary shrink-0" />
                  <div>
                    <p className="font-medium text-sm">Carta di credito</p>
                    <p className="text-xs text-muted-foreground">
                      {cardAmount != null
                        ? `Pagamento sicuro di ${formatQuoteAmount(cardAmount, quote.currency)}`
                        : "Pagamento sicuro con Stripe"}
                    </p>
                  </div>
                </button>
              </div>
            </div>

            <Button className="w-full" size="lg" onClick={handleAccept} disabled={accepting || submitting}>
              {accepting || submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Elaborazione...
                </>
              ) : paymentMethod === "card" ? (
                "Accetta e paga con carta"
              ) : (
                "Accetta il preventivo"
              )}
            </Button>

            <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5" />
              I dati inseriti sono trattati in modo riservato.
            </p>
          </section>
        )}

        {/* Post-accettazione: riepilogo dati di fatturazione */}
        {alreadyAccepted && (billing.company || billing.vat) && (
          <section className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center gap-2 mb-3">
              <Receipt className="h-5 w-5 text-primary" />
              <h2 className="font-semibold">Dati di fatturazione ricevuti</h2>
            </div>
            <div className="text-sm text-muted-foreground space-y-0.5">
              {billing.company && <p className="text-foreground font-medium">{billing.company}</p>}
              {billing.vat && <p>P.IVA: {billing.vat}</p>}
              {billing.tax_code && <p>C.F.: {billing.tax_code}</p>}
              {(billing.address || billing.zip || billing.city || billing.province) && (
                <p>
                  {[billing.address, [billing.zip, billing.city].filter(Boolean).join(" "), billing.province]
                    .filter(Boolean)
                    .join(", ")}
                </p>
              )}
              {billing.sdi_code && <p>Codice SDI: {billing.sdi_code}</p>}
              {billing.pec && <p>PEC: {billing.pec}</p>}
              {billing.reference && <p>Referente: {billing.reference}</p>}
            </div>
          </section>
        )}

        {/* Post-accettazione: bonifico */}
        {alreadyAccepted && confirmedMethod === "bonifico" && !alreadyPaid && (
          <section id="bonifico-print" className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex items-center gap-2 text-primary">
                <Banknote className="h-5 w-5" />
                <h2 className="font-semibold">Istruzioni per il pagamento con bonifico</h2>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="shrink-0 print:hidden"
                onClick={() => window.print()}
              >
                <Printer className="h-4 w-4 mr-2" />
                Stampa
              </Button>
            </div>

            {/* Intestazione con numero preventivo e data, visibile anche in stampa */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-4 mb-4 border-b border-border">
              <div>
                {quote.quote_number && (
                  <p className="text-sm font-bold">Preventivo N. {quote.quote_number}</p>
                )}
                {quote.created_at && (
                  <p className="text-xs text-muted-foreground">
                    del{" "}
                    {new Date(quote.created_at).toLocaleDateString("it-IT", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })}
                  </p>
                )}
              </div>
              {quote.total_amount != null && (
                <p className="text-sm">
                  <span className="text-muted-foreground">Importo: </span>
                  <span className="font-bold">
                    {formatQuoteAmount(quote.total_amount, quote.currency)}
                  </span>
                </p>
              )}
            </div>

            <p className="text-sm mb-3">
              Effettua il bonifico utilizzando le coordinate bancarie seguenti:
            </p>
            <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">Intestatario</span>
                <span className="font-medium text-right">{QUOTE_BANK_DETAILS.holder}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">Banca</span>
                <span className="font-medium text-right">{QUOTE_BANK_DETAILS.bank}</span>
              </div>
              <div className="flex justify-between gap-3 items-center">
                <span className="text-muted-foreground">IBAN</span>
                <span className="flex items-center gap-2">
                  <span className="font-mono font-semibold tracking-tight text-right break-all">
                    {QUOTE_BANK_DETAILS.iban}
                  </span>
                  <button
                    type="button"
                    aria-label="Copia IBAN"
                    className="print:hidden text-muted-foreground hover:text-foreground shrink-0"
                    onClick={() => {
                      navigator.clipboard?.writeText(QUOTE_BANK_DETAILS.iban)
                      toast.success("IBAN copiato")
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </span>
              </div>
              <div className="flex justify-between gap-3 items-start border-t border-border pt-2 mt-2">
                <span className="text-muted-foreground">Causale</span>
                <span className="font-semibold text-right">
                  {quoteTransferReason(quote.quote_number, quote.title || "")}
                </span>
              </div>
            </div>

            <div className="mt-4 rounded-lg border border-primary/30 bg-primary/5 p-4 text-sm">
              <div className="flex items-center gap-2 font-medium mb-1">
                <Mail className="h-4 w-4 text-primary" />
                Invia la contabile di pagamento
              </div>
              <p className="text-muted-foreground">
                Dopo aver effettuato il bonifico, invia la contabile via email a{" "}
                <a
                  href={`mailto:${QUOTE_BANK_DETAILS.paymentEmail}?subject=${encodeURIComponent(
                    `Contabile pagamento preventivo ${quote.quote_number || ""}`.trim(),
                  )}`}
                  className="font-semibold text-primary underline underline-offset-2"
                >
                  {QUOTE_BANK_DETAILS.paymentEmail}
                </a>{" "}
                indicando come causale il numero di preventivo{" "}
                <span className="font-semibold text-foreground">
                  {quote.quote_number || quote.title}
                </span>
                .
              </p>
            </div>
          </section>
        )}

        {/* Post-accettazione: carta non ancora pagata */}
        {alreadyAccepted && confirmedMethod === "card" && !alreadyPaid && (
          <section className="bg-card border border-border rounded-lg p-6 space-y-4">
            <div className="flex items-center gap-2 text-amber-700">
              <CheckCircle2 className="h-5 w-5" />
              <h2 className="font-semibold">Preventivo accettato — Pagamento con carta</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Il pagamento non risulta ancora completato. Puoi procedere ora.
            </p>
            <Button onClick={startCardPayment} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Reindirizzamento...
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Paga {cardAmount != null ? formatQuoteAmount(cardAmount, quote.currency) : "con carta"}
                </>
              )}
            </Button>
          </section>
        )}
      </main>

      <footer className="max-w-3xl mx-auto px-4 sm:px-6 py-8 text-center text-xs text-muted-foreground">
        <p>4BID S.r.l. — Via Sorripa, 10 — 50026 San Casciano in Val di Pesa (FI)</p>
        <p>P.IVA: 06241710489 — clienti@4bid.it — www.4bid.it</p>
      </footer>
    </div>
  )
}
