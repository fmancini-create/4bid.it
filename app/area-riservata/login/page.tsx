import type { Metadata } from "next"
import { Suspense } from "react"
import { Loader2 } from "lucide-react"
import LoginClient from "./client"

export const metadata: Metadata = {
  title: "Accesso Area Riservata - 4BID",
  description: "Accedi alla Project Room 4BID per consultare e revisionare i documenti condivisi.",
  // A private area must never appear in search results.
  robots: { index: false, follow: false },
}

export default function ProjectRoomLoginPage() {
  // LoginClient reads `?redirect=` via useSearchParams(), which forces a client
  // bailout. Without an explicit Suspense boundary the production build fails
  // (the dev server does not surface this).
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-muted/40">
          <Loader2 className="size-5 animate-spin text-muted-foreground" aria-hidden="true" />
          <span className="sr-only">Caricamento</span>
        </div>
      }
    >
      <LoginClient />
    </Suspense>
  )
}
