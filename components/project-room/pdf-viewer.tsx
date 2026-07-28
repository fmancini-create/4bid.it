"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Document, Page, pdfjs } from "react-pdf"
import { ChevronLeft, ChevronRight, Loader2, Minus, Plus, RotateCw, TriangleAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

import "react-pdf/dist/Page/TextLayer.css"
import "react-pdf/dist/Page/AnnotationLayer.css"

/**
 * The worker is served from our own origin, copied at install time by
 * `scripts/project-room/copy-pdf-worker.mjs`. A CDN URL would be one version
 * drift away from "the viewer stopped rendering", and it would leak the fact
 * that a document is being opened to a third party.
 */
pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs"

const MIN_SCALE = 0.5
const MAX_SCALE = 2.5
const SCALE_STEP = 0.25

/**
 * Module-level so the object identity is stable across renders. Inline, react-pdf
 * sees a "new" options object every render and re-fetches the whole PDF in a loop.
 * Nothing about these documents should reach an external service.
 */
const DOCUMENT_OPTIONS = { isEvalSupported: false } as const

export interface PdfViewerProps {
  versionId: string
  /** Page the parent wants shown, e.g. when a comment is clicked. */
  requestedPage?: number | null
  onPageChange?: (page: number) => void
  onDocumentLoad?: (pageCount: number) => void
  /** Text the reader highlighted, used to seed a revision proposal. */
  onTextSelect?: (selection: { text: string; page: number } | null) => void
  className?: string
}

export function PdfViewer({
  versionId,
  requestedPage,
  onPageChange,
  onDocumentLoad,
  onTextSelect,
  className,
}: PdfViewerProps) {
  const [numPages, setNumPages] = useState<number | null>(null)
  const [page, setPage] = useState(1)
  const [scale, setScale] = useState(1)
  const [error, setError] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // The parent may ask for a specific page (clicking a comment). Guarded by the
  // known page count so an out-of-range page_number cannot blank the viewer.
  useEffect(() => {
    if (!requestedPage) return
    if (numPages && (requestedPage < 1 || requestedPage > numPages)) return
    setPage(requestedPage)
  }, [requestedPage, numPages])

  const goTo = useCallback(
    (next: number) => {
      if (!numPages) return
      const clamped = Math.min(Math.max(next, 1), numPages)
      setPage(clamped)
      onPageChange?.(clamped)
      containerRef.current?.scrollTo({ top: 0, behavior: "smooth" })
    },
    [numPages, onPageChange],
  )

  // Report the selected text upward. Reading the live selection on mouseup is
  // the only reliable moment: React has no selection event on the text layer.
  const handleMouseUp = useCallback(() => {
    if (!onTextSelect) return
    const selection = window.getSelection()
    const text = selection?.toString().trim() ?? ""
    onTextSelect(text.length > 0 ? { text: text.slice(0, 2000), page } : null)
  }, [onTextSelect, page])

  return (
    <div className={cn("flex flex-col overflow-hidden rounded-lg border border-border bg-card", className)}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-muted/40 px-3 py-2">
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => goTo(page - 1)}
            disabled={!numPages || page <= 1}
            aria-label="Pagina precedente"
          >
            <ChevronLeft className="size-4" aria-hidden="true" />
          </Button>
          <span className="min-w-[5.5rem] text-center text-xs tabular-nums text-muted-foreground" aria-live="polite">
            {numPages ? `Pag. ${page} di ${numPages}` : "Caricamento"}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => goTo(page + 1)}
            disabled={!numPages || page >= numPages}
            aria-label="Pagina successiva"
          >
            <ChevronRight className="size-4" aria-hidden="true" />
          </Button>
        </div>

        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setScale((s) => Math.max(MIN_SCALE, s - SCALE_STEP))}
            disabled={scale <= MIN_SCALE}
            aria-label="Riduci zoom"
          >
            <Minus className="size-4" aria-hidden="true" />
          </Button>
          <span className="min-w-[3rem] text-center text-xs tabular-nums text-muted-foreground">
            {Math.round(scale * 100)}%
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setScale((s) => Math.min(MAX_SCALE, s + SCALE_STEP))}
            disabled={scale >= MAX_SCALE}
            aria-label="Aumenta zoom"
          >
            <Plus className="size-4" aria-hidden="true" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setScale(1)}
            aria-label="Ripristina zoom"
          >
            <RotateCw className="size-4" aria-hidden="true" />
          </Button>
        </div>
      </div>

      <div
        ref={containerRef}
        onMouseUp={handleMouseUp}
        className="flex max-h-[70vh] min-h-[24rem] justify-center overflow-auto bg-muted/60 p-4"
      >
        {error ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
            <TriangleAlert className="size-6 text-destructive" aria-hidden="true" />
            <p className="text-sm font-medium text-foreground">Impossibile visualizzare il documento</p>
            <p className="max-w-sm text-xs text-muted-foreground">{error}</p>
          </div>
        ) : (
          <Document
            file={`/api/project-room/versions/${versionId}/file`}
            onLoadSuccess={({ numPages: total }) => {
              setNumPages(total)
              setError(null)
              onDocumentLoad?.(total)
            }}
            onLoadError={(loadError) => {
              console.log("[v0] pdf load error:", loadError.message)
              setError("Il file non e disponibile o il tuo accesso e scaduto. Ricarica la pagina.")
            }}
            loading={
              <div className="flex items-center gap-2 py-16 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                Caricamento documento
              </div>
            }
            error={null}
            options={DOCUMENT_OPTIONS}
          >
            <Page
              pageNumber={page}
              scale={scale}
              renderTextLayer
              renderAnnotationLayer={false}
              className="shadow-sm"
              loading={
                <div className="flex items-center gap-2 py-16 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  Rendering pagina
                </div>
              }
            />
          </Document>
        )}
      </div>
    </div>
  )
}
