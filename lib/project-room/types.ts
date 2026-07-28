/**
 * 4Bid Project Room - domain types.
 *
 * These mirror the `pr_*` tables one-to-one. The `pr_` prefix keeps the
 * module isolated inside a database shared with the rest of 4bid.it.
 */

export const PROJECT_ROLES = ["reader", "commenter", "reviewer", "project_manager", "admin"] as const
export type ProjectRole = (typeof PROJECT_ROLES)[number]

export const ORG_ROLES = ["admin", "member"] as const
export type OrgRole = (typeof ORG_ROLES)[number]

export const PROJECT_STATUSES = ["bozza", "in_revisione", "approvato", "archiviato"] as const
export type ProjectStatus = (typeof PROJECT_STATUSES)[number]

export const VERSION_STATUSES = ["bozza", "in_revisione", "approvata", "archiviata"] as const
export type VersionStatus = (typeof VERSION_STATUSES)[number]

export const COMMENT_TYPES = ["commento", "correzione", "proposta", "domanda", "decisione"] as const
export type CommentType = (typeof COMMENT_TYPES)[number]

export const COMMENT_STATUSES = ["aperto", "da_valutare", "approvato", "respinto", "risolto"] as const
export type CommentStatus = (typeof COMMENT_STATUSES)[number]

export const REVISION_STATUSES = ["da_valutare", "approvato", "respinto", "incorporato"] as const
export type RevisionStatus = (typeof REVISION_STATUSES)[number]

export const ACCESS_REQUEST_STATUSES = ["pending", "approved", "rejected"] as const
export type AccessRequestStatus = (typeof ACCESS_REQUEST_STATUSES)[number]

export interface Profile {
  id: string
  email: string | null
  first_name: string | null
  last_name: string | null
  company: string | null
  job_role: string | null
  avatar_url: string | null
}

export interface ProjectSummary {
  id: string
  organization_id: string
  client_id: string | null
  name: string
  slug: string
  description: string | null
  status: ProjectStatus
  created_at: string
  updated_at: string
  client_name: string | null
  /** Effective role of the current viewer, resolved server-side. */
  role: ProjectRole
  can_download: boolean
  document_count: number
  open_comment_count: number
}

export interface DocumentVersion {
  id: string
  document_id: string
  version_number: number
  version_label: string
  file_path: string | null
  file_name: string | null
  file_size: number | null
  page_count: number | null
  status: VersionStatus
  changelog: string | null
  uploaded_by: string | null
  created_at: string
}

export interface ProjectDocument {
  id: string
  project_id: string
  title: string
  description: string | null
  status: ProjectStatus
  current_version_id: string | null
  created_at: string
  updated_at: string
  versions: DocumentVersion[]
}

export interface Comment {
  id: string
  project_id: string
  document_id: string
  version_id: string | null
  page_number: number | null
  comment_type: CommentType
  status: CommentStatus
  content: string
  author_id: string
  parent_id: string | null
  assigned_to: string | null
  resolved_by: string | null
  resolved_at: string | null
  deleted_at: string | null
  created_at: string
  updated_at: string
  author: Profile | null
  replies?: Comment[]
}

export interface RevisionProposal {
  id: string
  project_id: string
  document_id: string
  comment_id: string | null
  page_number: number | null
  original_text: string | null
  proposed_text: string
  status: RevisionStatus
  review_note: string | null
  reviewed_by: string | null
  reviewed_at: string | null
  created_by: string
  created_at: string
  author: Profile | null
}

export interface AccessRequest {
  id: string
  first_name: string
  last_name: string
  email: string
  company: string | null
  phone: string | null
  message: string | null
  status: AccessRequestStatus
  review_note: string | null
  reviewed_at: string | null
  created_at: string
}

export interface Invitation {
  id: string
  project_id: string
  email: string
  role: ProjectRole
  can_download: boolean
  expires_at: string
  accepted_at: string | null
  revoked_at: string | null
  created_at: string
  project_name?: string | null
}

export interface Notification {
  id: string
  project_id: string | null
  type: string
  title: string
  body: string | null
  link: string | null
  read_at: string | null
  created_at: string
}

export interface AuditLogEntry {
  id: string
  project_id: string | null
  user_id: string | null
  action: string
  entity_type: string | null
  entity_id: string | null
  metadata: Record<string, unknown>
  created_at: string
  actor: Profile | null
}

/** Human-readable labels. The whole reserved area is Italian. */
export const ROLE_LABELS: Record<ProjectRole, string> = {
  reader: "Lettore",
  commenter: "Commentatore",
  reviewer: "Revisore",
  project_manager: "Project manager",
  admin: "Amministratore",
}

export const ROLE_DESCRIPTIONS: Record<ProjectRole, string> = {
  reader: "Puo consultare i documenti senza intervenire.",
  commenter: "Puo consultare e commentare i documenti.",
  reviewer: "Puo commentare e valutare le proposte di revisione.",
  project_manager: "Gestisce documenti, versioni e inviti del progetto.",
  admin: "Controllo completo sul progetto.",
}

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  bozza: "Bozza",
  in_revisione: "In revisione",
  approvato: "Approvato",
  archiviato: "Archiviato",
}

export const VERSION_STATUS_LABELS: Record<VersionStatus, string> = {
  bozza: "Bozza",
  in_revisione: "In revisione",
  approvata: "Approvata",
  archiviata: "Archiviata",
}

export const COMMENT_TYPE_LABELS: Record<CommentType, string> = {
  commento: "Commento",
  correzione: "Correzione",
  proposta: "Proposta",
  domanda: "Domanda",
  decisione: "Decisione",
}

export const COMMENT_STATUS_LABELS: Record<CommentStatus, string> = {
  aperto: "Aperto",
  da_valutare: "Da valutare",
  approvato: "Approvato",
  respinto: "Respinto",
  risolto: "Risolto",
}

export const REVISION_STATUS_LABELS: Record<RevisionStatus, string> = {
  da_valutare: "Da valutare",
  approvato: "Approvata",
  respinto: "Respinta",
  incorporato: "Incorporata",
}

/** Display name that degrades gracefully instead of showing a raw UUID. */
export function displayName(profile: Profile | null | undefined): string {
  if (!profile) return "Utente rimosso"
  const full = [profile.first_name, profile.last_name].filter(Boolean).join(" ").trim()
  if (full) return full
  return profile.email ?? "Utente"
}

export function initials(profile: Profile | null | undefined): string {
  if (!profile) return "?"
  const first = profile.first_name?.trim()?.[0]
  const last = profile.last_name?.trim()?.[0]
  if (first || last) return `${first ?? ""}${last ?? ""}`.toUpperCase()
  return (profile.email?.trim()?.[0] ?? "?").toUpperCase()
}
