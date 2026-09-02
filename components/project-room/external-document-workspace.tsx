"use client"

import { useRef } from "react"
import { Maximize2, Presentation } from "lucide-react"

import { Button } from "@/components/ui/button"
import type { DocumentWorkspaceProps } from "@/components/project-room/document-workspace"

function toEmbeddedPresentationUrl(filePath: string | null | undefined): string | null {
  if (!filePath) return null

  try {
    const url = new URL(filePath)
    if (url.protocol !== "https:") return null

    if (url.hostname === "docs.google.com") {
      const match = url.pathname.match(/^\/presentation\/d\/([^/]+)/)
      if (!match?.[1]) return null
      return `https://docs.google.com/presentation/d/${encodeURIComponent(match[1])}/preview?rm=minimal`
    }

    if (url.hostname === "drive.google.com") {
      const match = url.pathname.match(/^\/file\/d\/([^/]+)/)
      if (!match?.[1]) return null
      return `https://drive.google.com/file/d/${encodeURIComponent(match[1])}/preview`
    }

    return null
  } catch {
    return null
  }
}

/**
 * Embedded workspace for approved external presentations.
 *
 * Users stay inside the 4BID Project Room while the provider renders the file
 * in an iframe. The original source URL is never presented as a normal outbound
 * navigation action, so reviewing a presentation does not take the user away
 * from the project workspace.
 */
export function ExternalDocumentWorkspace({ document, activeVersion }: DocumentWorkspaceProps) {
  const fullscreenRef = useRef<HTMLDivElement>(null)
  const embedUrl = toEmbeddedPresentationUrl(activeVersion.file_path)

  async function enterFullscreen() {
    if (!fullscreenRef.current?.requestFullscreen) return
    await fullscreenRef.current.requestFullscreen()
  }

  if (!embedUrl) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 md:p-8">
        <div className="flex items-start gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-secondary">
            <Presentation className="size-6 text-primary-blue" aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm font-semibold text-brand-navy">Presentazione non visualizzabile</p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Questa versione non usa un formato incorporabile nella Project Room. Carica una presentazione Google Slides o un file Drive compatibile per mantenerne la consultazione dentro 4BID.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div ref={fullscreenRef} className="overflow-hidden rounded-xl border border-border bg-card shadow-sm fullscreen:rounded-none fullscreen:border-0">
      <div className="flex flex-col gap-3 border-b border-border bg-card px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-secondary">
            <Presentation className="size-5 text-primary-blue" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-brand-navy">{document.title}</p>
            <p className="truncate text-xs text-muted-foreground">
              {activeVersion.version_label} · visualizzazione integrata nella Project Room
            </p>
          </div>
        </div>

        <Button type="button" variant="outline" size="sm" onClick={enterFullscreen} className="shrink-0">
          <Maximize2 className="mr-2 size-4" aria-hidden="true" />
          Schermo intero
        </Button>
      </div>

      <div className="bg-black/5 p-2 sm:p-3 fullscreen:h-[calc(100vh-65px)] fullscreen:p-0">
        <iframe
          src={embedUrl}
          title={`Presentazione ${document.title}`}
          className="h-[68vh] min-h-[480px] w-full rounded-lg border-0 bg-white fullscreen:h-full fullscreen:min-h-0 fullscreen:rounded-none"
          allow="fullscreen"
          allowFullScreen
          loading="eager"
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
    </div>
  )
}
