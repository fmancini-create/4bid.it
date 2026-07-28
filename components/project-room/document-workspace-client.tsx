"use client"

import dynamic from "next/dynamic"
import { Loader2 } from "lucide-react"
import type { DocumentWorkspaceProps } from "@/components/project-room/document-workspace"

/**
 * The workspace is rendered client-only on purpose.
 *
 * It contains a `ssr: false` PDF viewer nested above Radix Tabs. On the server
 * the viewer renders as a loading placeholder and on the client as the real
 * component, which changes the shape of the tree and therefore the `useId`
 * values Radix derives from it — producing a hydration mismatch on every load.
 *
 * This is an authenticated document tool with no SEO surface, so there is
 * nothing to gain from server HTML here and a whole class of hydration bugs to
 * avoid. Data is still fetched and authorized on the server and passed in.
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

export function DocumentWorkspaceClient(props: DocumentWorkspaceProps) {
  return <DocumentWorkspace {...props} />
}
