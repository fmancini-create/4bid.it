import { createAdminClient } from "@/lib/supabase/server-admin"
import { NextResponse } from "next/server"
import { createHash } from "crypto"

export async function POST(request: Request) {
  const { token, password } = await request.json()

  if (!token || !password) {
    return NextResponse.json({ error: "Token and password required" }, { status: 400 })
  }

  const supabase = createAdminClient()
  const passwordHash = createHash("sha256").update(password).digest("hex")

  const { data: plan, error } = await supabase
    .from("business_plans")
    .select("*")
    .eq("share_token", token)
    .eq("share_password", passwordHash)
    .single()

  if (error || !plan) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
  }

  // Check expiration
  if (plan.share_expires_at && new Date(plan.share_expires_at) < new Date()) {
    return NextResponse.json({ error: "Link expired" }, { status: 401 })
  }

  // Log access
  await supabase.from("business_plan_access_logs").insert({
    business_plan_id: plan.id,
  })

  // Get params and sections
  const { data: params } = await supabase
    .from("business_plan_params")
    .select("*")
    .eq("business_plan_id", plan.id)
    .order("year")

  const { data: sections } = await supabase
    .from("business_plan_sections")
    .select("*")
    .eq("business_plan_id", plan.id)
    .order("sort_order")

  return NextResponse.json({
    plan,
    params: params || [],
    sections: sections || [],
  })
}
