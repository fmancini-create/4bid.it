// Crea operator Villa I Barronci e genera link reset
const { createClient } = require("@supabase/supabase-js")
const bcrypt = require("bcryptjs")
const { nanoid } = require("nanoid")

async function main() {
  const supabase = createClient(
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } },
  )

  const SLUG = "villa-i-barronci-resort-spa"
  const EMAIL = "f.mancini@ibarronci.com"
  const NAME = "Francesco Mancini"
  const ROLE = "admin"

  const { data: structure, error: sErr } = await supabase
    .from("ecomobility_structures")
    .select("id, name, slug")
    .eq("slug", SLUG)
    .single()
  if (sErr || !structure) {
    console.error("[v0] structure not found", sErr?.message)
    process.exit(1)
  }
  console.log("[v0] structure:", structure)

  let { data: existing } = await supabase
    .from("ecomobility_operators")
    .select("id, email, name, is_active")
    .eq("structure_id", structure.id)
    .eq("email", EMAIL.toLowerCase().trim())
    .maybeSingle()

  let operatorId
  let action
  if (existing) {
    operatorId = existing.id
    action = "reset"
    console.log("[v0] operator already exists:", existing)
  } else {
    const placeholderHash = await bcrypt.hash(nanoid(32), 10)
    const { data: created, error: cErr } = await supabase
      .from("ecomobility_operators")
      .insert({
        structure_id: structure.id,
        email: EMAIL.toLowerCase().trim(),
        name: NAME,
        role: ROLE,
        password_hash: placeholderHash,
        is_active: true,
      })
      .select("id, email, name")
      .single()
    if (cErr || !created) {
      console.error("[v0] create failed:", cErr?.message)
      process.exit(1)
    }
    operatorId = created.id
    action = "invite"
    console.log("[v0] operator created:", created)
  }

  const token = nanoid(48)
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  const { error: tErr } = await supabase.from("ecomobility_operator_password_tokens").insert({
    token,
    operator_id: operatorId,
    type: action,
    expires_at: expiresAt,
  })
  if (tErr) {
    console.error("[v0] token insert failed:", tErr.message)
    process.exit(1)
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://4bid.it"
  const resetLink = `${baseUrl}/ecomobility/${structure.slug}/admin/reset-password?token=${token}`
  console.log("\n=== RESET LINK (24h) ===")
  console.log(resetLink)
  console.log("========================\n")
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
