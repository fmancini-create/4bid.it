import { createClient } from "@supabase/supabase-js"
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
const { data, error } = await db.from("dem_campaigns").select("name,html_template,status,sent_count").order("created_at")
if (error) throw error
for (const c of data) {
  const src = [...String(c.html_template||"").matchAll(/<img[^>]+src="([^"]+)"/gi)].map(m=>m[1])
  console.log(String(c.status).padEnd(6), String(c.sent_count).padStart(6), c.name, "->", JSON.stringify([...new Set(src)]))
}
