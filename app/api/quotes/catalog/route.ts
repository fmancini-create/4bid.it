import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getFederatedCatalog } from "@/lib/quotes/catalog"

const SUPER_ADMIN_EMAIL = "f.mancini@4bid.it"

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== SUPER_ADMIN_EMAIL) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
  }

  try {
    const projects = await getFederatedCatalog()
    return NextResponse.json({
      projects,
      items: projects.flatMap(project => project.items),
    })
  } catch (cause: any) {
    console.error("[quotes] Federated catalog error", cause)
    return NextResponse.json({ error: cause?.message ?? "Errore catalogo" }, { status: 500 })
  }
}
