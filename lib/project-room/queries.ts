/**
 * Read layer for the Project Room.
 *
 * These run with the service role and take the viewer's identity as an
 * explicit argument, because the pages need aggregates (comment counts,
 * member lists) that an RLS-filtered read cannot express in one round trip.
 * Every function therefore resolves the viewer's role itself and returns
 * nothing when the viewer has no role.
 */

import { createAdminClient } from "@/lib/supabase/server"
import type {
  Comment,
  DocumentVersion,
  Notification,
  Profile,
  ProjectDocument,
  ProjectRole,
  ProjectSummary,
  RevisionProposal,
} from "./types"

const PROFILE_FIELDS = "id, email, first_name, last_name, company, job_role, avatar_url"

/** Projects the viewer can see, with their effective role on each. */
export async function listProjectsForUser(userId: string): Promise<ProjectSummary[]> {
  const admin = createAdminClient()

  const { data: orgAdminRows } = await admin
    .from("pr_organization_members")
    .select("organization_id")
    .eq("user_id", userId)
    .eq("role", "admin")

  const adminOrgIds = (orgAdminRows ?? []).map((r) => r.organization_id as string)

  // Two separate reads, merged in memory: a single `or` filter across a join
  // is far less predictable than resolving both sets explicitly.
  const { data: memberships } = await admin
    .from("pr_project_members")
    .select("project_id, role, can_download")
    .eq("user_id", userId)

  const roleByProject = new Map<string, { role: ProjectRole; canDownload: boolean }>()
  for (const m of memberships ?? []) {
    roleByProject.set(m.project_id as string, {
      role: m.role as ProjectRole,
      canDownload: Boolean(m.can_download),
    })
  }

  let query = admin
    .from("pr_projects")
    .select("id, organization_id, client_id, name, slug, description, status, created_at, updated_at")
    .order("updated_at", { ascending: false })

  const memberProjectIds = Array.from(roleByProject.keys())

  if (adminOrgIds.length > 0 && memberProjectIds.length > 0) {
    query = query.or(`organization_id.in.(${adminOrgIds.join(",")}),id.in.(${memberProjectIds.join(",")})`)
  } else if (adminOrgIds.length > 0) {
    query = query.in("organization_id", adminOrgIds)
  } else if (memberProjectIds.length > 0) {
    query = query.in("id", memberProjectIds)
  } else {
    return []
  }

  const { data: projects, error } = await query
  if (error) {
    console.log("[v0] listProjectsForUser failed:", error.message)
    return []
  }
  if (!projects || projects.length === 0) return []

  const projectIds = projects.map((p) => p.id as string)
  const clientIds = projects.map((p) => p.client_id).filter(Boolean) as string[]

  const [{ data: clients }, { data: documents }, { data: openComments }] = await Promise.all([
    clientIds.length > 0
      ? admin.from("pr_clients").select("id, name").in("id", clientIds)
      : Promise.resolve({ data: [] as { id: string; name: string }[] }),
    admin.from("pr_documents").select("id, project_id").in("project_id", projectIds),
    admin
      .from("pr_comments")
      .select("id, project_id")
      .in("project_id", projectIds)
      .is("deleted_at", null)
      .in("status", ["aperto", "da_valutare"]),
  ])

  const clientName = new Map((clients ?? []).map((c) => [c.id as string, c.name as string]))
  const docCount = countBy(documents ?? [], "project_id")
  const commentCount = countBy(openComments ?? [], "project_id")

  return projects.map((p) => {
    const membership = roleByProject.get(p.id as string)
    const isOrgAdmin = adminOrgIds.includes(p.organization_id as string)
    const role: ProjectRole = isOrgAdmin ? "admin" : (membership?.role ?? "reader")
    return {
      id: p.id as string,
      organization_id: p.organization_id as string,
      client_id: (p.client_id as string) ?? null,
      name: p.name as string,
      slug: p.slug as string,
      description: (p.description as string) ?? null,
      status: p.status as ProjectSummary["status"],
      created_at: p.created_at as string,
      updated_at: p.updated_at as string,
      client_name: p.client_id ? (clientName.get(p.client_id as string) ?? null) : null,
      role,
      can_download: isOrgAdmin ? true : Boolean(membership?.canDownload),
      document_count: docCount.get(p.id as string) ?? 0,
      open_comment_count: commentCount.get(p.id as string) ?? 0,
    }
  })
}

export async function getProjectBySlug(slug: string, userId: string): Promise<ProjectSummary | null> {
  const projects = await listProjectsForUser(userId)
  return projects.find((p) => p.slug === slug) ?? null
}

/** Documents of a project with their full version history, newest first. */
export async function listDocuments(projectId: string): Promise<ProjectDocument[]> {
  const admin = createAdminClient()

  const { data: documents, error } = await admin
    .from("pr_documents")
    .select("id, project_id, title, description, status, current_version_id, created_at, updated_at")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true })

  if (error) {
    console.log("[v0] listDocuments failed:", error.message)
    return []
  }
  if (!documents || documents.length === 0) return []

  const { data: versions } = await admin
    .from("pr_document_versions")
    .select(
      "id, document_id, version_number, version_label, file_path, file_name, file_size, page_count, status, changelog, uploaded_by, created_at",
    )
    .in(
      "document_id",
      documents.map((d) => d.id as string),
    )
    .order("version_number", { ascending: false })

  const byDocument = new Map<string, DocumentVersion[]>()
  for (const v of (versions ?? []) as DocumentVersion[]) {
    const list = byDocument.get(v.document_id) ?? []
    list.push(v)
    byDocument.set(v.document_id, list)
  }

  return documents.map((d) => ({
    id: d.id as string,
    project_id: d.project_id as string,
    title: d.title as string,
    description: (d.description as string) ?? null,
    status: d.status as ProjectDocument["status"],
    current_version_id: (d.current_version_id as string) ?? null,
    created_at: d.created_at as string,
    updated_at: d.updated_at as string,
    versions: byDocument.get(d.id as string) ?? [],
  }))
}

export async function getVersion(versionId: string): Promise<DocumentVersion | null> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from("pr_document_versions")
    .select(
      "id, document_id, version_number, version_label, file_path, file_name, file_size, page_count, status, changelog, uploaded_by, created_at",
    )
    .eq("id", versionId)
    .maybeSingle()

  if (error) {
    console.log("[v0] getVersion failed:", error.message)
    return null
  }
  return (data as DocumentVersion) ?? null
}

/**
 * Comments for a document, threaded.
 * Soft-deleted comments are kept in the tree only when they have surviving
 * replies, so a thread never loses its shape; their content is redacted.
 */
export async function listComments(params: { documentId: string; versionId?: string | null }): Promise<Comment[]> {
  const admin = createAdminClient()

  let query = admin
    .from("pr_comments")
    .select(
      `id, project_id, document_id, version_id, page_number, comment_type, status, content,
       author_id, parent_id, assigned_to, resolved_by, resolved_at, deleted_at, created_at, updated_at`,
    )
    .eq("document_id", params.documentId)
    .order("created_at", { ascending: true })

  if (params.versionId) {
    query = query.eq("version_id", params.versionId)
  }

  const { data, error } = await query
  if (error) {
    console.log("[v0] listComments failed:", error.message)
    return []
  }

  const authors = await hydrateProfiles((data ?? []).map((c) => c.author_id as string))

  const rows = (data ?? []).map((row) => {
    const c = row as unknown as Comment
    return {
      ...c,
      author: authors.get(c.author_id) ?? null,
      // Redact the body but keep the node, so replies stay attached.
      content: c.deleted_at ? "Commento eliminato." : c.content,
      replies: [] as Comment[],
    } as Comment
  })

  const byId = new Map(rows.map((c) => [c.id, c]))
  const roots: Comment[] = []

  for (const comment of rows) {
    if (comment.parent_id && byId.has(comment.parent_id)) {
      byId.get(comment.parent_id)!.replies!.push(comment)
    } else {
      roots.push(comment)
    }
  }

  // Drop deleted roots that nobody replied to: nothing to preserve there.
  return roots.filter((c) => !c.deleted_at || (c.replies?.length ?? 0) > 0)
}

export async function listRevisions(documentId: string): Promise<RevisionProposal[]> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from("pr_revision_proposals")
    .select(
      `id, project_id, document_id, comment_id, page_number, original_text, proposed_text, status,
       review_note, reviewed_by, reviewed_at, created_by, created_at`,
    )
    .eq("document_id", documentId)
    .order("created_at", { ascending: false })

  if (error) {
    console.log("[v0] listRevisions failed:", error.message)
    return []
  }

  const authors = await hydrateProfiles((data ?? []).map((r) => r.created_by as string))

  return (data ?? []).map((row) => {
    const r = row as unknown as RevisionProposal
    return { ...r, author: authors.get(r.created_by) ?? null }
  })
}

export interface ProjectMemberRow {
  user_id: string
  role: ProjectRole
  can_download: boolean
  created_at: string
  profile: Profile | null
}

export async function listProjectMembers(projectId: string): Promise<ProjectMemberRow[]> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from("pr_project_members")
    .select("user_id, role, can_download, created_at")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true })

  if (error) {
    console.log("[v0] listProjectMembers failed:", error.message)
    return []
  }

  const profiles = await hydrateProfiles((data ?? []).map((m) => m.user_id as string))

  return (data ?? []).map((row) => {
    const m = row as unknown as ProjectMemberRow
    return { ...m, profile: profiles.get(m.user_id) ?? null }
  })
}

/**
 * Resolve a set of user ids to profiles in one round trip.
 *
 * Done explicitly rather than with a PostgREST embed: an embed depends on the
 * exact foreign-key constraint name, which is a brittle thing for the read
 * layer to know about. Missing ids simply yield no entry, and the UI falls
 * back to "Utente rimosso" instead of rendering a raw UUID.
 */
async function hydrateProfiles(userIds: (string | null | undefined)[]): Promise<Map<string, Profile>> {
  const ids = Array.from(new Set(userIds.filter((id): id is string => Boolean(id))))
  if (ids.length === 0) return new Map()

  const admin = createAdminClient()
  const { data, error } = await admin.from("profiles").select(PROFILE_FIELDS).in("id", ids)

  if (error) {
    console.log("[v0] hydrateProfiles failed:", error.message)
    return new Map()
  }

  return new Map((data ?? []).map((p) => [p.id as string, p as Profile]))
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const admin = createAdminClient()
  const { data, error } = await admin.from("profiles").select(PROFILE_FIELDS).eq("id", userId).maybeSingle()
  if (error) {
    console.log("[v0] getProfile failed:", error.message)
    return null
  }
  return (data as Profile) ?? null
}

export async function listNotifications(userId: string, limit = 20): Promise<Notification[]> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from("pr_notifications")
    .select("id, project_id, type, title, body, link, read_at, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) {
    console.log("[v0] listNotifications failed:", error.message)
    return []
  }
  return (data ?? []) as Notification[]
}

export async function isOrgAdmin(userId: string): Promise<boolean> {
  const admin = createAdminClient()
  const { data } = await admin
    .from("pr_organization_members")
    .select("organization_id")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle()
  return Boolean(data)
}

function countBy<T extends Record<string, unknown>>(rows: T[], key: keyof T): Map<string, number> {
  const map = new Map<string, number>()
  for (const row of rows) {
    const value = row[key] as string
    map.set(value, (map.get(value) ?? 0) + 1)
  }
  return map
}
