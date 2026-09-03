import { randomUUID } from "crypto"
import bcrypt from "bcryptjs"
import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/server-admin"
import {
  BUSINESS_PLAN_SHARE_COOKIE,
  createBusinessPlanShareSession,
} from "@/lib/business-plan-share-session"

const SUPER_ADMIN_EMAIL = "f.mancini@4bid.it"
const ADMIN_PREVIEW_EMAIL = "superadmin-preview@4bid.it"

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(new URL("/admin/login", request.url))
  }

  if (user.email?.toLowerCase() !== SUPER_ADMIN_EMAIL) {
    return NextResponse.json({ error: "Accesso negato" }, { status: 403 })
  }

  const admin = createAdminClient()
  const { data: plans, error: planError } = await admin
    .from("business_plans")
    .select("id")
    .eq("project_type", "corporate_saas")
    .order("created_at", { ascending: false })
    .limit(1)

  if (planError) {
    console.error("[admin-preview] business plan lookup failed", planError)
    return NextResponse.json({ error: "Impossibile caricare il Dossier Banca" }, { status: 500 })
  }

  const plan = plans?.[0]
  if (!plan) {
    return NextResponse.json({ error: "Dossier Banca non trovato" }, { status: 404 })
  }

  const { data: existingPreview, error: previewLookupError } = await admin
    .from("business_plan_shares")
    .select("id, token")
    .eq("business_plan_id", plan.id)
    .eq("email", ADMIN_PREVIEW_EMAIL)
    .maybeSingle()

  if (previewLookupError) {
    console.error("[admin-preview] preview share lookup failed", previewLookupError)
    return NextResponse.json({ error: "Impossibile preparare l'anteprima" }, { status: 500 })
  }

  let previewShare = existingPreview

  if (!previewShare) {
    const token = randomUUID()
    const passwordHash = await bcrypt.hash(randomUUID(), 10)
    const { data: createdPreview, error: createPreviewError } = await admin
      .from("business_plan_shares")
      .insert({
        business_plan_id: plan.id,
        email: ADMIN_PREVIEW_EMAIL,
        password_hash: passwordHash,
        token,
        can_edit: false,
        can_download: true,
        expires_at: null,
        access_count: 0,
        email_open_count: 0,
        view_count: 0,
      })
      .select("id, token")
      .single()

    if (createPreviewError || !createdPreview) {
      console.error("[admin-preview] preview share creation failed", createPreviewError)
      return NextResponse.json({ error: "Impossibile creare l'anteprima" }, { status: 500 })
    }

    previewShare = createdPreview
  }

  const session = createBusinessPlanShareSession({
    shareId: previewShare.id,
    token: previewShare.token,
    visitorName: "Superadmin 4BID",
    visitorEmail: user.email || SUPER_ADMIN_EMAIL,
    visitorCompany: "4BID S.r.l.",
  })

  const response = NextResponse.redirect(new URL(`/business-plan/${previewShare.token}`, request.url))
  response.cookies.set(BUSINESS_PLAN_SHARE_COOKIE, session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  })

  return response
}
