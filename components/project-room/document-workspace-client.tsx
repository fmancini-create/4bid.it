"use client"

import dynamic from "next/dynamic"
import { Loader2 } from "lucide-react"
import type { DocumentWorkspaceProps } from "@/components/project-room/document-workspace"
import { ExternalDocumentWorkspace } from "@/components/project-room/external-document-workspace"

/**
 * The PDF workspace is rendered client-only on purpose.
 *
 * It contains a `ssr: false` PDF viewer nested above Radix Tabs. On the server
 * the viewer renders as a loading placeholder and on the client as the real
 * component, which changes the shape of the tree and therefore the `useId`
 * values Radix derives from it — producing a hydration mismatch on every load.
 *
 * External Office documents are handled by a lightweight workspace instead:
 * they remain in their original provider and are opened only after the
 * protected Project Room route has re-checked the user's access.
 */
const DocumentWorkspace = dynamic(
  () => import("@/components/project-room/document-workspace").then((m) => m.DocumentWorkspace),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[24rem] items-center justify-center rounded-lg border border-border bg-card">
        <span className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          Caricamento documento
        </span>
      </div>
    ),
  },
)

function isApprovedExternalDocument(filePath: string | null | undefined): boolean {
  if (!filePath) return false
  try {
    const url = new URL(filePath)
    return url.protocol === "https:" && (url.hostname === "docs.google.com" || url.hostname === "drive.google.com")
  } catch {
    return false
  }
}

export function DocumentWorkspaceClient(props: DocumentWorkspaceProps) {
  if (isApprovedExternalDocument(props.activeVersion.file_path)) {
    return <ExternalDocumentWorkspace {...props} />
  }

  return <DocumentWorkspace {...props} />
}
