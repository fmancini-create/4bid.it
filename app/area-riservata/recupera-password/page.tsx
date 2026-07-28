import type { Metadata } from "next"
import RecuperaPasswordClient from "./client"

export const metadata: Metadata = {
  title: "Password dimenticata | Area Riservata 4BID",
  description: "Richiedi un link per reimpostare la password della tua Project Room 4BID.",
  robots: { index: false, follow: false },
}

export default function RecuperaPasswordPage() {
  return <RecuperaPasswordClient />
}
