"use client"

import { ExternalLink, FileText } from "lucide-react"

import { Button } from "@/components/ui/button"
import type { DocumentWorkspaceProps } from "@/components/project-room/document-workspace"
import { canDownload } from "@/lib/project-room/permissions"

/**
 * Workspace for files that live in an approved external document provider.
 *
 * Project Room remains the authorization gate: users always enter through the
 * protected version route, which validates their membership before redirecting
 * them to the provider. This is intentionally separate from the PDF workspace,
 * because pdf.js cannot render PowerPoint and other Office formats.
 */
export function ExternalDocumentWorkspace({
  document,
  activeVersion,
  role,
  memberCanDownload,
}: DocumentWorkspaceProps) {
  const mayDownload = canDownload(role, memberCanDownload)

  return (
    <div className="rounded-xl border border-border bg-card p-6 md:p-8">
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-secondary">
            <FileText className="size-6 text-primary-blue" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-brand-navy">Presentazione collegata</p>
            <p className="mt-1 break-words text-sm text-foreground">
              {activeVersion.file_name ?? document.title}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              {activeVersion.version_label} · il file viene aperto dal provider esterno dopo il controllo degli accessi della Project Room.
            </p>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap gap-2">
          <Button asChild>
            <a
              href={`/api/project-room/versions/${activeVersion.id}/file`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="mr-2 size-4" aria-hidden="true" />
              Apri presentazione
            </a>
          </Button>
          {mayDownload ? (
            <Button asChild variant="outline">
              <a
                href={`/api/project-room/versions/${activeVersion.id}/file?download=1`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Apri / scarica da Drive
              </a>
            </Button>
          ) : null}
        </div>
      </div>

      <p className="mt-6 border-t border-border pt-4 text-xs leading-relaxed text-muted-foreground">
        Le presentazioni PowerPoint non vengono convertite nel visualizzatore PDF: resta disponibile il file originale, mantenendo layout, animazioni e contenuti editabili.
      </p>
    </div>
  )
}
