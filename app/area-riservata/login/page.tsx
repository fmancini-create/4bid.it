import type { Metadata } from "next"
import LoginClient from "./client"

export const metadata: Metadata = {
  title: "Accesso Area Riservata - 4BID",
  description: "Accedi alla Project Room 4BID per consultare e revisionare i documenti condivisi.",
  // A private area must never appear in search results.
  robots: { index: false, follow: false },
}

export default function ProjectRoomLoginPage() {
  return <LoginClient />
}
