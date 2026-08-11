"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import { toast } from "sonner"
import { Banknote, Check, CheckCircle2, Clock3, CreditCard, FileText, Loader2, Receipt, Settings, ShieldCheck, Sparkles, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ProjectBrand } from "@/components/quotes/project-brand"
import ContractTermsSection, { acceptanceLabel } from "./contract-terms-section"
import ComparisonTablesPreview from "@/components/quotes/comparison-tables-preview"
import { normalizeQuoteTables } from "@/lib/quotes/comparison"
import { economicTerms, parseContractTerms } from "@/lib/quotes/terms"
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
import { annualComparison, annualSetupPromo, applyBillingPreference, getCommercialMeta, getIncludedCredits, hasAnnualBillingOption, lineGrossAmount, type AnnualSetupPromo, type QuoteBillingPreference } from "@/lib/quotes/commercial"
import DiscountedAmount from "@/components/quotes/discounted-amount"
import { quoteBrand, quoteBenefits } from "@/lib/quotes/branding"
import { QUOTE_BANK_DETAILS, quoteTransferReason } from "@/lib/quotes/bank"
import { QUOTE_SELLER, QUOTE_SELLER_ADDRESS_LINE } from "@/lib/quotes/company"

type Props = { token: string; quote: Partial<SalesChannelQuote>; expired: boolean }
type PaymentMethod = "bonifico" | "card"

const SAAS_PROJECTS = new Set(["hotelaccelerator", "santaddeo", "hotelprofitai", "manubot"])
const periodNames: Record<string, string> = { one_time: "una tantum", monthly: "mese", yearly: "anno" }

// Indirizzo su UNA riga ("VIA ... - CAP CITTA (PROV)") scomposto nei campi
// separati del modulo di fatturazione. E' un RIPIEGO: serve quando il
// preventivo non ha gia' i pezzi distinti in `billing_details` (es. creato
// prima che il controllo P.IVA li salvasse separati). Senza, CAP/Citta/
// Provincia restano vuoti e l'indirizzo intero finisce nel solo campo
// Indirizzo — i dati giusti nei campi sbagliati, che il cliente poi conferma.
function splitAddressLine(line: string): { address: string; zip: string; city: string; province: string } {
  const result = { address: "", zip: "", city: "", province: "" }
  let rest = (line || "").trim()
  if (!rest) return result
  // Provincia: sigla di 2 lettere tra parentesi a fine riga, es. "(GE)".
  const prov = rest.match(/\(([A-Za-z]{2})\)\s*$/)
  if (prov && prov.index != null) { result.province = prov[1].toUpperCase(); rest = rest.slice(0, prov.index).trim() }
  // CAP: 5 cifre. Cio' che precede e' la via, cio' che segue e' la citta'.
  const zip = rest.match(/\b(\d{5})\b/)
  if (zip && zip.index != null) {
    result.zip = zip[1]
    result.address = rest.slice(0, zip.index).replace(/[-\s]+$/, "").trim()
    result.city = rest.slice(zip.index + zip[1].length).replace(/^[-\s]+/, "").trim()
  } else {
    result.address = rest
  }
  return result
}

function hasCommerceData(item: QuoteLineItem) { return Boolean(item.project || item.features?.length || item.discount || item.trial_days || item.support || item.optional || getCommercialMeta(item).billing_options) }

// Gruppo "a scelta": le voci che condividono lo stesso modulo padre e sono
// entrambe servizi di attivazione (Supporto alla configurazione / Setup
// completo) sono ALTERNATIVE. Il cliente ne sceglie UNA sola, non entrambe:
// pagare sia l'affiancamento sia il setup completo dello stesso modulo non ha
// senso. Ritorna null quando la voce non fa parte di un gruppo a scelta.
function choiceGroupKey(item: QuoteLineItem): string | null {
  const meta = getCommercialMeta(item)
  return meta.service_type && meta.parent_line_id ? `svc:${meta.parent_line_id}` : null
}

// Scala prezzo di una voce ricorrente: listino pieno -> canone mensile (con lo
// sconto abbonamento) -> canone annuale (sconto maggiore). Va calcolata sul
// RAW item, perche' nella card l'item arriva gia' convertito nella sola formula
// scelta: da li' non si vedrebbero entrambi gli scenari. `applyBillingPreference`
// gestisce correttamente il fatto che le due promozioni sono ALTERNATIVE (sul
// piano annuale lo sconto mensile viene azzerato), quindi nessun doppio sconto.
type LinePricing = {
  hasAnnual: boolean
  hasMonthlyDiscount: boolean
  listMonthly: number
  monthlyNet: number
  monthlyDiscountPct: number
  annualNet: number
  annualSaving: number
  annualDiscountPct: number
}

function buildLinePricing(rawItem: QuoteLineItem): LinePricing | null {
  if (rawItem.billing_period === "one_time") return null
  const round2 = (v: number) => Math.round((Number(v) || 0) * 100) / 100
  const m = applyBillingPreference(rawItem, "monthly")
  const listMonthly = round2(Number(m.list_amount) || 0)
  const monthlyNet = round2(Number(m.amount) || 0)
  if (listMonthly <= 0) return null
  const monthlyDiscount = round2(Math.max(0, listMonthly - monthlyNet))
  const monthlyDiscountPct = listMonthly > 0 ? Math.round((monthlyDiscount / listMonthly) * 100) : 0
  let hasAnnual = false
  let annualNet = 0
  let annualSaving = 0
  let annualDiscountPct = 0
  if (hasAnnualBillingOption(rawItem)) {
    const y = applyBillingPreference(rawItem, "yearly")
    if (y.billing_period === "yearly" && Number(y.amount) > 0) {
      hasAnnual = true
      annualNet = round2(Number(y.amount) || 0)
      const annualFromList = round2(listMonthly * 12)
      annualSaving = round2(Math.max(0, annualFromList - annualNet))
      annualDiscountPct = annualFromList > 0 ? Math.round((annualSaving / annualFromList) * 100) : 0
    }
  }
  return { hasAnnual, hasMonthlyDiscount: monthlyDiscount > 0.005, listMonthly, monthlyNet, monthlyDiscountPct, annualNet, annualSaving, annualDiscountPct }
}

function OfferCountdown({ expiresAt, expired }: { expiresAt?: string | null; expired: boolean }) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => { const id = window.setInterval(() => setNow(Date.now()), 1000); return () => window.clearInterval(id) }, [])
  if (!expiresAt) return null
  const expiry = new Date(expiresAt)
  const diff = Math.max(0, expiry.getTime() - now)
  const days = Math.floor(diff / 86400000)
  const hours = Math.floor((diff % 86400000) / 3600000)
  const minutes = Math.floor((diff % 3600000) / 60000)
  const seconds = Math.floor((diff % 60000) / 1000)
  return <section className={`rounded-2xl border-2 p-5 ${expired || diff <= 0 ? "border-destructive/40 bg-destructive/10" : "border-amber-300 bg-amber-50"}`}>
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-start gap-3"><Zap className="mt-0.5 h-6 w-6 text-amber-600" /><div><p className="font-bold uppercase tracking-wide text-amber-900">Offerta lampo</p><p className="text-sm text-amber-950">Offerta valida fino al <strong>{expiry.toLocaleString("it-IT")}</strong>.</p></div></div><div className="rounded-xl bg-background/80 px-4 py-3 text-center shadow-sm"><p className="text-xs uppercase tracking-wide text-muted-foreground">Tempo alla scadenza</p><p className="text-xl font-black tabular-nums">{diff > 0 ? `${days}g ${hours}h ${minutes}m ${seconds}s` : "SCADUTA"}</p></div></div>
  </section>
}

function LineItemCard({ item, currency, selected, locked, parentSelected, choiceGroup, promo, priceModel, billingPreference, annualEligible, onSelectedChange, onChooseAnnual }: { item: QuoteLineItem; currency: string; selected: boolean; locked: boolean; parentSelected: boolean; choiceGroup: boolean; promo: AnnualSetupPromo | null; priceModel: LinePricing | null; billingPreference: QuoteBillingPreference; annualEligible: boolean; onSelectedChange: (value: boolean) => void; onChooseAnnual: () => void }) {
  const calculated = calculateQuoteLine(item)
  const listAmount = Number(calculated.list_amount ?? 0)
  const period = periodNames[calculated.billing_period || "one_time"] || calculated.billing_period
  const brand = quoteBrand(item.project)
  const benefits = quoteBenefits(item, 3)
  const yearlyView = billingPreference === "yearly"
  const isFreeAnnualService = !!promo && promo.mode === "free" && yearlyView
  const showsAnnualDiscount = !!promo && promo.mode === "discount" && yearlyView
  // Prezzo pieno da barrare (doppia sbarra) nella vista corrente. Combina i due
  // risparmi possibili, cosi' il barrato compare sia in mensile sia in annuale:
  //  - sconto manuale -> si parte dal listino prima dello sconto (listAmount)
  //  - formula annuale su voci ricorrenti -> riferimento = canone mensile x 12,
  //    che in vista annuale altrimenti non si vedrebbe (prezzo "liscio").
  const meta = getCommercialMeta(item)
  const qty = calculated.quantity || 1
  const monthlyUnit = Number(meta.billing_options?.monthly?.unit_amount ?? 0)
  const isRecurring = calculated.billing_period !== "one_time"
  let strikeAmount = showsAnnualDiscount ? promo!.normalPrice : listAmount
  if (!isFreeAnnualService && yearlyView && isRecurring && monthlyUnit > 0) {
    const annualizedFull = Math.round(monthlyUnit * 12 * qty * 100) / 100
    if (annualizedFull > strikeAmount) strikeAmount = annualizedFull
  }
  const showStrike = !isFreeAnnualService && strikeAmount > calculated.amount + 0.005
  const strikeSaving = Math.round((strikeAmount - calculated.amount) * 100) / 100
  const strikeSavingPct = strikeAmount > 0 ? Math.round((strikeSaving / strikeAmount) * 100) : 0
  const promoTitle = promo?.mode === "free" ? "In omaggio con la formula annuale" : `Scontato del ${promo?.pct}% con la formula annuale`
  const active = selected && parentSelected

  return <article className={`group overflow-hidden rounded-2xl border bg-background transition-all ${active ? "border-primary/35 shadow-sm" : "border-border opacity-60"}`}>
    <div className="border-b bg-gradient-to-r from-muted/60 via-background to-background px-5 py-4">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${item.optional ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"}`}>{choiceGroup ? "Scegli una sola opzione" : item.optional ? "Puoi scegliere" : "Incluso nella soluzione"}</span>
        {item.trial_days ? <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">Provalo {item.trial_days} giorni</span> : null}
        {promo ? <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-800">{promo.mode === "free" ? "OMAGGIO CON ANNUALE" : `-${promo.pct}% CON ANNUALE`}</span> : null}
      </div>
    </div>

    <div className="space-y-5 p-5">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-primary">{brand.promise}</p>
          <div className="flex items-center gap-3">
            <ProjectBrand project={item.project} compact />
            <h3 className="text-2xl font-black leading-tight tracking-tight sm:text-3xl">{item.name || item.description}</h3>
          </div>
          {item.name && item.description && item.description !== item.name ? <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">{item.description}</p> : null}
        </div>
        {priceModel && (priceModel.hasAnnual || priceModel.hasMonthlyDiscount) ? (
          // SCALA PREZZO (voci ricorrenti): listino pieno -> abbonamento mensile
          // (gia' scontato) -> abbonamento annuale (sconto maggiore). La formula
          // attualmente scelta e' evidenziata; l'annuale resta sempre marcato come
          // piu' conveniente, cosi' il cliente vede il valore crescente dello sconto.
          <div className="shrink-0 rounded-xl border bg-muted/20 px-4 py-3 text-left sm:min-w-[15rem]">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Prezzo di listino</p>
            <p className="text-sm text-muted-foreground line-through">{formatQuoteAmount(priceModel.listMonthly, currency)} /mese</p>
            <div className="mt-2 space-y-1.5">
              <div className={`flex items-center justify-between gap-3 rounded-lg border px-2.5 py-1.5 ${!yearlyView ? "border-emerald-400 bg-emerald-50" : "border-border"}`}>
                <div>
                  <div className="text-[11px] font-semibold">Abbonamento mensile</div>
                  <div className="text-lg font-black leading-tight">{formatQuoteAmount(priceModel.monthlyNet, currency)}<span className="text-[11px] font-normal text-muted-foreground"> /mese</span></div>
                </div>
                {priceModel.monthlyDiscountPct > 0 ? <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800">-{priceModel.monthlyDiscountPct}%</span> : null}
              </div>
              {priceModel.hasAnnual ? <div className={`flex items-center justify-between gap-3 rounded-lg border px-2.5 py-1.5 ${yearlyView ? "border-emerald-600 bg-emerald-600 text-primary-foreground" : "border-emerald-300 bg-emerald-50/60"}`}>
                <div>
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-semibold">Abbonamento annuale {!yearlyView ? <span className="rounded-full bg-emerald-600 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-primary-foreground">più conveniente</span> : null}</div>
                  <div className="text-lg font-black leading-tight">{formatQuoteAmount(priceModel.annualNet, currency)}<span className={`text-[11px] font-normal ${yearlyView ? "text-primary-foreground/80" : "text-muted-foreground"}`}> /anno</span></div>
                  {priceModel.annualSaving > 0 ? <div className={`text-[10px] ${yearlyView ? "text-primary-foreground/90" : "text-emerald-700"}`}>Risparmi {formatQuoteAmount(priceModel.annualSaving, currency)}/anno</div> : null}
                </div>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-bold ${yearlyView ? "bg-background/20 text-primary-foreground" : "bg-emerald-600 text-primary-foreground"}`}>-{priceModel.annualDiscountPct}%</span>
              </div> : null}
            </div>
          </div>
        ) : (
          <div className="shrink-0 rounded-xl border bg-muted/20 px-4 py-3 text-left sm:min-w-36 sm:text-right">
            {/* Voci una tantum / senza sconto: prezzo semplice. Verde quando c'e'
                un risparmio (agevolazione setup annuale o sconto di riga). */}
            <div className={`text-2xl font-black ${isFreeAnnualService || showStrike ? "text-emerald-700" : ""}`}>{isFreeAnnualService ? "OMAGGIO" : formatQuoteAmount(calculated.amount, currency)}</div>
            <div className="text-xs text-muted-foreground">{calculated.billing_period === "one_time" ? "una tantum" : `/${period}`}</div>
            {isFreeAnnualService ? <div className="mt-1 text-sm text-muted-foreground line-through">{formatQuoteAmount(promo!.normalPrice, currency)}</div> : showStrike ? <div className="mt-1 text-sm text-muted-foreground line-through">{formatQuoteAmount(strikeAmount, currency)}{yearlyView && isRecurring ? <span className="ml-1 text-[11px] no-underline">a rate mensili</span> : null}</div> : null}
            {showStrike ? <div className="mt-1 text-xs font-bold text-emerald-700">Risparmi {formatQuoteAmount(strikeSaving, currency)}{strikeSavingPct > 0 ? ` (${strikeSavingPct}%)` : ""}</div> : null}
            {promo && !yearlyView ? <div className="mt-1 text-xs font-bold text-emerald-700">Con l&apos;annuale: {promo.mode === "free" ? "OMAGGIO" : formatQuoteAmount(promo.annualPrice, currency)}</div> : null}
          </div>
        )}
      </div>

      {(calculated.quantity || 1) > 1 ? <p className="text-xs text-muted-foreground">Quantità: <strong className="text-foreground">{calculated.quantity}</strong>{calculated.unit_amount != null ? ` × ${formatQuoteAmount(calculated.unit_amount, currency)}` : ""}</p> : null}
      {(() => {
        // Limiti Corporate (totale gruppo): mostrati solo se valorizzati (>0).
        const maxAssets = Number(meta.corporate_max_assets) || 0
        const maxUsers = Number(meta.corporate_max_users) || 0
        if (maxAssets <= 0 && maxUsers <= 0) return null
        return <p className="text-xs text-muted-foreground">
          {maxAssets > 0 ? <>Asset inclusi: <strong className="text-foreground">{maxAssets.toLocaleString("it-IT")}</strong></> : null}
          {maxAssets > 0 && maxUsers > 0 ? " · " : null}
          {maxUsers > 0 ? <>Utenti inclusi: <strong className="text-foreground">{maxUsers.toLocaleString("it-IT")}</strong></> : null}
        </p>
      })()}

      {promo && !yearlyView && !locked ? <div className="flex flex-col gap-3 rounded-xl border-2 border-emerald-300 bg-emerald-50 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100"><Sparkles className="h-4 w-4 text-emerald-700" /></span>
          <div>
            <p className="font-bold text-emerald-900">{promoTitle}</p>
            <p className="text-sm text-emerald-800">Ora in formula mensile costa {formatQuoteAmount(promo.normalPrice, currency)}. Con l&apos;annuale {promo.mode === "free" ? "non ti viene addebitato" : `scende a ${formatQuoteAmount(promo.annualPrice, currency)}`}: risparmi {formatQuoteAmount(promo.saving, currency)}.</p>
          </div>
        </div>
        {annualEligible && !locked ? <button type="button" onClick={onChooseAnnual} className="shrink-0 rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2">Passa all&apos;annuale</button> : null}
      </div> : null}

      {benefits.length ? <div className="rounded-xl bg-muted/35 p-4"><p className="mb-3 text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">Cosa ottieni</p><div className="grid gap-2 sm:grid-cols-3">{benefits.map((benefit,index) => <div key={`${benefit}-${index}`} className="flex items-start gap-2 text-sm font-medium"><span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100"><Check className="h-3.5 w-3.5 text-emerald-700" /></span><span>{benefit}</span></div>)}</div></div> : null}

      {(() => {
        const credits = getIncludedCredits(item)
        if (!credits) return null
        return <div className="flex items-start gap-3 rounded-xl border border-primary/25 bg-primary/5 p-4">
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10"><Sparkles className="h-4 w-4 text-primary" /></span>
          <div>
            <p className="font-bold">Crediti inclusi: {formatQuoteAmount(credits.amount, currency)}</p>
            <p className="text-sm text-muted-foreground">Ricaricati automaticamente {credits.recharge === "recurring" ? "ad ogni rinnovo" : "all'attivazione"} e già compresi nel prezzo. I consumi oltre questa soglia si pagano a parte, in autonomia.</p>
          </div>
        </div>
      })()}

      {item.support && Object.values(item.support).some(Boolean) ? <div className="rounded-lg border border-primary/10 bg-primary/5 p-3 text-sm"><div className="mb-1 flex items-center gap-2 font-semibold"><ShieldCheck className="h-4 w-4 text-primary" /> Non sei lasciato solo</div><p className="text-muted-foreground">{item.support.notes || item.support.level || "Assistenza inclusa secondo condizioni indicate."}</p></div> : null}

      {item.optional && !locked ? <button type="button" disabled={!parentSelected} onClick={() => onSelectedChange(!selected)} className={`flex w-full items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 text-sm font-bold transition ${selected && parentSelected ? "border-emerald-300 bg-emerald-50 text-emerald-900" : "border-primary/30 bg-primary/5 text-primary hover:bg-primary/10"} ${!parentSelected ? "cursor-not-allowed opacity-50" : ""}`}>
        {selected && parentSelected ? <><CheckCircle2 className="h-4 w-4" /> Scelto — clicca per rimuovere</> : <><Sparkles className="h-4 w-4" /> {choiceGroup ? "Scegli questa opzione" : "Aggiungi alla mia soluzione"}</>}
      </button> : !item.optional ? <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700"><CheckCircle2 className="h-4 w-4" /> Questa voce fa parte della soluzione proposta</div> : null}
    </div>
  </article>
}

export default function QuoteCommerceView({ token, quote, expired }: Props) {
  const alreadyPaid = quote.status === "paid" || quote.payment_status === "paid"
  const alreadyAccepted = quote.status === "accepted" || alreadyPaid
  const requestedFields = (quote.requested_fields || []) as QuoteRequestedField[]
  const rawItems = ((quote.line_items || []) as QuoteLineItem[]).map(calculateQuoteLine)
  const currency = quote.currency || "eur"
  // Dati cliente da mostrare in intestazione: si leggono dai campi del
  // preventivo con fallback su billing_details (precompilato dal controllo
  // P.IVA in fase di creazione). Il referente e' una persona, distinta dalla
  // ragione sociale, quindi va esposto a parte.
  const bd = (quote.billing_details as QuoteBillingDetails) || {}
  const clientCompany = quote.client_company || bd.company || quote.client_name || ""
  const clientVat = quote.client_vat || bd.vat || ""
  const clientTaxCode = bd.tax_code || ""
  const clientAddressLine = bd.address
    ? [bd.address, [bd.zip, bd.city].filter(Boolean).join(" "), bd.province ? `(${bd.province})` : ""].filter(Boolean).join(" - ")
    : (quote.client_address || "")
  const clientReference = bd.reference || quote.client_name || ""
  const clientEmail = quote.client_email || ""
  const clientSdi = bd.sdi_code || ""
  const clientPec = bd.pec || ""
  const clientDetails: Array<{ label: string; value: string }> = [
    { label: "P.IVA", value: clientVat },
    { label: "Codice fiscale", value: clientTaxCode },
    { label: "Indirizzo", value: clientAddressLine },
    { label: "Referente", value: clientReference },
    { label: "Email", value: clientEmail },
    { label: "Codice SDI", value: clientSdi },
    { label: "PEC", value: clientPec },
  ].filter(d => d.value && d.value.trim())
  const acceptedPreference: QuoteBillingPreference = rawItems.some(i => i.billing_period === "yearly") && !rawItems.some(i => i.billing_period === "monthly") ? "yearly" : "monthly"
  const [billingPreference, setBillingPreference] = useState<QuoteBillingPreference>(acceptedPreference)
  const effectiveItems = useMemo(() => alreadyAccepted ? rawItems : rawItems.map(item => applyBillingPreference(item, billingPreference)), [alreadyAccepted, rawItems, billingPreference])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => {
    const initial = new Set(rawItems.filter(item => !item.optional || (alreadyAccepted ? item.customer_selected !== false : item.default_selected !== false)).map(item => item.id).filter((id): id is string => !!id))
    // Sicurezza: se per dati storici entrambe le alternative di un gruppo a
    // scelta risultassero pre-selezionate, ne teniamo solo la prima. Cosi' la
    // regola "una sola" vale gia' al primo render, non solo dopo un click.
    const seen = new Set<string>()
    for (const item of rawItems) {
      const key = choiceGroupKey(item)
      if (!key || !item.id || !initial.has(item.id)) continue
      if (seen.has(key)) initial.delete(item.id); else seen.add(key)
    }
    return initial
  })

  const selectedItems = useMemo(() => effectiveItems.filter(item => !item.optional || (!!item.id && selectedIds.has(item.id))), [effectiveItems, selectedIds])
  const recurringParents = selectedItems.filter(i => i.billing_period !== "one_time")
  const selectedRawItems = useMemo(() => rawItems.filter(i => !i.optional || (!!i.id && selectedIds.has(i.id))), [rawItems, selectedIds])
  const annualBenefit = useMemo(() => annualComparison(selectedRawItems), [selectedRawItems])
  const annualEligible = annualBenefit.eligible
  const savingDetail = [
    annualBenefit.recurringSaving > 0 ? `${formatQuoteAmount(annualBenefit.recurringSaving, currency)} sui canoni` : null,
    annualBenefit.setupSaving > 0 ? `${formatQuoteAmount(annualBenefit.setupSaving, currency)} su setup e servizi una tantum` : null,
  ].filter(Boolean).join(" + ")
  const requiresCard = selectedItems.some(item => SAAS_PROJECTS.has(item.project || "") || (item.billing_period && item.billing_period !== "one_time"))

  // Le condizioni economiche seguono la formula scelta in questo momento:
  // la casella di conferma deve citare cio' che il cliente sta guardando.
  const contractTerms = useMemo(() => parseContractTerms(quote.contract_terms), [quote.contract_terms])
  const economicLines = useMemo(
    () => economicTerms(selectedItems, alreadyAccepted ? acceptedPreference : billingPreference, currency, { expiresAt: quote.expires_at, vatIncluded: quote.vat_included }),
    [selectedItems, alreadyAccepted, acceptedPreference, billingPreference, currency, quote.expires_at, quote.vat_included],
  )

  const [fieldValues,setFieldValues] = useState<Record<string,string>>(() => (quote.submitted_fields as Record<string,string>) || {})
  // `client_address` e' l'indirizzo su UNA riga ("via - CAP citta (PROV)"): va
  // solo nel campo Indirizzo. Finiva anche in Citta', che quindi mostrava
  // l'indirizzo completo mentre CAP e Provincia restavano vuoti: dati giusti
  // nei campi sbagliati, il tipo di errore che si copia poi in fattura.
  // I pezzi separati arrivano da `billing_details`, precompilato dal controllo
  // P.IVA al momento della creazione del preventivo.
  const [billing,setBilling] = useState<QuoteBillingDetails>(() => {
    const saved=(quote.billing_details as QuoteBillingDetails)||{}
    // Se i pezzi separati ci sono, ci si fida di quelli. Altrimenti si scompone
    // l'indirizzo su una riga (billing_details.address o client_address) cosi'
    // CAP/Citta/Provincia arrivano precompilati invece di restare vuoti.
    const hasParts = Boolean((saved.zip||"").trim() || (saved.city||"").trim() || (saved.province||"").trim())
    const parsed = hasParts ? null : splitAddressLine(saved.address||quote.client_address||"")
    return { company:saved.company||quote.client_company||"",vat:saved.vat||quote.client_vat||"",tax_code:saved.tax_code||"",address:parsed?.address||saved.address||quote.client_address||"",zip:saved.zip||parsed?.zip||"",city:saved.city||parsed?.city||"",province:saved.province||parsed?.province||"",sdi_code:saved.sdi_code||"",pec:saved.pec||"",reference:saved.reference||quote.client_name||"" }
  })
  const [acceptanceName,setAcceptanceName] = useState(quote.acceptance_name || "")
  const [acceptedTerms,setAcceptedTerms] = useState(false)
  const [paymentMethod,setPaymentMethod] = useState<PaymentMethod|null>((quote.payment_method as PaymentMethod)|| (requiresCard ? "card" : null))
  const [confirmedMethod,setConfirmedMethod] = useState<PaymentMethod|null>(alreadyAccepted ? ((quote.payment_method as PaymentMethod)||null) : null)
  const [accepting,setAccepting] = useState(false); const [paying,setPaying] = useState(false); const [portalLoading,setPortalLoading] = useState(false)

  const totals = useMemo(() => {
    // Per ogni fascia sommiamo sia il NETTO (amount) sia il LISTINO (lineGrossAmount):
    // il listino serve a barrare il prezzo pieno e a calcolare la % di sconto.
    const bucket = (period: string) => selectedItems.filter(i => i.billing_period === period)
    const net = (arr: QuoteLineItem[]) => arr.reduce((sum, i) => sum + Number(i.amount || 0), 0)
    const gross = (arr: QuoteLineItem[]) => arr.reduce((sum, i) => sum + lineGrossAmount(i), 0)
    const one = bucket("one_time"), mon = bucket("monthly"), yr = bucket("yearly")
    return {
      oneTime: net(one), oneTimeGross: gross(one),
      monthly: net(mon), monthlyGross: gross(mon),
      yearly: net(yr), yearlyGross: gross(yr),
    }
  }, [selectedItems])

  function chooseAnnual() {
    if (!annualEligible || alreadyAccepted) return
    setBillingPreference("yearly")
    document.getElementById("formula-abbonamento")?.scrollIntoView({ behavior: "smooth", block: "center" })
  }
  function parentSelected(item: QuoteLineItem) { const parent=getCommercialMeta(item).parent_line_id; return !parent || selectedItems.some(i=>i.id===parent) }
  function setItemSelected(item: QuoteLineItem,value:boolean) {
    if(!item.optional||!item.id||alreadyAccepted)return
    const groupKey = choiceGroupKey(item)
    setSelectedIds(current=>{
      const next=new Set(current)
      if(value){
        // Scegliendo un'alternativa, le altre dello stesso gruppo si escludono.
        if(groupKey) for(const other of rawItems) if(other.id && other.id!==item.id && choiceGroupKey(other)===groupKey) next.delete(other.id)
        next.add(item.id!)
      } else next.delete(item.id!)
      return next
    })
    if(value && requiresCard)setPaymentMethod("card")
  }
  function setBillingField(key:keyof QuoteBillingDetails,value:string){setBilling(current=>({...current,[key]:value}))}
  function setCredentialPart(key:string,part:"id"|"password",value:string){const current=decodeCredential(fieldValues[key]);setFieldValues(values=>({...values,[key]:encodeCredential(part==="id"?value:current.id,part==="password"?value:current.password)}))}

  async function startCardPayment(){setPaying(true);try{const response=await fetch(`/api/quotes/shared/${token}/checkout`,{method:"POST"});const data=await response.json().catch(()=>({}));if(!response.ok)throw new Error(data.error||"Impossibile avviare il pagamento");if(!data.url)throw new Error("URL di pagamento non disponibile");window.location.assign(data.url)}catch(error:any){toast.error(error.message||"Errore nel pagamento");setPaying(false)}}

  async function openBillingPortal(){setPortalLoading(true);try{const response=await fetch(`/api/quotes/shared/${token}/portal`,{method:"POST"});const data=await response.json().catch(()=>({}));if(!response.ok)throw new Error(data.error||"Impossibile aprire la gestione abbonamento");if(!data.url)throw new Error("URL del portale non disponibile");window.location.assign(data.url)}catch(error:any){toast.error(error.message||"Errore nell'apertura del portale");setPortalLoading(false)}}

  async function acceptQuote(){
    if(expired)return toast.error("Questo preventivo è scaduto")
    if(billingPreference === "yearly" && !annualEligible) return toast.error("La formula annuale non è disponibile per i prodotti selezionati")
    if(!selectedItems.length)return toast.error("Seleziona almeno una voce del preventivo")
    if(!acceptanceName.trim())return toast.error("Inserisci nome e cognome dell'accettante")
    if(!acceptedTerms)return toast.error("Accetta il preventivo e le condizioni")
    const effectivePaymentMethod:PaymentMethod|null=requiresCard?"card":paymentMethod;if(!effectivePaymentMethod)return toast.error("Scegli una modalità di pagamento")
    for(const field of requestedFields){if(!field.required)continue;if(field.type==="credentials"){const c=decodeCredential(fieldValues[field.key]);if(!c.id.trim()||!c.password.trim())return toast.error(`Compila ${field.label}`)}else if(!(fieldValues[field.key]||"").trim())return toast.error(`Compila il campo obbligatorio: ${field.label}`)}
    const required:Array<[keyof QuoteBillingDetails,string]>=[["company","Ragione sociale"],["vat","Partita IVA"],["address","Indirizzo"],["zip","CAP"],["city","Città"],["province","Provincia"]];for(const [key,label] of required)if(!(billing[key]||"").trim())return toast.error(`Compila ${label}`);if(!(billing.sdi_code||"").trim()&&!(billing.pec||"").trim())return toast.error("Inserisci Codice SDI oppure PEC")
    setAccepting(true)
    try{const response=await fetch(`/api/quotes/shared/${token}/accept`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({submitted_fields:fieldValues,billing_details:billing,acceptance_name:acceptanceName.trim(),accepted:true,payment_method:effectivePaymentMethod,selected_item_ids:selectedItems.map(i=>i.id).filter(Boolean),billing_preference:billingPreference})});const data=await response.json().catch(()=>({}));if(!response.ok)throw new Error(data.error||"Accettazione non riuscita");setConfirmedMethod(effectivePaymentMethod);toast.success("Preventivo accettato");if(effectivePaymentMethod==="card")await startCardPayment()}catch(error:any){toast.error(error.message||"Errore nell'accettazione")}finally{setAccepting(false)}
  }

  return <div className="min-h-screen bg-muted/30"><header className="border-b bg-background"><div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-5 sm:px-6"><Image src="/logo.png" alt="4BID" width={110} height={44} className="h-10 w-auto object-contain" priority/><div className="text-right"><p className="text-sm font-semibold">Proposta commerciale</p>{quote.quote_number?<p className="text-xs text-muted-foreground">N. {quote.quote_number}</p>:null}</div></div></header>
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6">
      <OfferCountdown expiresAt={quote.expires_at} expired={expired}/>
      {expired?<div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-destructive">Questo preventivo è scaduto. Contatta 4BID per riceverne uno aggiornato.</div>:null}
      {alreadyPaid?<div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900"><CheckCircle2 className="h-5 w-5"/>Pagamento confermato. L'attivazione dei servizi selezionati è stata avviata.</div>:null}
      {alreadyPaid&&recurringParents.length>0?<section className="rounded-2xl border bg-card p-6"><div className="mb-1 flex items-center gap-2"><Settings className="h-5 w-5 text-primary"/><h2 className="font-semibold">Gestione abbonamento</h2></div><p className="mb-4 text-sm text-muted-foreground">Puoi disattivare il rinnovo automatico in autonomia dalla piattaforma, senza comunicazioni scritte. Il servizio resta attivo fino al termine del periodo già pagato.</p><Button onClick={openBillingPortal} disabled={portalLoading}>{portalLoading?<Loader2 className="mr-2 h-4 w-4 animate-spin"/>:<Settings className="mr-2 h-4 w-4"/>}Gestisci abbonamento / Disattiva rinnovo</Button></section>:null}

      <section className="overflow-hidden rounded-2xl border bg-card"><div className="bg-primary px-6 py-7 text-primary-foreground"><div className="mb-3 flex items-center gap-2 text-sm font-medium opacity-90"><FileText className="h-4 w-4"/>4BID · Soluzioni digitali e consulenza</div><h1 className="text-3xl font-bold">{quote.title}</h1>{quote.description?<p className="mt-3 whitespace-pre-wrap text-sm opacity-90">{quote.description}</p>:null}</div><div className="px-6 py-5"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs uppercase text-muted-foreground">Cliente</p><p className="mt-1 text-lg font-semibold">{clientCompany}</p></div><div className="sm:text-right"><p className="text-xs uppercase text-muted-foreground">Validità</p><p className="mt-1 font-medium">{quote.expires_at?`fino al ${new Date(quote.expires_at).toLocaleString("it-IT")}`:"Secondo condizioni indicate"}</p></div></div>{clientDetails.length?<dl className="mt-4 grid gap-x-6 gap-y-2 border-t pt-4 text-sm sm:grid-cols-2">{clientDetails.map(d=><div key={d.label} className="flex flex-col"><dt className="text-xs uppercase tracking-wide text-muted-foreground">{d.label}</dt><dd className="font-medium break-words">{d.value}</dd></div>)}</dl>:null}</div></section>

      {!alreadyAccepted && recurringParents.length > 0 ? <section id="formula-abbonamento" className="rounded-2xl border-2 border-primary/25 bg-card p-6 shadow-sm"><div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between"><div><div className="flex items-center gap-2"><Clock3 className="h-5 w-5 text-primary"/><h2 className="text-xl font-bold">Scegli la formula di abbonamento</h2></div><p className="mt-1 text-sm text-muted-foreground">Il confronto comprende i canoni e anche setup e servizi una tantum agevolati con l&apos;annuale.</p></div><div className="grid grid-cols-2 rounded-xl border bg-muted p-1" role="group" aria-label="Formula di abbonamento"><button type="button" aria-pressed={billingPreference === "monthly"} onClick={() => setBillingPreference("monthly")} className={`rounded-lg px-5 py-3 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${billingPreference === "monthly" ? "bg-background text-foreground shadow" : "text-muted-foreground hover:bg-background/60 hover:text-foreground"}`}>Mensile</button><button type="button" aria-pressed={billingPreference === "yearly"} disabled={!annualEligible} onClick={() => setBillingPreference("yearly")} className={`rounded-lg px-5 py-3 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${billingPreference === "yearly" ? "bg-emerald-600 text-primary-foreground shadow" : "text-emerald-700 hover:bg-emerald-50"} ${!annualEligible ? "cursor-not-allowed opacity-40" : ""}`}>Annuale{annualBenefit.amount > 0 ? ` · -${annualBenefit.pct}%` : ""}</button></div></div>{annualEligible && annualBenefit.amount > 0 ? <div className="mt-4 rounded-lg bg-emerald-50 p-3 text-sm font-bold text-emerald-800">Scegliendo l&apos;annuale risparmi {formatQuoteAmount(annualBenefit.amount,currency)} sul primo anno{savingDetail ? `: ${savingDetail}` : ""}.</div> : !annualEligible ? <p className="mt-3 text-xs text-muted-foreground">La formula annuale non è prevista per i prodotti selezionati.</p> : null}</section> : null}

      <section className="space-y-4"><div className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary"/><div><h2 className="text-xl font-semibold">Costruisci la soluzione più adatta alla tua struttura</h2>{rawItems.some(i=>i.optional)&&!alreadyAccepted?<p className="text-sm text-muted-foreground">Le voci essenziali sono già incluse; puoi aggiungere gli extra che generano più valore per il tuo team.</p>:null}</div></div>{effectiveItems.map((item,index)=><LineItemCard key={item.id||index} item={item} currency={currency} selected={!item.optional||!!item.id&&selectedIds.has(item.id)} parentSelected={parentSelected(item)} choiceGroup={choiceGroupKey(item)!==null} locked={alreadyAccepted} promo={annualSetupPromo(rawItems[index] || item)} priceModel={buildLinePricing(rawItems[index] || item)} billingPreference={billingPreference} annualEligible={annualEligible} onChooseAnnual={chooseAnnual} onSelectedChange={value=>setItemSelected(item,value)}/>)}</section>

      {(() => {
        const firstYear = totals.oneTime + totals.monthly * 12 + totals.yearly
        const firstYearGross = totals.oneTimeGross + totals.monthlyGross * 12 + totals.yearlyGross
        const mixed = totals.monthly > 0 && totals.yearly > 0
        // Costo per struttura/asset/utente: solo se il piano Corporate selezionato
        // ha valorizzato i relativi limiti (totale gruppo). Ripartisce SOLO il
        // costo ricorrente annualizzato (canoni mensili x12 + canoni annuali),
        // ESCLUSO il setup una tantum: mostra il costo unitario dell'abbonamento.
        const recurringYearly = totals.monthly * 12 + totals.yearly
        // Stessa base ricorrente al LISTINO, per barrare il prezzo pieno del
        // canone "dal secondo anno" (che esclude il setup una tantum).
        const recurringYearlyGross = totals.monthlyGross * 12 + totals.yearlyGross
        const corporate = selectedItems.find(i => i.project === "manubot" && i.kind === "plan" && /corporate/i.test(i.name || ""))
        const corpMeta = corporate ? getCommercialMeta(corporate) : null
        const perUnit: Array<{ label: string; value: string }> = []
        if (corpMeta && recurringYearly > 0) {
          const structures = Number(corporate!.quantity) || 0
          const assets = Number(corpMeta.corporate_max_assets) || 0
          const users = Number(corpMeta.corporate_max_users) || 0
          // Ogni voce e' mostrata solo se il relativo selettore e' attivo (default
          // attivo se mai impostato) E il valore ha senso (>0).
          // Il cliente vuole vedere il costo MENSILE per unita' (non l'annuo):
          // il canone ricorrente e' annuo, quindi si divide anche per 12.
          const recurringMonthly = recurringYearly / 12
          if (structures > 0 && corpMeta.corporate_show_per_structure !== false) perUnit.push({ label: "per struttura", value: formatQuoteAmount(recurringMonthly / structures, currency) })
          if (assets > 0 && corpMeta.corporate_show_per_asset !== false) perUnit.push({ label: "per asset", value: formatQuoteAmount(recurringMonthly / assets, currency) })
          if (users > 0 && corpMeta.corporate_show_per_user !== false) perUnit.push({ label: "per utente", value: formatQuoteAmount(recurringMonthly / users, currency) })
        }
        // Valore "per struttura" al mese (canone ricorrente dal secondo anno):
        // stesso importo del ripartito, mostrato dentro il box "Dal secondo anno".
        const perStructure = perUnit.find(u => u.label === "per struttura") || null
        return <section className="rounded-2xl border border-primary/20 bg-background/95 p-6 shadow-lg backdrop-blur">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-3 flex flex-wrap items-center gap-3">
                <h2 className="text-lg font-semibold">Il tuo investimento</h2>
                {!alreadyAccepted && recurringParents.length > 0 ? <div className="grid grid-cols-2 rounded-lg border bg-muted p-0.5" role="group" aria-label="Formula di abbonamento"><button type="button" aria-pressed={billingPreference === "monthly"} onClick={() => setBillingPreference("monthly")} className={`rounded-md px-3 py-1.5 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${billingPreference === "monthly" ? "bg-background text-foreground shadow" : "text-muted-foreground hover:bg-background/60 hover:text-foreground"}`}>Mensile</button><button type="button" aria-pressed={billingPreference === "yearly"} disabled={!annualEligible} onClick={() => setBillingPreference("yearly")} className={`rounded-md px-3 py-1.5 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${billingPreference === "yearly" ? "bg-emerald-600 text-primary-foreground shadow" : "text-emerald-700 hover:bg-emerald-50"} ${!annualEligible ? "cursor-not-allowed opacity-40" : ""}`}>Annuale{annualBenefit.amount > 0 ? ` · -${annualBenefit.pct}%` : ""}</button></div> : null}
              </div>
              <div className="flex flex-wrap gap-x-8 gap-y-3">
                {totals.oneTime > 0 ? <div><p className="text-xs text-muted-foreground">Una tantum (setup)</p><DiscountedAmount net={totals.oneTime} gross={totals.oneTimeGross} currency={currency} netClassName="text-xl font-bold" /><p className="text-[11px] text-muted-foreground">addebito una sola volta</p></div> : null}
                {totals.monthly > 0 ? <div><p className="text-xs text-muted-foreground">Canone mensile</p><DiscountedAmount net={totals.monthly} gross={totals.monthlyGross} currency={currency} netClassName="text-2xl font-black" suffix={<span className="text-sm font-normal text-muted-foreground"> /mese</span>} /><p className="text-[11px] text-muted-foreground">addebito ogni mese</p></div> : null}
                {totals.yearly > 0 ? <div><p className="text-xs text-muted-foreground">Canone annuale</p><DiscountedAmount net={totals.yearly} gross={totals.yearlyGross} currency={currency} netClassName="text-2xl font-black" suffix={<span className="text-sm font-normal text-muted-foreground"> /anno</span>} /><p className="text-[11px] text-muted-foreground">addebito una volta l&apos;anno</p></div> : null}
              </div>
              {mixed ? <p className="mt-3 max-w-xl text-xs text-muted-foreground">Alcune voci sono disponibili solo in formula mensile: per questo vedi sia un canone annuale sia un canone mensile. Il totale sotto li comprende entrambi.</p> : null}
            </div>
            <div className="lg:text-right">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Totale primo anno</p>
              <div className="flex justify-start lg:justify-end"><DiscountedAmount net={firstYear} gross={firstYearGross} currency={currency} netClassName="text-2xl font-black" align="right" /></div>
              <p className="text-[11px] text-muted-foreground">una tantum + canoni per 12 mesi</p>
              <p className="mt-1 text-xs text-muted-foreground">{quote.vat_included ? "Importi IVA inclusa" : "Importi IVA esclusa"}</p>
            </div>
          </div>
          {recurringYearly > 0 && (perUnit.length > 0 || totals.oneTime > 0) ? <div className="mt-4 flex flex-col gap-4 border-t pt-4 lg:flex-row lg:items-start lg:justify-between">
            {perUnit.length ? <div className="flex flex-wrap gap-x-6 gap-y-2">
              <p className="w-full text-xs uppercase tracking-wide text-muted-foreground">Costo abbonamento mensile ripartito<span className="normal-case font-normal"> (solo canoni, escluso setup)</span></p>
              {perUnit.map(u => <div key={u.label}><p className="text-base font-bold">{u.value}<span className="text-[11px] font-normal text-muted-foreground"> /mese</span></p><p className="text-[11px] text-muted-foreground">{u.label}</p></div>)}
            </div> : <div className="hidden lg:block" />}
            {totals.oneTime > 0 ? <div className="inline-flex flex-col rounded-xl border border-primary/30 bg-primary/5 px-4 py-2 lg:items-end lg:text-right">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">Dal secondo anno</p>
              <div className="flex justify-start lg:justify-end"><DiscountedAmount net={recurringYearly} gross={recurringYearlyGross} currency={currency} netClassName="text-xl font-black" suffix={<span className="text-sm font-normal text-muted-foreground"> /anno</span>} align="right" /></div>
              {perStructure ? <p className="mt-1 text-base font-bold">{perStructure.value}<span className="text-[11px] font-normal text-muted-foreground"> /mese per struttura</span></p> : null}
              <p className="mt-1 text-[11px] text-muted-foreground">solo canoni ricorrenti, senza il setup una tantum</p>
            </div> : null}
          </div> : null}
        </section>
      })()}

      <ComparisonTablesPreview tables={normalizeQuoteTables(quote.comparison_tables)} />

      <ContractTermsSection terms={contractTerms} economic={economicLines} paymentTerms={quote.payment_terms} />

      {!alreadyAccepted&&!expired?<>
        {requestedFields.length?<section className="rounded-2xl border bg-card p-6 space-y-4"><h2 className="font-semibold">Dati necessari all'attivazione</h2>{requestedFields.map(field=>{const credential=field.type==="credentials"?decodeCredential(fieldValues[field.key]):null;return <div key={field.key}><Label>{field.label}{field.required?" *":""}</Label>{field.type==="credentials"?<div className="grid gap-2 sm:grid-cols-2"><Input placeholder="ID / Username" value={credential?.id||""} onChange={e=>setCredentialPart(field.key,"id",e.target.value)}/><Input type="password" placeholder="Password" value={credential?.password||""} onChange={e=>setCredentialPart(field.key,"password",e.target.value)}/></div>:field.type==="textarea"?<Textarea value={fieldValues[field.key]||""} onChange={e=>setFieldValues(v=>({...v,[field.key]:e.target.value}))}/>:<Input type={field.type==="email"?"email":"text"} value={fieldValues[field.key]||""} onChange={e=>setFieldValues(v=>({...v,[field.key]:e.target.value}))}/>}</div>})}</section>:null}
        <section className="rounded-2xl border bg-card p-6 space-y-4"><div className="flex items-center gap-2"><Receipt className="h-5 w-5 text-primary"/><h2 className="font-semibold">Dati di fatturazione</h2></div><div className="grid gap-4 sm:grid-cols-2"><div className="sm:col-span-2"><Label>Ragione sociale *</Label><Input value={billing.company||""} onChange={e=>setBillingField("company",e.target.value)}/></div><div><Label>Partita IVA *</Label><Input value={billing.vat||""} onChange={e=>setBillingField("vat",e.target.value)}/></div><div><Label>Codice fiscale</Label><Input value={billing.tax_code||""} onChange={e=>setBillingField("tax_code",e.target.value)}/></div><div className="sm:col-span-2"><Label>Indirizzo *</Label><Input value={billing.address||""} onChange={e=>setBillingField("address",e.target.value)}/></div><div><Label>CAP *</Label><Input value={billing.zip||""} onChange={e=>setBillingField("zip",e.target.value)}/></div><div><Label>Città *</Label><Input value={billing.city||""} onChange={e=>setBillingField("city",e.target.value)}/></div><div><Label>Provincia *</Label><Input maxLength={2} value={billing.province||""} onChange={e=>setBillingField("province",e.target.value.toUpperCase())}/></div><div><Label>Referente amministrativo</Label><Input value={billing.reference||""} onChange={e=>setBillingField("reference",e.target.value)}/></div><div><Label>Codice SDI</Label><Input value={billing.sdi_code||""} onChange={e=>setBillingField("sdi_code",e.target.value.toUpperCase())}/></div><div><Label>PEC</Label><Input type="email" value={billing.pec||""} onChange={e=>setBillingField("pec",e.target.value)}/></div></div></section>
        <section className="rounded-2xl border-2 border-primary/20 bg-card p-6 space-y-5"><div><h2 className="text-xl font-semibold">Accetta la configurazione selezionata</h2><p className="text-sm text-muted-foreground">Con l'accettazione vengono congelati prodotti, periodicità, prezzi, omaggi e condizioni.</p></div><div><Label>Nome e cognome dell'accettante *</Label><Input value={acceptanceName} onChange={e=>setAcceptanceName(e.target.value)}/></div>{requiresCard?<div className="rounded-xl border border-primary/20 bg-primary/5 p-4"><CreditCard className="mb-2 h-5 w-5"/><strong className="block">Carta di credito richiesta</strong><span className="text-xs text-muted-foreground">Necessaria per attivazione e rinnovi automatici.</span></div>:<div className="grid gap-3 sm:grid-cols-2"><button type="button" onClick={()=>setPaymentMethod("card")} className={`rounded-xl border p-4 text-left ${paymentMethod==="card"?"border-primary bg-primary/5":""}`}><CreditCard className="mb-2 h-5 w-5"/><strong>Carta</strong></button><button type="button" onClick={()=>setPaymentMethod("bonifico")} className={`rounded-xl border p-4 text-left ${paymentMethod==="bonifico"?"border-primary bg-primary/5":""}`}><Banknote className="mb-2 h-5 w-5"/><strong>Bonifico</strong></button></div>}<label className="flex items-start gap-3 text-sm"><Checkbox checked={acceptedTerms} onCheckedChange={v=>setAcceptedTerms(v===true)}/><span>{acceptanceLabel(contractTerms)}</span></label><Button size="lg" className="w-full" onClick={acceptQuote} disabled={accepting||paying}>{accepting||paying?<Loader2 className="mr-2 h-4 w-4 animate-spin"/>:<CheckCircle2 className="mr-2 h-4 w-4"/>}{requiresCard||paymentMethod==="card"?"Accetta e attiva la soluzione":"Accetta preventivo"}</Button></section>
      </>:null}

      {alreadyAccepted&&!alreadyPaid&&confirmedMethod==="card"?<section className="rounded-2xl border border-primary/20 bg-card p-6 text-center"><h2 className="font-semibold">Preventivo accettato</h2><p className="mb-4 text-sm text-muted-foreground">Completa il pagamento per avviare automaticamente l'attivazione.</p><Button size="lg" onClick={startCardPayment} disabled={paying}>{paying?<Loader2 className="mr-2 h-4 w-4 animate-spin"/>:<CreditCard className="mr-2 h-4 w-4"/>}Vai al pagamento</Button></section>:null}
      {alreadyAccepted&&!alreadyPaid&&confirmedMethod==="bonifico"?<section className="rounded-2xl border bg-card p-6"><div className="mb-3 flex items-center gap-2"><Banknote className="h-5 w-5 text-primary"/><h2 className="font-semibold">Coordinate per il bonifico</h2></div><div className="space-y-1 text-sm"><p><strong>Beneficiario:</strong> {QUOTE_BANK_DETAILS.holder}</p><p><strong>Banca:</strong> {QUOTE_BANK_DETAILS.bank}</p><p><strong>IBAN:</strong> <span className="font-mono">{QUOTE_BANK_DETAILS.iban}</span></p><p><strong>Causale:</strong> {quoteTransferReason(quote.quote_number,token.slice(0,8))}</p></div></section>:null}
      <section className="rounded-2xl border bg-card p-6">
        <div className="mb-3 flex items-center gap-2"><FileText className="h-5 w-5 text-primary" /><h2 className="font-semibold">Proposta emessa da</h2></div>
        <div className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
          <div className="flex flex-col"><span className="text-xs uppercase tracking-wide text-muted-foreground">Ragione sociale</span><span className="font-medium">{QUOTE_SELLER.legalName}</span></div>
          <div className="flex flex-col"><span className="text-xs uppercase tracking-wide text-muted-foreground">P.IVA</span><span className="font-medium">{QUOTE_SELLER.vat}</span></div>
          <div className="flex flex-col sm:col-span-2"><span className="text-xs uppercase tracking-wide text-muted-foreground">Sede legale</span><span className="font-medium">{QUOTE_SELLER_ADDRESS_LINE}</span></div>
          <div className="flex flex-col"><span className="text-xs uppercase tracking-wide text-muted-foreground">Email</span><a href={`mailto:${QUOTE_SELLER.email}`} className="font-medium text-primary hover:underline">{QUOTE_SELLER.email}</a></div>
          <div className="flex flex-col"><span className="text-xs uppercase tracking-wide text-muted-foreground">Sito</span><a href={`https://${QUOTE_SELLER.website}`} target="_blank" rel="noreferrer" className="font-medium text-primary hover:underline">{QUOTE_SELLER.website}</a></div>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">{QUOTE_SELLER.tagline}</p>
      </section>
    </main>
  </div>
}

export { hasCommerceData }
