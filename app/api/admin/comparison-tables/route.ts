import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/server-admin"
import {
  COMPARISON_PRODUCTS,
  normalizeMasterTable,
  type ComparisonProduct,
} from "@/lib/quotes/comparison"

export const dynamic = "force-dynamic"

const SUPER_ADMIN_EMAIL = "f.mancini@4bid.it"

async function requireSuperAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== SUPER_ADMIN_EMAIL) return null
  return user
}

/** GET — elenco delle 4 tabelle master. */
export async function GET() {
  const user = await requireSuperAdmin()
  if (!user) return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })

  const admin = createAdminClient()
  const { data, error } = await admin.from("product_comparison_tables").select("*").order("product")
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ tables: data || [] })
}

/** PUT — salva/aggiorna la master di un prodotto. */
export async function PUT(request: NextRequest) {
  const user = await requireSuperAdmin()
  if (!user) return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const product = String(body?.product ?? "") as ComparisonProduct
  if (!COMPARISON_PRODUCTS.includes(product)) {
    return NextResponse.json({ error: "Prodotto non valido" }, { status: 400 })
  }

  const table = normalizeMasterTable(product, body)
  const admin = createAdminClient()
  const { error } = await admin.from("product_comparison_tables").upsert(
    {
      product,
      title: table.title,
      headers: table.headers,
      rows: table.rows,
      footer_note: table.footer_note,
      source_url: table.source_url,
      enabled: table.enabled,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "product" },
  )
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, table })
}
