"use client"

import { useState } from "react"
import { Check, CornerDownRight, Loader2, MessageSquare, MoreHorizontal, Trash2, Undo2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { CommentStatusBadge, CommentTypeBadge } from "@/components/project-room/status-badge"
import { canComment, canDeleteComment, canModerateComments } from "@/lib/project-room/permissions"
import { displayName, initials, type Comment, type ProjectRole } from "@/lib/project-room/types"
import { cn } from "@/lib/utils"

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString("it-IT", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export interface CommentThreadProps {
  comment: Comment
  role: ProjectRole
  viewerId: string
  isBusy: boolean
  onReply: (parentId: string, content: string) => Promise<boolean>
  onStatusChange: (commentId: string, status: "risolto" | "aperto" | "approvato" | "respinto") => void
  onDelete: (commentId: string) => void
  onJumpToPage: (page: number) => void
}

export function CommentThread({
  comment,
  role,
  viewerId,
  isBusy,
  onReply,
  onStatusChange,
  onDelete,
  onJumpToPage,
}: CommentThreadProps) {
  const [isReplying, setIsReplying] = useState(false)
  const [replyText, setReplyText] = useState("")
  const [isSending, setIsSending] = useState(false)

  const isDeleted = Boolean(comment.deleted_at)
  const canModerate = canModerateComments(role)
  const canRemove = !isDeleted && canDeleteComment({ role, authorId: comment.author_id, viewerId })
  const isClosed = comment.status === "risolto" || comment.status === "approvato" || comment.status === "respinto"

  async function submitReply() {
    const text = replyText.trim()
    if (!text || isSending) return
    setIsSending(true)
    const ok = await onReply(comment.id, text)
    setIsSending(false)
    if (ok) {
      setReplyText("")
      setIsReplying(false)
    }
  }

  return (
    <article
      className={cn(
        "rounded-lg border border-border bg-card p-4",
        isClosed && "border-dashed bg-muted/40",
        isDeleted && "opacity-70",
      )}
    >
      <header className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary-blue text-[10px] font-bold text-white"
            aria-hidden="true"
          >
            {initials(comment.author)}
          </span>
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-medium text-foreground">{displayName(comment.author)}</span>
            <span className="text-[11px] text-muted-foreground">{formatWhen(comment.created_at)}</span>
          </div>
        </div>

        {!isDeleted && (canModerate || canRemove) ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="ghost" size="icon" className="size-7" aria-label="Azioni commento">
                <MoreHorizontal className="size-4" aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {canModerate && !isClosed ? (
                <>
                  <DropdownMenuItem onClick={() => onStatusChange(comment.id, "risolto")}>
                    <Check className="mr-2 size-4" aria-hidden="true" />
                    Segna come risolto
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onStatusChange(comment.id, "approvato")}>
                    <Check className="mr-2 size-4" aria-hidden="true" />
                    Approva
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onStatusChange(comment.id, "respinto")}>
                    <Undo2 className="mr-2 size-4" aria-hidden="true" />
                    Respingi
                  </DropdownMenuItem>
                </>
              ) : null}
              {canModerate && isClosed ? (
                <DropdownMenuItem onClick={() => onStatusChange(comment.id, "aperto")}>
                  <Undo2 className="mr-2 size-4" aria-hidden="true" />
                  Riapri
                </DropdownMenuItem>
              ) : null}
              {canRemove ? (
                <DropdownMenuItem onClick={() => onDelete(comment.id)} className="text-destructive">
                  <Trash2 className="mr-2 size-4" aria-hidden="true" />
                  Elimina
                </DropdownMenuItem>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </header>

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <CommentTypeBadge type={comment.comment_type} />
        <CommentStatusBadge status={comment.status} />
        {comment.page_number ? (
          <button
            type="button"
            onClick={() => onJumpToPage(comment.page_number!)}
            className="rounded bg-secondary px-2 py-0.5 text-[11px] font-medium text-secondary-foreground transition-colors hover:bg-primary-blue hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Pag. {comment.page_number}
          </button>
        ) : null}
      </div>

      <p
        className={cn(
          "mt-2 whitespace-pre-wrap text-pretty text-sm leading-relaxed",
          isDeleted ? "italic text-muted-foreground" : "text-foreground",
        )}
      >
        {comment.content}
      </p>

      {comment.replies && comment.replies.length > 0 ? (
        <ul className="mt-3 flex flex-col gap-3 border-l-2 border-border pl-3">
          {comment.replies.map((reply) => (
            <li key={reply.id} className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <CornerDownRight className="size-3 shrink-0 text-muted-foreground" aria-hidden="true" />
                <span className="text-xs font-medium text-foreground">{displayName(reply.author)}</span>
                <span className="text-[11px] text-muted-foreground">{formatWhen(reply.created_at)}</span>
              </div>
              <p
                className={cn(
                  "whitespace-pre-wrap text-pretty pl-5 text-sm leading-relaxed",
                  reply.deleted_at ? "italic text-muted-foreground" : "text-foreground",
                )}
              >
                {reply.content}
              </p>
            </li>
          ))}
        </ul>
      ) : null}

      {canComment(role) && !isDeleted ? (
        <div className="mt-3">
          {isReplying ? (
            <div className="flex flex-col gap-2">
              <Textarea
                value={replyText}
                onChange={(event) => setReplyText(event.target.value)}
                onKeyDown={(event) => {
                  // Enter submits, but never while an IME is composing.
                  if (
                    event.key === "Enter" &&
                    !event.shiftKey &&
                    !event.nativeEvent.isComposing &&
                    event.keyCode !== 229
                  ) {
                    event.preventDefault()
                    void submitReply()
                  }
                }}
                placeholder="Scrivi una risposta"
                rows={3}
                maxLength={5000}
                className="text-sm"
              />
              <div className="flex items-center gap-2">
                <Button type="button" size="sm" onClick={submitReply} disabled={isSending || !replyText.trim()}>
                  {isSending ? <Loader2 className="mr-2 size-3.5 animate-spin" aria-hidden="true" /> : null}
                  Rispondi
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setIsReplying(false)
                    setReplyText("")
                  }}
                >
                  Annulla
                </Button>
              </div>
            </div>
          ) : (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => setIsReplying(true)}
              disabled={isBusy}
            >
              <MessageSquare className="mr-1.5 size-3.5" aria-hidden="true" />
              Rispondi
            </Button>
          )}
        </div>
      ) : null}
    </article>
  )
}
