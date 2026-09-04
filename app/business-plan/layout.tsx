import type { Metadata } from "next"
import type { ReactNode } from "react"
import { StopSessionReplay } from "@/components/project-room/stop-session-replay"

export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
}

/**
 * Tutti i dossier condivisi sono contenuti riservati. Oltre al noindex,
 * forziamo lo stop del session replay quando si arriva qui con navigazione
 * client-side da una pagina pubblica dove Yandex era gia' attivo.
 */
export default function BusinessPlanLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <StopSessionReplay />
      {children}
    </>
  )
}
