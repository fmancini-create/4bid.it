import { createClient } from "@supabase/supabase-js"
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
const { data, error } = await db.from("press_mentions").select("*").order("published_at", { ascending: false })
if (error) { console.error("ERR", error.message); process.exit(1) }
console.log("righe:", data.length)
for (const m of data) console.log(String(m.published_at).slice(0,10), "|", m.outlet, "|", String(m.title).slice(0,90))
