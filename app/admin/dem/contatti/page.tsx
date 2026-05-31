import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import type { Metadata } from "next"
import ContattiView from "./contatti-view"

export const metadata: Metadata = {
  title: "Contatti Hotel | Admin 4BID.IT",
  description: "Anteprima della lista contatti hotel",
}

const SUPER_ADMIN_EMAIL = "f.mancini@4bid.it"

export default async function ContattiPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/admin/login")
  }

  if (user.email !== SUPER_ADMIN_EMAIL) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4 text-destructive">Accesso Negato</h1>
          <p className="text-muted-foreground">Non hai i permessi per accedere a questa area.</p>
        </div>
      </div>
    )
  }

  return <ContattiView />
}
