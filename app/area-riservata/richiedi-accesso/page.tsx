import type { Metadata } from "next"
import RequestAccessClient from "./client"

export const metadata: Metadata = {
  title: "Richiedi accesso alla Project Room - 4BID",
  description: "Richiedi l'accesso all'area riservata 4BID per consultare i documenti del tuo progetto.",
  robots: { index: false, follow: false },
}

export default function RequestAccessPage() {
  return <RequestAccessClient />
}
