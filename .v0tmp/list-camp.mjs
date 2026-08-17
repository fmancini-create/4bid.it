import { createClient } from "@supabase/supabase-js"
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
const { data, error } = await db.from("dem_campaigns").select("id,name,status,sent_count,created_at").order("created_at")
if (error) { console.error("ERR", error.message); process.exit(1) }
for (const c of data) {
  const { count, error: e2 } = await db.from("dem_recipients").select("id", { count: "exact", head: true }).eq("campaign_id", c.id)
  if (e2) { console.error("ERR2", e2.message); process.exit(1) }
  console.log(String(c.created_at).slice(0,10), String(c.status).padEnd(9), "inviate", String(c.sent_count).padStart(6), "dest", String(count).padStart(6), c.name)
}
