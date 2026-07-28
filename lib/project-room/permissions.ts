/**
 * Capability model for the Project Room.
 *
 * This is the single source of truth used by BOTH the UI (to decide what to
 * render) and the API routes (to decide what to allow). It intentionally
 * mirrors the SQL helper functions `pr_can_view_project`,
 * `pr_can_comment_project` and `pr_can_manage_project`.
 *
 * It is a convenience layer, never the only line of defence: the database
 * enforces the same rules through RLS and column privileges, so a bug here
 * cannot by itself expose or corrupt data.
 */

import type { ProjectRole } from "./types"

const RANK: Record<ProjectRole, number> = {
  reader: 0,
  commenter: 1,
  reviewer: 2,
  project_manager: 3,
  admin: 4,
}

export function atLeast(role: ProjectRole, minimum: ProjectRole): boolean {
  return RANK[role] >= RANK[minimum]
}

/** Read the document and the discussion. */
export function canView(role: ProjectRole): boolean {
  return true // holding any role implies read access
}

/** Post comments and replies. */
export function canComment(role: ProjectRole): boolean {
  return atLeast(role, "commenter")
}

/** Submit a proposed rewording. */
export function canProposeRevision(role: ProjectRole): boolean {
  return atLeast(role, "commenter")
}

/**
 * Approve or reject a revision proposal, and resolve someone else's comment.
 * This is a decision about the document, hence reviewer and above.
 */
export function canReviewRevision(role: ProjectRole): boolean {
  return atLeast(role, "reviewer")
}

/** Change a comment's status (resolve / reopen) on any author's comment. */
export function canModerateComments(role: ProjectRole): boolean {
  return atLeast(role, "reviewer")
}

/** Upload a new version, edit metadata, change document status. */
export function canManageDocuments(role: ProjectRole): boolean {
  return atLeast(role, "project_manager")
}

/** Invite people and change their role on the project. */
export function canManageMembers(role: ProjectRole): boolean {
  return atLeast(role, "project_manager")
}

/** See the project's audit trail. */
export function canViewAudit(role: ProjectRole): boolean {
  return atLeast(role, "project_manager")
}

/**
 * Download the original PDF.
 *
 * Two conditions, deliberately combined: the per-member `can_download` flag
 * is what a project manager grants case by case, while managers and admins
 * always retain it (they are the ones producing the file).
 */
export function canDownload(role: ProjectRole, memberCanDownload: boolean): boolean {
  return memberCanDownload || atLeast(role, "project_manager")
}

/**
 * Editing one's own comment. Authors may correct their own wording within a
 * short window; after that the comment is part of the shared record.
 */
export const COMMENT_EDIT_WINDOW_MS = 15 * 60 * 1000

export function canEditComment(params: {
  role: ProjectRole
  authorId: string
  viewerId: string
  createdAt: string
  hasReplies: boolean
}): boolean {
  const { role, authorId, viewerId, createdAt, hasReplies } = params
  if (authorId !== viewerId) return false
  if (hasReplies) return false // someone already answered it
  if (atLeast(role, "project_manager")) return true
  return Date.now() - new Date(createdAt).getTime() < COMMENT_EDIT_WINDOW_MS
}

/**
 * Deleting a comment is always a soft delete, so the thread keeps its shape.
 * Authors may retract their own; managers may remove anything.
 */
export function canDeleteComment(params: {
  role: ProjectRole
  authorId: string
  viewerId: string
}): boolean {
  return params.authorId === params.viewerId || atLeast(params.role, "project_manager")
}
