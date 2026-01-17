import type { Metadata } from "next"
import { createAdminClient } from "@/lib/supabase/server-admin"
import { DocumentVerificationPage } from "./document-verification-page"

export const metadata: Metadata = {
  title: "Verifica Documenti | Ecomobility Admin",
}

export default async function DocumentsPage() {
  const supabase = createAdminClient()

  const { data: structures } = await supabase.from("ecomobility_structures").select("*").order("name")

  return <DocumentVerificationPage structures={structures || []} />
}
