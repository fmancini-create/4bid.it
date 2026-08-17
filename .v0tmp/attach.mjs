import { createClient } from "@supabase/supabase-js"
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
const { data, error } = await db.from("dem_campaigns").select("name,status,sent_count,html_template").order("created_at")
if (error) throw error
for (const c of data) {
  const m = [...String(c.html_template||"").matchAll(/ATTACH:([^|]+)\|([^>-]+)/g)]
  if (m.length) console.log(String(c.status).padEnd(6), String(c.sent_count).padStart(6), c.name, "->", m.map(x=>x[1].trim()).join(", "))
}
