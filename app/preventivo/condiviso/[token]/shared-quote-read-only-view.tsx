import Image from "next/image"
import { CheckCircle2, FileText, LockKeyhole, Mail, Sparkles } from "lucide-react"
import ComparisonTablesPreview from "@/components/quotes/comparison-tables-preview"
import DiscountedAmount from "@/components/quotes/discounted-amount"
import { ProjectBrand } from "@/components/quotes/project-brand"
import { normalizeQuoteTables } from "@/lib/quotes/comparison"
import { lineGrossAmount } from "@/lib/quotes/commercial"
import { QUOTE_SELLER, QUOTE_SELLER_ADDRESS_LINE } from "@/lib/quotes/company"
import { economicTerms, parseContractTerms } from "@/lib/quotes/terms"
import {
  calculateQuoteLine,
  formatQuoteAmount,
  isQuoteLineSelected,
  type QuoteLineItem,
  type SalesChannelQuote,
} from "@/lib/quotes/types"
import ContractTermsSection from "../../[token]/contract-terms-section"

type Props = {
  quote: Partial<SalesChannelQuote>
  recipientEmail: string
  expired: boolean
}

const PERIOD_LABELS: Record<string, string> = {
  one_time: "una tantum",
  monthly: "al mese",
  quarterly: "a trimestre",
  yearly: "all'anno",
}

export default function SharedQuoteReadOnlyView({ quote, recipientEmail, expired }: Props) {
  const items = ((quote.line_items || []) as QuoteLineItem[]).map(calculateQuoteLine)
  const selectedItems = items.filter(isQuoteLineSelected)
  const currency = quote.currency || "eur"
  const netTotal = quote.total_amount ?? selectedItems.reduce((sum, item) => sum + Number(item.amount || 0), 0)
  const grossTotal = selectedItems.reduce((sum, item) => sum + lineGrossAmount(item), 0)
  const contractTerms = parseContractTerms(quote.contract_terms)
  const billingPreference = selectedItems.some((item) => item.billing_period === "yearly") && !selectedItems.some((item) => item.billing_period === "monthly")
    ? "yearly"
    : "monthly"
  const economicLines = economicTerms(selectedItems, billingPreference, currency, {
    expiresAt: quote.expires_at,
    vatIncluded: quote.vat_included,
  })
  const client = quote.client_company || quote.client_name || "Cliente"
  const alreadyPaid = quote.status === "paid" || quote.payment_status === "paid"
  const alreadyAccepted = quote.status === "accepted" || alreadyPaid

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b bg-background">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-5 sm:px-6">
          <Image src="/logo.png" alt="4BID" width={110} height={44} className="h-10 w-auto object-contain" priority />
          <div className="text-right">
            <p className="text-sm font-semibold">Copia del preventivo</p>
            {quote.quote_number ? <p className="text-xs text-muted-foreground">N. {quote.quote_number}</p> : null}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6">
        <section className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-5 text-amber-950">
          <div className="flex items-start gap-3">
            <LockKeyhole className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <h1 className="font-bold">Copia personale in sola consultazione</h1>
              <p className="mt-1 text-sm leading-relaxed">
                Questa copia è stata inviata a <strong>{recipientEmail}</strong>. Puoi consultare la proposta e inoltrarla, ma solo il destinatario originale può modificarne la configurazione, accettarla o procedere al pagamento.
              </p>
            </div>
          </div>
        </section>

        {expired ? (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-destructive">
            Questo preventivo è scaduto. Contatta 4BID per riceverne uno aggiornato.
          </div>
        ) : null}

        {alreadyAccepted ? (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900">
            <CheckCircle2 className="h-5 w-5" />
            {alreadyPaid ? "Il preventivo risulta accettato e pagato." : "Il preventivo risulta già accettato dal destinatario originale."}
          </div>
        ) : null}

        <section className="overflow-hidden rounded-2xl border bg-card">
          <div className="bg-primary px-6 py-7 text-primary-foreground">
            <div className="mb-3 flex items-center gap-2 text-sm font-medium opacity-90">
              <FileText className="h-4 w-4" />
              4BID · Proposta commerciale
            </div>
            <h2 className="text-3xl font-bold text-balance">{quote.title || "Preventivo 4BID"}</h2>
            {quote.description ? <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed opacity-90">{quote.description}</p> : null}
          </div>
          <div className="grid gap-4 px-6 py-5 sm:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Cliente</p>
              <p className="mt-1 text-lg font-semibold">{client}</p>
              {quote.client_vat ? <p className="mt-1 text-sm text-muted-foreground">P.IVA/CF: {quote.client_vat}</p> : null}
              {quote.client_address ? <p className="text-sm text-muted-foreground">{quote.client_address}</p> : null}
            </div>
            <div className="sm:text-right">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Validità</p>
              <p className="mt-1 font-medium">
                {quote.expires_at ? `Fino al ${new Date(quote.expires_at).toLocaleString("it-IT")}` : "Secondo le condizioni indicate"}
              </p>
            </div>
          </div>
        </section>

        {items.length ? (
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold">Soluzione proposta</h2>
            </div>
            {items.map((item, index) => {
              const selected = isQuoteLineSelected(item)
              const period = PERIOD_LABELS[item.billing_period || "one_time"] || item.billing_period
              return (
                <article
                  key={item.id || `${item.description}-${index}`}
                  className={`rounded-2xl border bg-card p-5 ${selected ? "" : "opacity-55"}`}
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        {item.project ? <ProjectBrand project={item.project} compact /> : null}
                        <h3 className="text-xl font-bold">{item.name || item.description}</h3>
                        {item.optional ? (
                          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${selected ? "bg-emerald-100 text-emerald-800" : "bg-muted text-muted-foreground"}`}>
                            {selected ? "Opzione inclusa" : "Opzione non inclusa"}
                          </span>
                        ) : null}
                      </div>
                      {item.name && item.description && item.description !== item.name ? (
                        <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{item.description}</p>
                      ) : null}
                      {item.features?.length ? (
                        <ul className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
                          {item.features.map((feature, featureIndex) => (
                            <li key={`${feature}-${featureIndex}`} className="flex items-start gap-2">
                              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                    <div className="shrink-0 rounded-xl border bg-muted/20 px-4 py-3 sm:min-w-44 sm:text-right">
                      <DiscountedAmount
                        net={Number(item.amount || 0)}
                        gross={lineGrossAmount(item)}
                        currency={currency}
                        netClassName="text-xl font-black"
                        align="right"
                      />
                      <p className="text-xs text-muted-foreground">{period}</p>
                      {(item.quantity || 1) > 1 ? <p className="mt-1 text-xs text-muted-foreground">Quantità: {item.quantity}</p> : null}
                    </div>
                  </div>
                </article>
              )
            })}
          </section>
        ) : null}

        {(items.length > 0 || quote.total_amount != null) ? (
          <section className="rounded-2xl border border-primary/20 bg-card p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Totale della proposta</p>
                <p className="mt-1 text-sm text-muted-foreground">Calcolato sulle voci incluse nella configurazione condivisa.</p>
              </div>
              <div className="sm:text-right">
                <DiscountedAmount
                  net={Number(netTotal || 0)}
                  gross={grossTotal}
                  currency={currency}
                  netClassName="text-3xl font-black"
                  align="right"
                />
                <p className="text-xs text-muted-foreground">{quote.vat_included ? "IVA inclusa" : "IVA esclusa"}</p>
              </div>
            </div>
          </section>
        ) : null}

        <ComparisonTablesPreview tables={normalizeQuoteTables(quote.comparison_tables)} />
        <ContractTermsSection terms={contractTerms} economic={economicLines} paymentTerms={quote.payment_terms} />

        <section className="rounded-2xl border bg-card p-6">
          <div className="mb-3 flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <h2 className="font-semibold">Proposta emessa da</h2>
          </div>
          <div className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
            <div className="flex flex-col"><span className="text-xs uppercase tracking-wide text-muted-foreground">Ragione sociale</span><span className="font-medium">{QUOTE_SELLER.legalName}</span></div>
            <div className="flex flex-col"><span className="text-xs uppercase tracking-wide text-muted-foreground">P.IVA</span><span className="font-medium">{QUOTE_SELLER.vat}</span></div>
            <div className="flex flex-col sm:col-span-2"><span className="text-xs uppercase tracking-wide text-muted-foreground">Sede legale</span><span className="font-medium">{QUOTE_SELLER_ADDRESS_LINE}</span></div>
            <div className="flex flex-col"><span className="text-xs uppercase tracking-wide text-muted-foreground">Email</span><a href={`mailto:${QUOTE_SELLER.email}`} className="inline-flex items-center gap-1 font-medium text-primary hover:underline"><Mail className="h-3.5 w-3.5" />{QUOTE_SELLER.email}</a></div>
            <div className="flex flex-col"><span className="text-xs uppercase tracking-wide text-muted-foreground">Sito</span><a href={`https://${QUOTE_SELLER.website}`} target="_blank" rel="noreferrer" className="font-medium text-primary hover:underline">{QUOTE_SELLER.website}</a></div>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">{QUOTE_SELLER.tagline}</p>
        </section>
      </main>
    </div>
  )
}
