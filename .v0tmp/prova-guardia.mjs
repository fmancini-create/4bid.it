import { createClient } from "@supabase/supabase-js"
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
const { data: c } = await db.from("dem_campaigns").select("id,status,sent_count").ilike("name","%Ecosistema 4 BID%").single()
console.log("prima:  stato =", c.status, "| inviate =", c.sent_count)

// Il file esiste in locale, quindi in locale l'allegato SI scarica: per vedere la
// guardia servirebbe un allegato rotto. Uso una campagna DI PROVA con un
// marcatore che punta a un file inesistente, e un solo destinatario finto.
const { data: prova, error: e1 } = await db.from("dem_campaigns").insert({
  name: "PROVA GUARDIA ALLEGATO (cancellare)",
  subject: "prova",
  html_template: '<html><body><p>ciao</p>[[ATTACH:/comunicati/NON-ESISTE-XYZ.pdf|inesistente.pdf]]</body></html>',
  status: "draft", auto_send: false,
}).select("id,status").single()
if (e1) throw e1
const { error: e2 } = await db.from("dem_recipients").insert({
  campaign_id: prova.id, email: "prova-guardia@example.invalid", send_status: "pending",
})
if (e2) throw e2

const res = await fetch("http://localhost:3000/api/dem/send", {
  method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${process.env.CRON_SECRET}` },
  body: JSON.stringify({ campaign_id: prova.id, batch_size: 1 }),
})
const body = await res.json()
console.log("\nHTTP:", res.status)
console.log("errore:", body.error?.slice(0, 190))

const { data: dopo } = await db.from("dem_campaigns").select("status,sent_count").eq("id", prova.id).single()
const { data: dest } = await db.from("dem_recipients").select("send_status").eq("campaign_id", prova.id)
console.log("\nstato dopo il rifiuto:", dopo.status, "(atteso draft: NON bloccata)")
console.log("email inviate:", dopo.sent_count, "(atteso 0)")
console.log("destinatario:", dest[0].send_status, "(atteso pending: intatto)")

await db.from("dem_recipients").delete().eq("campaign_id", prova.id)
await db.from("dem_campaigns").delete().eq("id", prova.id)
const { data: resti } = await db.from("dem_campaigns").select("id").eq("id", prova.id)
console.log("\ncampagna di prova rimossa:", resti.length === 0 ? "SI" : "NO")
const { data: fine } = await db.from("dem_campaigns").select("status,sent_count").eq("id", c.id).single()
console.log("bozza vera intatta: stato =", fine.status, "| inviate =", fine.sent_count)
