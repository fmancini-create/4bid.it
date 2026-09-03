export type QuoteProject = "consulting" | "hotelaccelerator" | "santaddeo" | "hotelprofitai" | "manubot" | "custom"
export type QuoteBillingPeriod = "one_time" | "monthly" | "quarterly" | "yearly"
export type QuoteDiscountType = "percentage" | "fixed"
export type QuotePresentationMode = "classic" | "virtual"

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
  optional?: boolean
  default_selected?: boolean
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
  copy_cc?: string[] | null
  copy_bcc?: string[] | null
  client_vat: string | null
  client_address: string | null
  title: string
  description: string | null
  ai_important_notes?: string | null
  payment_terms: string | null
  contract_terms?: unknown
  accepted_terms?: unknown
  comparison_tables?: unknown
  line_items: QuoteLineItem[]
  total_amount: number | null
  deposit_amount: number | null
  vat_included: boolean
  currency: string
  presentation_mode?: QuotePresentationMode
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
  reminder_count: number
  last_reminder_at: string | null
  acceptance_email_sent_at?: string | null
  payment_confirmation_sent_at?: string | null
  payment_reminder_count?: number
  last_payment_reminder_at?: string | null
  final_notice_sent_at?: string | null
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

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {}
}

/**
 * Alcuni moduli di catalogo sono venduti a un prezzo unitario ma con un minimo
 * per struttura. Recensioni, ad esempio, vale 0,50 EUR/sistemazione/mese con
 * minimo 5 EUR/mese. Il minimo va applicato sul TOTALE della riga, non sul
 * prezzo unitario, e deve valere anche quando il cliente passa all'annuale.
 */
function applyDynamicMinimum(
  item: QuoteLineItem,
  rawListAmount: number,
): number {
  const config = asObject(item.configuration)
  if (config.pricing_model !== "per_accommodation_minimum") return rawListAmount

  const minimumMonthly = Math.max(0, Number(config.minimum_monthly) || 0)
  if (minimumMonthly <= 0) return rawListAmount

  const annualDiscountPct = Math.min(100, Math.max(0, Number(config.annual_discount_pct) || 0))
  let minimum = minimumMonthly
  if (item.billing_period === "quarterly") minimum = minimumMonthly * 3
  else if (item.billing_period === "yearly") minimum = minimumMonthly * 12 * (1 - annualDiscountPct / 100)
  else if (item.billing_period === "one_time") return rawListAmount

  return Math.max(rawListAmount, Math.round(minimum * 100) / 100)
}

export function calculateQuoteLine(item: QuoteLineItem): QuoteLineItem {
  const quantity = Math.max(1, Number(item.quantity) || 1)
  const unitAmount = Number(item.unit_amount ?? item.list_amount ?? item.amount) || 0
  const rawListAmount = unitAmount * quantity
  const listAmount = applyDynamicMinimum(item, rawListAmount)
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