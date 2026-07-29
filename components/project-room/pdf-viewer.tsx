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
 * How tall the viewer may grow, as a share of the window. The box grows with the
 * zoom so the scrollbars appear as late as possible, but it must never become
 * taller than the window or the toolbar would scroll out of reach.
 *
 * Honest limit: past this height a zoomed portrait page IS taller than any
 * screen, so vertical scrolling returns. Zooming in means "show me less of the
 * page, bigger" — that cannot be scroll-free at every zoom level.
 */
const MAX_HEIGHT_VH = 86

/** `p-4` on the scroll area, top + bottom. */
const VERTICAL_PADDING = 32

/** Space kept below the viewer for the file name and download row. */
const BOTTOM_RESERVE = 96

/** Below this the viewer would be unusable, so the page is allowed to scroll instead. */
const MIN_BOX_HEIGHT = 384

/**
 * Slack before the layout is widened. Without it, a page landing exactly on the
 * column width could toggle the wide layout on and off, because showing a
 * vertical scrollbar narrows the content box by ~15px and would flip the
 * decision straight back.
 */
const WIDEN_HYSTERESIS = 12

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
  /**
   * Raised when the zoomed page no longer fits the column, so the parent can
   * give the viewer the full width instead of letting it scroll sideways.
   */
  onNeedsWidthChange?: (needsWidth: boolean) => void
  className?: string
}

export function PdfViewer({
  versionId,
  requestedPage,
  onPageChange,
  onDocumentLoad,
  onTextSelect,
  onNeedsWidthChange,
  className,
}: PdfViewerProps) {
  const [numPages, setNumPages] = useState<number | null>(null)
  const [page, setPage] = useState(1)
  const [scale, setScale] = useState(1)
  const [error, setError] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  /** Intrinsic page size in CSS px at 100%, reported by pdf.js. */
  const [pageSize, setPageSize] = useState<{ width: number; height: number } | null>(null)
  const [needsWidth, setNeedsWidth] = useState(false)

  /**
   * Width available to the page while the viewer sits in its normal column.
   * Captured only in that state: once the parent has widened the viewer, reusing
   * the new (larger) width as the yardstick would make the page "fit" again and
   * the layout would oscillate.
   *
   * State and not a ref on purpose: a ref would be written by the ResizeObserver
   * without re-rendering, so the "fit on open" effect below would run once with
   * a width of 0, bail out, and never run again — the document would open at an
   * arbitrary 100% instead of fitted, and only on slower loads.
   */
  const [baselineWidth, setBaselineWidth] = useState(0)
  /** Mirrors `needsWidth` for the observer callback, which sees a stale closure. */
  const needsWidthRef = useRef(false)
  const didFitRef = useRef(false)

  /**
   * How tall the box may grow. Measured from where the viewer starts down to the
   * bottom of the window instead of a fixed `vh` value: a hardcoded height that
   * ignores the header and breadcrumb above only trades the viewer's own
   * scrollbar for a scrollbar on the whole page.
   */
  const [maxBoxHeight, setMaxBoxHeight] = useState<number | null>(null)

  const clampScale = (value: number) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, value))

  useEffect(() => {
    const element = containerRef.current
    if (!element || typeof ResizeObserver === "undefined") return
    const observer = new ResizeObserver((entries) => {
      // `contentRect` already excludes the padding, so this is exactly the room
      // the rendered page has.
      const width = entries[0]?.contentRect.width ?? 0
      if (width <= 0 || needsWidthRef.current) return
      // Sub-pixel jitter must not re-render, or the observer feeds itself.
      setBaselineWidth((current) => (Math.abs(current - width) < 1 ? current : width))
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    function measure() {
      const element = containerRef.current
      if (!element) return
      const top = element.getBoundingClientRect().top
      // Leaves room for the file name and download row rendered under the viewer.
      const room = window.innerHeight - top - BOTTOM_RESERVE
      setMaxBoxHeight(Math.max(MIN_BOX_HEIGHT, Math.min(room, Math.round((window.innerHeight * MAX_HEIGHT_VH) / 100))))
    }
    measure()
    window.addEventListener("resize", measure)
    return () => window.removeEventListener("resize", measure)
  }, [])

  /**
   * Open on the whole page rather than at an arbitrary 100%: the reader sees the
   * full sheet with no scrollbars, then zooms in if they want to read closely.
   */
  useEffect(() => {
    if (didFitRef.current || !pageSize || !maxBoxHeight || baselineWidth <= 0) return
    didFitRef.current = true
    setScale(
      clampScale(Math.min(baselineWidth / pageSize.width, (maxBoxHeight - VERTICAL_PADDING) / pageSize.height)),
    )
  }, [pageSize, maxBoxHeight, baselineWidth])

  /**
   * Measured against the *column* width, never against the viewer's current
   * width: the current width is a consequence of this very decision, so feeding
   * it back in would oscillate.
   */
  useEffect(() => {
    if (!pageSize || baselineWidth <= 0) return
    const next = pageSize.width * scale > baselineWidth + WIDEN_HYSTERESIS
    needsWidthRef.current = next
    setNeedsWidth(next)
  }, [pageSize, scale, baselineWidth])

  useEffect(() => {
    onNeedsWidthChange?.(needsWidth)
  }, [needsWidth, onNeedsWidthChange])

  /** Fit the whole sheet in view, which is the only genuinely scroll-free zoom. */
  const fitPage = useCallback(() => {
    if (!pageSize || !maxBoxHeight || baselineWidth <= 0) {
      setScale(1)
      return
    }
    setScale(
      clampScale(Math.min(baselineWidth / pageSize.width, (maxBoxHeight - VERTICAL_PADDING) / pageSize.height)),
    )
  }, [pageSize, maxBoxHeight, baselineWidth])

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
            onClick={fitPage}
            aria-label="Adatta la pagina alla finestra"
            title="Adatta la pagina alla finestra"
          >
            <RotateCw className="size-4" aria-hidden="true" />
          </Button>
        </div>
      </div>

      <div
        ref={containerRef}
        onMouseUp={handleMouseUp}
        className="flex min-h-[24rem] justify-center overflow-auto bg-muted/60 p-4"
        style={{
          // Grows with the zoom, then stops: while the page is short the box
          // hugs it, so there is nothing to scroll and no empty band either.
          maxHeight: maxBoxHeight
            ? pageSize
              ? Math.min(maxBoxHeight, Math.ceil(pageSize.height * scale) + VERTICAL_PADDING)
              : maxBoxHeight
            : undefined,
        }}
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
              setError("Il file non è disponibile o il tuo accesso è scaduto. Ricarica la pagina.")
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
              // `originalWidth/Height` are the sheet's size at 100%: every fit
              // and widen decision below is measured against them.
              onLoadSuccess={(loaded) => {
                setPageSize((current) =>
                  current?.width === loaded.originalWidth && current?.height === loaded.originalHeight
                    ? current
                    : { width: loaded.originalWidth, height: loaded.originalHeight },
                )
              }}
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
