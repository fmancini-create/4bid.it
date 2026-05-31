const { createClient } = require("@supabase/supabase-js")

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error("Missing Supabase env")
  const sb = createClient(url, key, { auth: { persistSession: false } })

  const { data: campaigns, error } = await sb
    .from("dem_campaigns")
    .select("id, name, subject, status, auto_send, sent_count")
    .order("created_at", { ascending: true })
  if (error) throw error

  for (const c of campaigns) {
    const { count } = await sb
      .from("dem_recipients")
      .select("id", { count: "exact", head: true })
      .eq("campaign_id", c.id)
    console.log(
      `- ${c.name} | id=${c.id} | status=${c.status} | auto_send=${c.auto_send} | recipients=${count}`
    )
  }
}

main().catch((e) => {
  console.error("ER:", e.message)
  process.exit(1)
})
