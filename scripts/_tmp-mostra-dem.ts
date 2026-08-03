import { Client } from "pg"

// Mostra la DEM "Traffico aereo" (funzionalita' Air Market): oggetto, testo reso
// leggibile e risultati reali. Nessun invio.
async function main() {
  const url = process.env.SUPABASE_POSTGRES_URL_NON_POOLING
  if (!url) throw new Error("SUPABASE_POSTGRES_URL_NON_POOLING assente")
  const c = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } })
  await c.connect()

  const ca = await c.query(
    // `preheader` NON esiste in questa tabella (indovinato, errore mio).
    `select id, name, subject, html_template, created_at
     from dem_campaigns where name ilike '%Traffico aereo%' order by created_at`,
  )

  for (const x of ca.rows) {
    console.log(`\n${"=".repeat(72)}`)
    console.log(`CAMPAGNA: ${x.name}`)
    console.log(`creata:   ${String(x.created_at).slice(0, 16)}`)
    console.log(`OGGETTO:  ${x.subject}`)

    // Da HTML a testo leggibile: interessa il MESSAGGIO, non il markup.
    const testo = String(x.html_template ?? "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<head[\s\S]*?<\/head>/gi, "")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(p|div|tr|h1|h2|h3|li)>/gi, "\n")
      .replace(/<li>/gi, "  - ")
      .replace(/<[^>]+>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&egrave;/g, "e'")
      .replace(/&#39;|&apos;/g, "'")
      .replace(/[ \t]+/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim()

    console.log(`\n--- TESTO ---`)
    console.log(
      testo
        .split("\n")
        .map((r) => "  " + r.trim())
        .filter((r) => r.trim().length > 0)
        .join("\n"),
    )

    const s = await c.query(
      `select count(*) tot,
              count(*) filter (where send_status in ('sent','bounced','opened')) inviate,
              count(*) filter (where send_status='bounced') rimbalzi,
              count(*) filter (where first_open_at is not null) aperte,
              count(*) filter (where send_status='pending') attesa,
              min(sent_at) primo, max(sent_at) ultimo
       from dem_recipients where campaign_id = $1`,
      [x.id],
    )
    const r = s.rows[0]
    const pct = (n: any, d: any) => (Number(d) > 0 ? ((Number(n) / Number(d)) * 100).toFixed(1) + "%" : "-")
    console.log(`\n--- RISULTATI ---`)
    console.log(`  destinatari in lista: ${r.tot}`)
    console.log(`  email inviate:        ${r.inviate}`)
    console.log(`  aperte:               ${r.aperte}  (${pct(r.aperte, r.inviate)} delle inviate)`)
    console.log(`  rimbalzi:             ${r.rimbalzi}  (${pct(r.rimbalzi, r.inviate)})`)
    console.log(`  ancora in attesa:     ${r.attesa}`)
    console.log(`  periodo invii:        ${r.primo ? String(r.primo).slice(0, 16) : "-"} -> ${r.ultimo ? String(r.ultimo).slice(0, 16) : "-"}`)
  }

  await c.end()
}

main().catch((e) => {
  console.error("ERRORE:", e.message)
  process.exit(1)
})
