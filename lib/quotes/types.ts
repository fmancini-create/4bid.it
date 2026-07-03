export interface QuoteLineItem {
  description: string
  amount: number
}

export interface QuoteRequestedField {
  key: string
  label: string
  // "credentials" renders two inputs (ID/username + password) on the public page.
  type: "text" | "textarea" | "password" | "credentials" | "email" | "url"
  required: boolean
  help?: string
}

// Billing data the client fills in on the public page, used to issue the invoice.
export interface QuoteBillingDetails {
  company?: string // Ragione sociale / Denominazione
  vat?: string // Partita IVA
  tax_code?: string // Codice Fiscale
  address?: string // Indirizzo sede legale
  zip?: string // CAP
  city?: string // Città
  province?: string // Provincia
  sdi_code?: string // Codice destinatario SDI
  pec?: string // PEC
  reference?: string // Referente amministrativo
}

// Credentials (ID + password) are stored as a JSON string inside the single
// submitted_fields entry for that field key, so submitted_fields stays a
// Record<string, string>. Legacy "password" fields keep their plain value.
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
    // Legacy plain string: treat it as the password.
    return { id: "", password: value }
  }
  return { id: "", password: "" }
}

export type QuoteStatus = "draft" | "sent" | "accepted" | "paid"
export type QuotePaymentMethod = "bonifico" | "card"
export type QuotePaymentStatus = "pending" | "awaiting_transfer" | "paid"

export interface SalesChannelQuote {
  id: string
  quote_number: string | null
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
  billing_details: QuoteBillingDetails
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
  reminder_count: number
  last_reminder_at: string | null
  first_viewed_at: string | null
  last_viewed_at: string | null
  view_count: number
}

export function formatQuoteAmount(amount: number | null | undefined, currency = "eur"): string {
  if (amount == null) return "—"
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount)
}
