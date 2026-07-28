import type { Metadata } from "next"
import ClientLoginPage from "./client"
import { SUPER_ADMIN_EMAIL } from "@/lib/admin-config"

export const metadata: Metadata = {
  title: "Accesso Amministratore - 4BID.IT Admin Panel",
  description:
    "Area riservata amministratori 4BID. Accedi al pannello di controllo per gestire landing pages, contatti, progetti e analytics.",
  robots: {
    index: false,
    follow: false,
  },
  alternates: {
    canonical: "https://www.4bid.it/admin/login",
  },
}

export default function AdminLoginPage() {
  return <ClientLoginPage SUPER_ADMIN_EMAIL={SUPER_ADMIN_EMAIL} />
}
