import { createClient } from "@supabase/supabase-js"
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })

async function caso(nome, percorso, atteso) {
  const { data: c, error: e1 } = await db.from("dem_campaigns").insert({
    name: `PROVA GUARDIA ${nome} (cancellare)`, subject: "prova",
    // MARCATORE VERO: commento HTML <!--ATTACH:percorso|nome-->
    html_template: `<html><body><p>ciao</p><!--ATTACH:${percorso}|allegato.pdf--></body></html>`,
    status: "draft", auto_send: false,
  }).select("id").single()
  if (e1) throw e1
  await db.from("dem_recipients").insert({ campaign_id: c.id, email: `guardia-${nome}@example.invalid`, send_status: "pending" })

  const res = await fetch("http://localhost:3000/api/dem/send", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${process.env.CRON_SECRET}` },
    body: JSON.stringify({ campaign_id: c.id, batch_size: 1 }),
  })
  const body = await res.json()
  const { data: d } = await db.from("dem_campaigns").select("status,sent_count").eq("id", c.id).single()
  const { data: dest } = await db.from("dem_recipients").select("send_status").eq("campaign_id", c.id)

  console.log(`\n=== ${nome} (${percorso})`)
  console.log("  HTTP:", res.status, "| atteso:", atteso)
  if (body.error) console.log("  errore:", body.error.slice(0, 160))
  console.log("  stato:", d.status, "| inviate:", d.sent_count, "| destinatario:", dest[0].send_status)
  const esito = res.status === atteso && (atteso !== 400 || (d.sent_count === 0 && d.status === "draft" && dest[0].send_status === "pending"))
  console.log("  ESITO:", esito ? "PASS" : "FAIL")

  await db.from("dem_recipients").delete().eq("campaign_id", c.id)
  await db.from("dem_campaigns").delete().eq("id", c.id)
  return esito
}

// A) allegato dichiarato ma inesistente -> deve RIFIUTARE senza inviare nulla
const a = await caso("ROTTO", "/comunicati/NON-ESISTE-XYZ.pdf", 400)
// B) allegato esistente -> la guardia NON deve ostacolare l'invio legittimo
const b = await caso("VALIDO", "/4bid-logo-email.png", 200)

console.log("\n=== residui ===")
const { data: resti } = await db.from("dem_campaigns").select("id,name").ilike("name","%PROVA GUARDIA%")
console.log("campagne di prova rimaste:", resti.length)
const { data: vera } = await db.from("dem_campaigns").select("status,sent_count").ilike("name","%Ecosistema 4 BID%").single()
console.log("bozza vera:", vera.status, "| inviate:", vera.sent_count)
console.log("\nTOTALE:", a && b ? "2/2 PASS" : "FAIL")
