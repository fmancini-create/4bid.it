import { cn } from "@/lib/utils"
import {
  COMMENT_STATUS_LABELS,
  COMMENT_TYPE_LABELS,
  PROJECT_STATUS_LABELS,
  REVISION_STATUS_LABELS,
  VERSION_STATUS_LABELS,
  type CommentStatus,
  type CommentType,
  type ProjectStatus,
  type RevisionStatus,
  type VersionStatus,
} from "@/lib/project-room/types"

/**
 * Visual language for the workflow states.
 *
 * The labels are NOT redefined here: they are imported from types.ts, which is
 * kept in sync with the database CHECK constraints. Duplicating them would let
 * the UI drift away from the values the database actually accepts.
 *
 * Colour never carries the meaning on its own - every badge renders its Italian
 * label too, so the state stays legible without colour perception.
 */

const BASE = "inline-flex items-center rounded-full border font-semibold"

const NEUTRAL = "bg-muted text-muted-foreground border-border"
const INFO = "bg-primary-blue/10 text-blue-grey border-primary-blue/40"
const PENDING = "bg-yellow/15 text-brand-navy border-yellow/60"
const OK = "bg-state-approved/10 text-state-approved border-state-approved/30"
const NO = "bg-state-rejected/10 text-state-rejected border-state-rejected/30"

const PROJECT_TONE: Record<ProjectStatus, string> = {
  bozza: NEUTRAL,
  in_revisione: INFO,
  approvato: OK,
  archiviato: NEUTRAL,
}

export function ProjectStatusBadge({ status, className }: { status: ProjectStatus; className?: string }) {
  return (
    <span className={cn(BASE, "px-2.5 py-1 text-xs", PROJECT_TONE[status] ?? NEUTRAL, className)}>
      {PROJECT_STATUS_LABELS[status] ?? status}
    </span>
  )
}

const VERSION_TONE: Record<VersionStatus, string> = {
  bozza: NEUTRAL,
  in_revisione: INFO,
  approvata: OK,
  archiviata: NEUTRAL,
}

export function VersionStatusBadge({ status, className }: { status: VersionStatus; className?: string }) {
  return (
    <span className={cn(BASE, "px-2 py-0.5 text-[11px]", VERSION_TONE[status] ?? NEUTRAL, className)}>
      {VERSION_STATUS_LABELS[status] ?? status}
    </span>
  )
}

const COMMENT_TONE: Record<CommentStatus, string> = {
  aperto: PENDING,
  da_valutare: PENDING,
  approvato: OK,
  respinto: NO,
  risolto: OK,
}

export function CommentStatusBadge({ status, className }: { status: CommentStatus; className?: string }) {
  return (
    <span className={cn(BASE, "px-2 py-0.5 text-[11px]", COMMENT_TONE[status] ?? PENDING, className)}>
      {COMMENT_STATUS_LABELS[status] ?? status}
    </span>
  )
}

const REVISION_TONE: Record<RevisionStatus, string> = {
  da_valutare: PENDING,
  approvato: OK,
  respinto: NO,
  incorporato: INFO,
}

export function RevisionStatusBadge({ status, className }: { status: RevisionStatus; className?: string }) {
  return (
    <span className={cn(BASE, "px-2 py-0.5 text-[11px]", REVISION_TONE[status] ?? PENDING, className)}>
      {REVISION_STATUS_LABELS[status] ?? status}
    </span>
  )
}

/** The kind of remark, which is orthogonal to its state. */
export function CommentTypeBadge({ type, className }: { type: CommentType; className?: string }) {
  return (
    <span className={cn(BASE, "px-2 py-0.5 text-[11px] bg-secondary text-secondary-foreground border-border", className)}>
      {COMMENT_TYPE_LABELS[type] ?? type}
    </span>
  )
}
