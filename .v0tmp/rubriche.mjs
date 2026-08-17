import { createClient } from "@supabase/supabase-js"
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
const { data: camp, error } = await db.from("dem_campaigns").select("id,name,created_at").order("created_at")
if (error) throw error
const stampa = camp.filter(c => /comunicato|stampa|press/i.test(c.name))
const insiemi = []
for (const c of stampa) {
  const { data, error: e } = await db.from("dem_recipients").select("email,nome,cognome,nome_azienda,send_status").eq("campaign_id", c.id)
  if (e) throw e
  insiemi.push({ nome: c.name, righe: data })
  const stati = {}
  for (const r of data) stati[r.send_status] = (stati[r.send_status]||0)+1
  const conNome = data.filter(r => r.nome && String(r.nome).trim()).length
  console.log(String(c.created_at).slice(0,10), c.name, "| righe", data.length, "| con nome", conNome, "|", JSON.stringify(stati))
}
const A = new Set(insiemi[0].righe.map(r=>r.email.toLowerCase()))
const B = new Set(insiemi[1].righe.map(r=>r.email.toLowerCase()))
console.log("solo nella prima:", [...A].filter(e=>!B.has(e)).length)
console.log("solo nella seconda:", [...B].filter(e=>!A.has(e)).length)
console.log("unione:", new Set([...A,...B]).size)
const { data: uns } = await db.from("dem_unsubscribes").select("email")
const dis = new Set((uns||[]).map(r=>String(r.email).toLowerCase()))
console.log("disiscritti dentro l'unione:", [...new Set([...A,...B])].filter(e=>dis.has(e)).length)
const { data: bad } = await db.from("dem_recipients").select("email").in("send_status",["bounced","complained","unsubscribed"])
const cattivi = new Set((bad||[]).map(r=>String(r.email).toLowerCase()))
console.log("non recapitabili dentro l'unione:", [...new Set([...A,...B])].filter(e=>cattivi.has(e)).length)
