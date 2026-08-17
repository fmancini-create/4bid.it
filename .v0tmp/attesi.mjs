import { createClient } from "@supabase/supabase-js"
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
const { data: camp } = await db.from("dem_campaigns").select("id,name").order("created_at")
const stampa = camp.filter(c => /comunicato|stampa|press/i.test(c.name))
const rubrica = new Set()
for (const c of stampa) {
  const { data, error } = await db.from("dem_recipients").select("email").eq("campaign_id", c.id)
  if (error) throw error
  for (const r of data) rubrica.add(r.email.toLowerCase())
}
const { data: uns, error: e1 } = await db.from("dem_unsubscribes").select("email")
if (e1) throw e1
const { data: bad, error: e2 } = await db.from("dem_recipients").select("email").in("send_status",["bounced","complained","unsubscribed"])
if (e2) throw e2
const sopp = new Set([...(uns||[]).map(r=>String(r.email).toLowerCase()), ...(bad||[]).map(r=>String(r.email).toLowerCase())])
const restano = [...rubrica].filter(e => !sopp.has(e))
console.log("rubrica unione:", rubrica.size, "| soppressi che la toccano:", rubrica.size - restano.length, "| ATTESI in campagna:", restano.length)
