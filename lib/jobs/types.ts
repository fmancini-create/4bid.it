/**
 * Shared types for the corporate "Lavora con noi" (careers) area.
 *
 * These tables are intentionally isolated from the products' operational data:
 * candidatures are never linked to product users/customers.
 */

/** A dynamic, position-specific question rendered in the application form. */
export interface JobExtraField {
  key: string
  label: string
  type: "text" | "textarea" | "select"
  required?: boolean
  options?: string[]
  placeholder?: string
}

export interface JobPosition {
  id: string
  slug: string
  title: string
  department: string | null
  location: string | null
  employment_type: string | null
  badge: string | null
  summary: string | null
  description: string | null
  extra_fields: JobExtraField[]
  is_open: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export type ApplicationStatus =
  | "nuova"
  | "da_valutare"
  | "da_contattare"
  | "colloquio"
  | "interessante"
  | "non_idoneo"
  | "selezionato"

export const APPLICATION_STATUSES: ApplicationStatus[] = [
  "nuova",
  "da_valutare",
  "da_contattare",
  "colloquio",
  "interessante",
  "non_idoneo",
  "selezionato",
]

export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  nuova: "Nuova",
  da_valutare: "Da valutare",
  da_contattare: "Da contattare",
  colloquio: "Colloquio",
  interessante: "Interessante",
  non_idoneo: "Non idoneo",
  selezionato: "Selezionato",
}

/** Tailwind classes for the status badge in the back office. */
export const STATUS_BADGE_CLASSES: Record<ApplicationStatus, string> = {
  nuova: "bg-blue-100 text-blue-800",
  da_valutare: "bg-amber-100 text-amber-800",
  da_contattare: "bg-purple-100 text-purple-800",
  colloquio: "bg-indigo-100 text-indigo-800",
  interessante: "bg-emerald-100 text-emerald-800",
  non_idoneo: "bg-gray-200 text-gray-600",
  selezionato: "bg-green-600 text-white",
}

export interface JobApplication {
  id: string
  position_slug: string | null
  position_title: string | null
  first_name: string
  last_name: string
  email: string
  phone: string | null
  city: string | null
  linkedin_url: string | null
  portfolio_url: string | null
  current_occupation: string | null
  presentation: string | null
  motivation: string | null
  availability: string | null
  preferred_engagement: string | null
  answers: Record<string, string>
  cv_path: string | null
  cv_filename: string | null
  consent: boolean
  status: ApplicationStatus
  admin_notes: string | null
  ip: string | null
  user_agent: string | null
  created_at: string
  updated_at: string
}

/** Sentinel slug used by the spontaneous-application card/flow. */
export const SPONTANEOUS_SLUG = "spontanea"
export const SPONTANEOUS_LABEL = "Candidatura spontanea"
