"use client"

import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import { Download, FileDiff, FileText, History, Loader2, MessageSquarePlus, Quote } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CommentThread } from "@/components/project-room/comment-thread"
import { RevisionStatusBadge, VersionStatusBadge } from "@/components/project-room/status-badge"
import {
  COMMENT_TYPE_LABELS,
  COMMENT_TYPES,
  displayName,
  type Comment,
  type CommentType,
  type DocumentVersion,
  type ProjectDocument,
  type ProjectRole,
  type RevisionProposal,
} from "@/lib/project-room/types"
import { canComment, canDownload, canProposeRevision, canReviewRevision } from "@/lib/project-room/permissions"

/**
 * pdf.js touches DOM globals as soon as it is imported, so the viewer is loaded
 * client-side only. Rendering it on the server would not merely be wasted work,
 * it throws.
 */
const PdfViewer = dynamic(() => import("@/components/project-room/pdf-viewer").then((m) => m.PdfViewer), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-[24rem] items-center justify-center rounded-lg border border-border bg-card">
      <span className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        Caricamento visualizzatore
      </span>
    </div>
  ),
})

export interface DocumentWorkspaceProps {
  document: ProjectDocument
  activeVersion: DocumentVersion
  comments: Comment[]
  revisions: RevisionProposal[]
  role: ProjectRole
  memberCanDownload: boolean
  viewerId: string
}

export function DocumentWorkspace({
  document,
  activeVersion,
  comments,
  revisions,
  role,
  memberCanDownload,
  viewerId,
}: DocumentWorkspaceProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [currentPage, setCurrentPage] = useState(1)
  const [requestedPage, setRequestedPage] = useState<number | null>(null)
  const [selection, setSelection] = useState<{ text: string; page: number } | null>(null)

  const [commentText, setCommentText] = useState("")
  const [commentType, setCommentType] = useState<CommentType>("commento")
  const [anchorToPage, setAnchorToPage] = useState(true)
  const [proposalText, setProposalText] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const mayComment = canComment(role)
  const mayPropose = canProposeRevision(role)
  const mayReview = canReviewRevision(role)
  const mayDownload = canDownload(role, memberCanDownload)

  const openComments = useMemo(
    () => comments.filter((c) => c.status === "aperto" || c.status === "da_valutare").length,
    [comments],
  )
  const pendingRevisions = useMemo(() => revisions.filter((r) => r.status === "da_valutare").length, [revisions])

  /** One place where every mutation is sent, so error handling is uniform. */
  async function send(url: string, method: "POST" | "PATCH", body: unknown): Promise<boolean> {
    setError(null)
    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null
        setError(data?.error ?? "Operazione non riuscita. Riprova.")
        return false
      }
      // The page is a server component: refreshing is what makes the new state
      // visible, and it keeps a single source of truth for the data.
      startTransition(() => router.refresh())
      return true
    } catch {
      setError("Errore di rete. Verifica la connessione e riprova.")
      return false
    }
  }

  async function submitComment() {
    const content = commentText.trim()
    if (!content || isSubmitting) return
    setIsSubmitting(true)
    const ok = await send("/api/project-room/comments", "POST", {
      document_id: document.id,
      version_id: activeVersion.id,
      page_number: anchorToPage ? currentPage : null,
      comment_type: commentType,
      content,
    })
    setIsSubmitting(false)
    if (ok) setCommentText("")
  }

  async function submitProposal() {
    const proposed = proposalText.trim()
    if (!proposed || isSubmitting) return
    setIsSubmitting(true)
    const ok = await send("/api/project-room/revisions", "POST", {
      document_id: document.id,
      page_number: selection?.page ?? currentPage,
      original_text: selection?.text ?? null,
      proposed_text: proposed,
    })
    setIsSubmitting(false)
    if (ok) {
      setProposalText("")
      setSelection(null)
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_26rem]">
      <div className="flex min-w-0 flex-col gap-3">
        {activeVersion.file_path ? (
          <PdfViewer
            versionId={activeVersion.id}
            requestedPage={requestedPage}
            onPageChange={setCurrentPage}
            onTextSelect={setSelection}
          />
        ) : (
          // No file has been uploaded for this version yet. Mounting the viewer
          // here would fetch, 404, and then blame the user's session ("accesso
          // scaduto") for something that is simply not there.
          <div className="flex min-h-[24rem] flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-card px-6 text-center">
            <FileText className="size-6 text-muted-foreground" aria-hidden="true" />
            <p className="text-sm font-medium text-foreground">Nessun file caricato per questa versione</p>
            <p className="max-w-sm text-xs leading-relaxed text-muted-foreground">
              La versione {activeVersion.version_label} e registrata, ma il documento non e ancora stato caricato.
              Commenti e revisioni restano disponibili e verranno collegati al file appena sara presente.
            </p>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>
            {activeVersion.version_label}
            {activeVersion.file_name ? ` · ${activeVersion.file_name}` : ""}
          </span>
          {!activeVersion.file_path ? null : mayDownload ? (
            <Button asChild variant="outline" size="sm">
              <a href={`/api/project-room/versions/${activeVersion.id}/file?download=1`}>
                <Download className="mr-2 size-4" aria-hidden="true" />
                Scarica PDF
              </a>
            </Button>
          ) : (
            <span className="italic">Download non consentito per il tuo ruolo.</span>
          )}
        </div>
      </div>

      <aside className="flex min-w-0 flex-col">
        <Tabs defaultValue="commenti" className="flex min-h-0 flex-col">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="commenti" className="text-xs sm:text-sm">
              Commenti{openComments > 0 ? ` (${openComments})` : ""}
            </TabsTrigger>
            <TabsTrigger value="revisioni" className="text-xs sm:text-sm">
              Revisioni{pendingRevisions > 0 ? ` (${pendingRevisions})` : ""}
            </TabsTrigger>
            <TabsTrigger value="versioni" className="text-xs sm:text-sm">
              Versioni
            </TabsTrigger>
          </TabsList>

            {error ? (
              <p
                role="alert"
                className="mt-3 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              >
                {error}
              </p>
            ) : null}

          {/* ---------------- Comments ---------------- */}
          <TabsContent value="commenti" className="mt-3 flex flex-col gap-4">
            {mayComment ? (
              <div className="flex flex-col gap-2 rounded-lg border border-border bg-card p-4">
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <Label htmlFor="comment-type" className="text-xs">
                      Tipo
                    </Label>
                    <Select value={commentType} onValueChange={(value) => setCommentType(value as CommentType)}>
                      <SelectTrigger id="comment-type" className="mt-1 h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {COMMENT_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {COMMENT_TYPE_LABELS[type]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Textarea
                  value={commentText}
                  onChange={(event) => setCommentText(event.target.value)}
                  placeholder="Scrivi un commento sul documento"
                  rows={4}
                  maxLength={5000}
                  className="text-sm"
                />

                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={anchorToPage}
                    onChange={(event) => setAnchorToPage(event.target.checked)}
                    className="size-3.5 rounded border-border"
                  />
                  Collega alla pagina {currentPage}
                </label>

                <Button
                  type="button"
                  size="sm"
                  onClick={submitComment}
                  disabled={isSubmitting || !commentText.trim()}
                  className="self-start"
                >
                  {isSubmitting ? (
                    <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <MessageSquarePlus className="mr-2 size-4" aria-hidden="true" />
                  )}
                  Pubblica commento
                </Button>
              </div>
            ) : (
              <p className="rounded-lg border border-dashed border-border bg-muted/40 p-4 text-sm text-muted-foreground">
                Il tuo ruolo consente la sola consultazione.
              </p>
            )}

            {comments.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nessun commento su questa versione.</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {comments.map((comment) => (
                  <li key={comment.id}>
                    <CommentThread
                      comment={comment}
                      role={role}
                      viewerId={viewerId}
                      isBusy={isPending}
                      onReply={(parentId, content) =>
                        send("/api/project-room/comments", "POST", {
                          document_id: document.id,
                          version_id: activeVersion.id,
                          parent_id: parentId,
                          content,
                        })
                      }
                      onStatusChange={(commentId, status) => {
                        void send(`/api/project-room/comments/${commentId}`, "PATCH", { status })
                      }}
                      onDelete={(commentId) => {
                        void send(`/api/project-room/comments/${commentId}`, "PATCH", { action: "delete" })
                      }}
                      onJumpToPage={(page) => setRequestedPage(page)}
                    />
                  </li>
                ))}
              </ul>
            )}
          </TabsContent>

          {/* ---------------- Revisions ---------------- */}
          <TabsContent value="revisioni" className="mt-3 flex flex-col gap-4">
            {mayPropose ? (
              <div className="flex flex-col gap-2 rounded-lg border border-border bg-card p-4">
                <p className="flex items-start gap-2 text-xs text-muted-foreground">
                  <Quote className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                  Seleziona il testo nel documento, poi scrivi la formulazione che proponi.
                </p>

                {selection ? (
                  <blockquote className="max-h-24 overflow-auto rounded border-l-2 border-primary-blue bg-muted/60 px-3 py-2 text-xs italic text-muted-foreground">
                    {selection.text}
                    <span className="mt-1 block not-italic">Pagina {selection.page}</span>
                  </blockquote>
                ) : (
                  <p className="text-xs italic text-muted-foreground">
                    Nessun testo selezionato: la proposta sara riferita alla pagina {currentPage}.
                  </p>
                )}

                <Textarea
                  value={proposalText}
                  onChange={(event) => setProposalText(event.target.value)}
                  placeholder="Testo proposto"
                  rows={4}
                  maxLength={5000}
                  className="text-sm"
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={submitProposal}
                  disabled={isSubmitting || !proposalText.trim()}
                  className="self-start"
                >
                  {isSubmitting ? (
                    <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <FileDiff className="mr-2 size-4" aria-hidden="true" />
                  )}
                  Invia proposta
                </Button>
              </div>
            ) : null}

            {revisions.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nessuna proposta di revisione.</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {revisions.map((revision) => (
                  <li key={revision.id} className="rounded-lg border border-border bg-card p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex min-w-0 flex-col">
                        <span className="truncate text-sm font-medium text-foreground">
                          {displayName(revision.author)}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          {new Date(revision.created_at).toLocaleString("it-IT", {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                          {revision.page_number ? ` · pag. ${revision.page_number}` : ""}
                        </span>
                      </div>
                      <RevisionStatusBadge status={revision.status} />
                    </div>

                    {revision.original_text ? (
                      <div className="mt-2">
                        <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                          Testo attuale
                        </span>
                        <p className="mt-1 whitespace-pre-wrap rounded bg-state-rejected/5 px-2 py-1 text-xs leading-relaxed text-muted-foreground line-through">
                          {revision.original_text}
                        </p>
                      </div>
                    ) : null}

                    <div className="mt-2">
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Testo proposto
                      </span>
                      <p className="mt-1 whitespace-pre-wrap rounded bg-state-approved/5 px-2 py-1 text-sm leading-relaxed text-foreground">
                        {revision.proposed_text}
                      </p>
                    </div>

                    {revision.review_note ? (
                      <p className="mt-2 rounded bg-muted/60 px-2 py-1 text-xs text-muted-foreground">
                        Nota: {revision.review_note}
                      </p>
                    ) : null}

                    {mayReview && revision.status === "da_valutare" && revision.created_by !== viewerId ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => {
                            void send(`/api/project-room/revisions/${revision.id}`, "PATCH", { status: "approvato" })
                          }}
                        >
                          Approva
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            void send(`/api/project-room/revisions/${revision.id}`, "PATCH", { status: "respinto" })
                          }}
                        >
                          Respingi
                        </Button>
                      </div>
                    ) : null}

                    {mayReview && revision.status === "da_valutare" && revision.created_by === viewerId ? (
                      <p className="mt-3 text-xs italic text-muted-foreground">
                        In attesa di valutazione da parte di un altro revisore.
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </TabsContent>

          {/* ---------------- Versions ---------------- */}
          <TabsContent value="versioni" className="mt-3">
            <ul className="flex flex-col gap-2">
              {document.versions.map((version) => {
                const isActive = version.id === activeVersion.id
                return (
                  <li key={version.id}>
                    <a
                      href={`/area-riservata/documenti/${document.id}?versione=${version.id}`}
                      aria-current={isActive ? "true" : undefined}
                      className={`flex flex-col gap-1 rounded-lg border p-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                        isActive ? "border-primary-blue bg-primary-blue/5" : "border-border bg-card hover:border-primary-blue"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                          <History className="size-3.5 text-muted-foreground" aria-hidden="true" />
                          {version.version_label}
                        </span>
                        <VersionStatusBadge status={version.status} />
                      </div>
                      <span className="text-[11px] text-muted-foreground">
                        {new Date(version.created_at).toLocaleDateString("it-IT", {
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                        })}
                      </span>
                      {version.changelog ? (
                        <span className="text-xs text-muted-foreground">{version.changelog}</span>
                      ) : null}
                    </a>
                  </li>
                )
              })}
            </ul>
          </TabsContent>
        </Tabs>
      </aside>
    </div>
  )
}
