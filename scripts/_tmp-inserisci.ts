import { Client } from "pg"

/**
 * Temporaneo: aggiunge i 2 destinatari mancanti alla campagna "clienti" GIA'
 * approvata e inviata, lasciandoli in 'pending'. La campagna ha auto_send=false,
 * quindi nessun cron li invia a mia insaputa: l'invio lo avvio io subito dopo.
 *
 * NON inserisco le 3 utenze di prova (noreply@santaddeo.com, pippomancio@gmail.com,
 * filippo@hotelbid.org): noreply@ e' una casella automatica e un rimbalzo in piu'
 * peggiora una reputazione mittente che oggi e' gia' oltre la soglia di guardia.
 */
const CAMPAGNA = "b9d32eb8-c4af-4487-9701-450fdb58e515"

const DESTINATARI = [
  { email: "andrea.tesi.mancini@gmail.com", nome: "Andrea", cognome: "Tesi Mancini" },
  { email: "f.mancini@4bid.it", nome: "Filippo", cognome: "Mancini" },
]

async function main() {
  const c = new Client({
    connectionString: process.env.SUPABASE_POSTGRES_URL_NON_POOLING!,
    ssl: { rejectUnauthorized: false },
  })
  await c.connect()

  for (const d of DESTINATARI) {
    // Se per qualsiasi motivo la riga esistesse gia', non ne creo una seconda:
    // due righe 'pending' significherebbero due email alla stessa persona.
    const g = await c.query(`select id, send_status from dem_recipients where campaign_id = $1 and lower(email) = $2`, [
      CAMPAGNA,
      d.email.toLowerCase(),
    ])
    if (g.rows.length > 0) {
      console.log(`  GIA' PRESENTE ${d.email} (${g.rows[0].send_status}) - non lo duplico`)
      continue
    }
    await c.query(
      `insert into dem_recipients (campaign_id, email, nome, cognome, send_status, tipo_contatto, created_at)
       values ($1, $2, $3, $4, 'pending', 'cliente', now())`,
      [CAMPAGNA, d.email, d.nome, d.cognome],
    )
    console.log(`  inserito  ${d.email}  (${d.nome} ${d.cognome})`)
  }

  const v = await c.query(
    `select email, send_status from dem_recipients where campaign_id = $1 and send_status = 'pending' order by email`,
    [CAMPAGNA],
  )
  console.log(`\n=== in attesa su questa campagna: ${v.rows.length} (devono essere esattamente i 2 voluti) ===`)
  for (const r of v.rows) console.log(`  ${r.email}`)

  await c.end()
}

main().catch((e) => {
  console.error("ERRORE:", e.message)
  process.exit(1)
})
