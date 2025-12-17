import type { Metadata } from "next"
import ClientLoginPage from "./client"

const SUPER_ADMIN_EMAIL = "f.mancini@4bid.it"

export const metadata: Metadata = {
  title: "Accesso Amministratore - 4BID.IT Admin Panel",
  description:
    "Area riservata amministratori 4BID. Accedi al pannello di controllo per gestire landing pages, contatti, progetti e analytics.",
  robots: {
    index: false,
    follow: false,
  },
}

export default function AdminLoginPage() {
  return <ClientLoginPage SUPER_ADMIN_EMAIL={SUPER_ADMIN_EMAIL} />
}
