/**
 * Server-side authorization for the Project Room.
 *
 * Design note: every guard returns a discriminated union rather than throwing
 * or returning `null`. Callers must narrow on `ok` before touching the data,
 * so "forgetting the check" becomes a type error instead of a silent leak.
 */

import { createClient, createAdminClient } from "@/lib/supabase/server"
import type { ProjectRole } from "./types"

export interface AuthedUser {
  id: string
  email: string | null
}

export type Guard<T> = { ok: true; data: T } | { ok: false; status: number; error: string }

function deny(status: number, error: string): { ok: false; status: number; error: string } {
  return { ok: false, status, error }
}

/** The signed-in user, or a 401. */
export async function requireUser(): Promise<Guard<AuthedUser>> {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    return deny(401, "Autenticazione richiesta.")
  }
  return { ok: true, data: { id: data.user.id, email: data.user.email ?? null } }
}

export interface ProjectAccess {
  user: AuthedUser
  projectId: string
  role: ProjectRole
  canDownload: boolean
  isOrgAdmin: boolean
}

/**
 * Resolve the caller's effective role on a project.
 *
 * The role is read with the service role client on purpose: RLS is already
 * proven to isolate tenants, but this lookup must be able to distinguish
 * "you are not a member" (403) from "this project does not exist" (404),
 * which an RLS-filtered read collapses into a single empty result.
 */
export async function requireProjectAccess(projectId: string): Promise<Guard<ProjectAccess>> {
  const auth = await requireUser()
  if (!auth.ok) return auth

  if (!isUuid(projectId)) {
    return deny(400, "Identificativo progetto non valido.")
  }

  const admin = createAdminClient()

  const { data: project, error: projectError } = await admin
    .from("pr_projects")
    .select("id, organization_id")
    .eq("id", projectId)
    .maybeSingle()

  if (projectError) {
    console.log("[v0] requireProjectAccess project lookup failed:", projectError.message)
    return deny(500, "Impossibile verificare il progetto.")
  }
  if (!project) {
    return deny(404, "Progetto non trovato.")
  }

  // Organization admins are implicitly admin on every project of the org.
  const { data: orgMembership } = await admin
    .from("pr_organization_members")
    .select("role")
    .eq("organization_id", project.organization_id)
    .eq("user_id", auth.data.id)
    .maybeSingle()

  const isOrgAdmin = orgMembership?.role === "admin"

  const { data: membership } = await admin
    .from("pr_project_members")
    .select("role, can_download")
    .eq("project_id", projectId)
    .eq("user_id", auth.data.id)
    .maybeSingle()

  if (!isOrgAdmin && !membership) {
    // Deliberately 404-shaped message: a non-member should not learn that a
    // project with this id exists.
    return deny(404, "Progetto non trovato.")
  }

  const role: ProjectRole = isOrgAdmin ? "admin" : (membership!.role as ProjectRole)

  return {
    ok: true,
    data: {
      user: auth.data,
      projectId,
      role,
      canDownload: isOrgAdmin ? true : Boolean(membership!.can_download),
      isOrgAdmin,
    },
  }
}

/** Organization-level admin, used by the /admin area. */
export async function requireOrgAdmin(): Promise<Guard<AuthedUser & { organizationId: string }>> {
  const auth = await requireUser()
  if (!auth.ok) return auth

  const admin = createAdminClient()
  const { data, error } = await admin
    .from("pr_organization_members")
    .select("organization_id")
    .eq("user_id", auth.data.id)
    .eq("role", "admin")
    .maybeSingle()

  if (error) {
    console.log("[v0] requireOrgAdmin lookup failed:", error.message)
    return deny(500, "Impossibile verificare i permessi.")
  }
  if (!data) {
    return deny(403, "Permessi insufficienti.")
  }

  return { ok: true, data: { ...auth.data, organizationId: data.organization_id } }
}

/**
 * Resolve a document to its project, then authorize.
 * Saves every document-scoped route from re-implementing the join.
 */
export async function requireDocumentAccess(
  documentId: string,
): Promise<Guard<ProjectAccess & { documentId: string }>> {
  if (!isUuid(documentId)) {
    return deny(400, "Identificativo documento non valido.")
  }

  const admin = createAdminClient()
  const { data: doc, error } = await admin
    .from("pr_documents")
    .select("id, project_id")
    .eq("id", documentId)
    .maybeSingle()

  if (error) {
    console.log("[v0] requireDocumentAccess lookup failed:", error.message)
    return deny(500, "Impossibile verificare il documento.")
  }
  if (!doc) return deny(404, "Documento non trovato.")

  const access = await requireProjectAccess(doc.project_id)
  if (!access.ok) return access

  return { ok: true, data: { ...access.data, documentId: doc.id } }
}

/** Same for a version, which is the unit the viewer actually loads. */
export async function requireVersionAccess(
  versionId: string,
): Promise<Guard<ProjectAccess & { documentId: string; versionId: string; filePath: string | null }>> {
  if (!isUuid(versionId)) {
    return deny(400, "Identificativo versione non valido.")
  }

  const admin = createAdminClient()
  // Two foreign keys connect these tables (`versions.document_id` and
  // `documents.current_version_id`), so a PostgREST embed is ambiguous and
  // errors out. The document is resolved with a second explicit read instead.
  const { data: version, error } = await admin
    .from("pr_document_versions")
    .select("id, document_id, file_path")
    .eq("id", versionId)
    .maybeSingle()

  if (error) {
    console.log("[v0] requireVersionAccess lookup failed:", error.message)
    return deny(500, "Impossibile verificare la versione.")
  }
  if (!version) return deny(404, "Versione non trovata.")

  const { data: document, error: documentError } = await admin
    .from("pr_documents")
    .select("project_id")
    .eq("id", version.document_id)
    .maybeSingle()

  if (documentError) {
    console.log("[v0] requireVersionAccess document lookup failed:", documentError.message)
    return deny(500, "Impossibile verificare la versione.")
  }
  if (!document) return deny(404, "Versione non trovata.")

  const access = await requireProjectAccess(document.project_id)
  if (!access.ok) return access

  return {
    ok: true,
    data: {
      ...access.data,
      documentId: version.document_id,
      versionId: version.id,
      filePath: version.file_path,
    },
  }
}

export function isUuid(value: string | null | undefined): boolean {
  if (!value) return false
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
}
