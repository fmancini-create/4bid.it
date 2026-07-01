export interface QuoteLineItem {
  description: string
  amount: number
}

export interface QuoteRequestedField {
  key: string
  label: string
  type: "text" | "textarea" | "password" | "email" | "url"
  required: boolean
  help?: string
}

export type QuoteStatus = "draft" | "sent" | "accepted" | "paid"
export type QuotePaymentMethod = "bonifico" | "card"
export type QuotePaymentStatus = "pending" | "awaiting_transfer" | "paid"

export interface SalesChannelQuote {
  id: string
  created_at: string
  updated_at: string
  client_name: string
  client_company: string | null
  client_email: string | null
  client_vat: string | null
  client_address: string | null
  title: string
  description: string | null
  payment_terms: string | null
  line_items: QuoteLineItem[]
  total_amount: number | null
  deposit_amount: number | null
  vat_included: boolean
  currency: string
  requested_fields: QuoteRequestedField[]
  submitted_fields: Record<string, string>
  submitted_at: string | null
  accepted_at: string | null
  acceptance_name: string | null
  acceptance_ip: string | null
  payment_method: QuotePaymentMethod | null
  payment_status: QuotePaymentStatus | null
  stripe_session_id: string | null
  paid_at: string | null
  token: string | null
  status: QuoteStatus
  sent_at: string | null
  expires_at: string | null
}

export function formatQuoteAmount(amount: number | null | undefined, currency = "eur"): string {
  if (amount == null) return "—"
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount)
}
