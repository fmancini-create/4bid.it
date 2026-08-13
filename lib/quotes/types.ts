export type QuoteProject = "consulting" | "hotelaccelerator" | "santaddeo" | "hotelprofitai" | "manubot" | "custom"
export type QuoteBillingPeriod = "one_time" | "monthly" | "quarterly" | "yearly"
export type QuoteDiscountType = "percentage" | "fixed"

export interface QuoteSupportTerms {
  level?: string
  channels?: string[]
  response_time?: string
  availability?: string
  account_manager?: boolean
  onboarding?: string
  training_hours?: number
  notes?: string
}

export interface QuoteDiscount {
  type: QuoteDiscountType
  value: number
  reason?: string
  duration_months?: number | null
}

export interface QuoteLineItem {
  id?: string
  kind?: "consulting" | "plan" | "module" | "setup" | "service" | "custom"
  project?: QuoteProject
  source_product_id?: string | null
  source_plan_id?: string | null
  catalog_version?: string | null
  name?: string
  description: string
  features?: string[]
  quantity?: number
  unit_amount?: number
  list_amount?: number
  discount?: QuoteDiscount | null
  discount_amount?: number
  amount: number
  billing_period?: QuoteBillingPeriod
  trial_days?: number
  support?: QuoteSupportTerms | null
  configuration?: Record<string, unknown>
  catalog_snapshot?: Record<string, unknown>
  /** If true the customer can include/exclude this item before accepting the quote. */
  optional?: boolean
  /** Initial selection shown to the customer for an optional item. Defaults to true. */
  default_selected?: boolean
  /** Frozen customer choice after acceptance. Mandatory items are always treated as selected. */
  customer_selected?: boolean
}

export interface QuoteRequestedField {
  key: string
  label: string
  type: "text" | "textarea" | "password" | "credentials" | "email" | "url"
  required: boolean
  help?: string
}

export interface QuoteBillingDetails {
  company?: string
  vat?: string
  tax_code?: string
  address?: string
  zip?: string
  city?: string
  province?: string
  sdi_code?: string
  pec?: string
  reference?: string
}

export interface QuoteCredential {
  id: string
  password: string
}

export function encodeCredential(id: string, password: string): string {
  return JSON.stringify({ id: (id || "").trim(), password: (password || "").trim() })
}

export function decodeCredential(value: string | undefined | null): QuoteCredential {
  if (!value) return { id: "", password: "" }
  try {
    const parsed = JSON.parse(value)
    if (parsed && typeof parsed === "object") {
      return { id: String(parsed.id || ""), password: String(parsed.password || "") }
    }
  } catch {
    return { id: "", password: value }
  }
  return { id: "", password: "" }
}

export type QuoteStatus = "draft" | "sent" | "accepted" | "paid"
export type QuotePaymentMethod = "bonifico" | "card"
export type QuotePaymentStatus = "pending" | "awaiting_transfer" | "paid"
export type QuoteProvisioningStatus = "not_required" | "pending" | "processing" | "partial" | "completed" | "failed" | "manual_action"

/** Riepilogo per preventivo degli INOLTRI (copie personali inviate a terzi).
 *  Le visite delle copie inoltrate NON toccano view_count del preventivo: senza
 *  questo riepilogo la lista direbbe "non ancora aperto" anche dopo un inoltro
 *  letto, e l'inoltro stesso risulterebbe invisibile fuori da /admin/quotes/analytics. */
export interface QuoteForwardStats {
  recipients: number
  sent: number
  opened: number
  viewed: number
  emailOpens: number
  pageViews: number
  failed: number
  lastSentAt: string | null
  lastActivityAt: string | null
}

export interface SalesChannelQuote {
  id: string
  quote_number: string | null
  created_at: string
  updated_at: string
  client_name: string
  client_company: string | null
  client_email: string | null
  /** Indirizzi in copia VISIBILE: vengono dichiarati al cliente nell'email. */
  copy_cc?: string[] | null
  /** Indirizzi in copia NASCOSTA: il cliente non ne viene informato. */
  copy_bcc?: string[] | null
  client_vat: string | null
  client_address: string | null
  title: string
  description: string | null
  payment_terms: string | null
  /** Copie delle condizioni: tipizzate come sconosciute per non creare un ciclo con terms.ts; si leggono con parseContractTerms. */
  contract_terms?: unknown
  accepted_terms?: unknown
  /** Tabelle comparative mostrate al cliente: tipizzate come sconosciute per non
   *  creare un ciclo con comparison.ts; si leggono con normalizeQuoteTables. */
  comparison_tables?: unknown
  line_items: QuoteLineItem[]
  total_amount: number | null
  deposit_amount: number | null
  vat_included: boolean
  currency: string
  requested_fields: QuoteRequestedField[]
  submitted_fields: Record<string, string>
  billing_details: QuoteBillingDetails
  submitted_at: string | null
  accepted_at: string | null
  acceptance_name: string | null
  acceptance_ip: string | null
  payment_method: QuotePaymentMethod | null
  payment_status: QuotePaymentStatus | null
  stripe_session_id: string | null
  stripe_customer_id?: string | null
  stripe_subscription_id?: string | null
  paid_at: string | null
  token: string | null
  status: QuoteStatus
  provisioning_status?: QuoteProvisioningStatus
  provisioning_started_at?: string | null
  provisioned_at?: string | null
  sent_at: string | null
  expires_at: string | null
  /** Solleciti di ACCETTAZIONE (prima che il cliente dica di si'). */
  reminder_count: number
  last_reminder_at: string | null
  /** Conferma di accettazione inviata al cliente. */
  acceptance_email_sent_at?: string | null
  /** Conferma di pagamento inviata al cliente: evita doppioni se Stripe rimanda l'evento. */
  payment_confirmation_sent_at?: string | null
  /** Solleciti di PAGAMENTO (dopo l'accettazione): percorso distinto da reminder_count. */
  payment_reminder_count?: number
  last_payment_reminder_at?: string | null
  final_notice_sent_at?: string | null
  /** Decadenza per mancato pagamento: il pagamento resta bloccato finche' un admin non riapre. */
  expired_at?: string | null
  reopened_at?: string | null
  first_viewed_at: string | null
  last_viewed_at: string | null
  view_count: number
}

export function isQuoteLineSelected(item: QuoteLineItem): boolean {
  if (!item.optional) return true
  if (typeof item.customer_selected === "boolean") return item.customer_selected
  return item.default_selected !== false
}

export function calculateQuoteLine(item: QuoteLineItem): QuoteLineItem {
  // Ogni voce moltiplica per la quantita' impostata, incluse setup e servizi
  // una tantum. NOTA: un setup agganciato in automatico a un modulo puo'
  // ereditare la quantita' del modulo padre (n. camere/strutture/operatori) e
  // quindi gonfiarsi; l'operatore deve impostare a mano la quantita' corretta
  // (di norma 1) su quelle righe.
  const quantity = Math.max(1, Number(item.quantity) || 1)
  const unitAmount = Number(item.unit_amount ?? item.list_amount ?? item.amount) || 0
  const listAmount = unitAmount * quantity
  let discountAmount = 0
  if (item.discount?.type === "percentage") {
    discountAmount = listAmount * Math.min(100, Math.max(0, Number(item.discount.value) || 0)) / 100
  } else if (item.discount?.type === "fixed") {
    discountAmount = Math.min(listAmount, Math.max(0, Number(item.discount.value) || 0))
  }
  return {
    ...item,
    quantity,
    unit_amount: unitAmount,
    list_amount: listAmount,
    discount_amount: discountAmount,
    amount: Math.max(0, listAmount - discountAmount),
  }
}

export function calculateQuoteTotal(items: QuoteLineItem[]): number {
  return items.reduce((total, item) => total + (isQuoteLineSelected(item) ? calculateQuoteLine(item).amount : 0), 0)
}

export function formatQuoteAmount(amount: number | null | undefined, currency = "eur"): string {
  if (amount == null) return "—"
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount)
}
