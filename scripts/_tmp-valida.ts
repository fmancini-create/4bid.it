import { Client } from "pg"
// Importo la libreria REALE, non una copia della sua logica: se la classifico
// diversamente qui, la prova non direbbe nulla sul comportamento in produzione.
import { classifica, dominioDi, dominioRiceveposta, SOGLIA_DOMINIO_SICURO } from "../lib/dem/validazione"

async function main() {
  const c = new Client({
    connectionString: process.env.SUPABASE_POSTGRES_URL_NON_POOLING!,
    ssl: { rejectUnauthorized: false },
  })
  await c.connect()

  const camp = (
    await c.query(
      `select id, name from dem_campaigns where auto_paused_reason is not null limit 1`,
    )
  ).rows[0]
  console.log(`Campagna: ${camp.name}`)
  console.log(`Soglia dominio sicuro: ${SOGLIA_DOMINIO_SICURO}+ indirizzi\n`)

  // 1) Frequenza dei domini su TUTTA la lista (non solo la coda).
  const freqRows = await c.query(
    `select lower(split_part(email,'@',2)) d, count(*) n
     from dem_recipients where campaign_id=$1 and email is not null
     group by 1`,
    [camp.id],
  )
  const freq = new Map<string, number>()
  for (const r of freqRows.rows) freq.set(r.d, Number(r.n))
  console.log(`Domini distinti nella lista: ${freq.size}`)

  // 2) Coda da valutare.
  const coda = await c.query(
    `select id, email from dem_recipients
     where campaign_id=$1 and send_status='pending' and email is not null`,
    [camp.id],
  )
  console.log(`In attesa: ${coda.rows.length}`)

  const domini = new Set<string>()
  for (const r of coda.rows) {
    const d = dominioDi(r.email)
    if (d) domini.add(d)
  }
  console.log(`Domini distinti in coda: ${domini.size}`)
  console.log("\nControllo DNS in corso...")

  // 3) Controllo MX con la funzione reale, in parallelo limitato.
  const elenco = Array.from(domini)
  const esito = new Map<string, boolean | null>()
  let erroriRete = 0
  // Parallelismo alto: 16.865 domini a ~330ms l'uno sarebbero 90 minuti in serie.
  const P = 100
  const t0 = Date.now()
  let ultimoAvviso = 0
  for (let i = 0; i < elenco.length; i += P) {
    const lotto = elenco.slice(i, i + P)
    const res = await Promise.all(
      lotto.map(async (d) => ({ d, ...(await dominioRiceveposta(d)) })),
    )
    for (const r of res) {
      esito.set(r.d, r.haMx)
      if (r.haMx === null) erroriRete++
    }
    // Avanzamento a SOGLIE, non su `i % 500`: `i` avanza a passi di P, quindi
    // il resto non e' mai zero e non stamperebbe nulla. Inoltre `process.stdout`
    // qui e' bufferizzato, percio' l'assenza di righe non prova che sia bloccato.
    if (i - ultimoAvviso >= 2000) {
      ultimoAvviso = i
      const sec = ((Date.now() - t0) / 1000).toFixed(0)
      console.log(`  ...${i}/${elenco.length} in ${sec}s`)
    }
  }
  console.log(`  fatto in ${((Date.now() - t0) / 1000).toFixed(0)}s. Errori di rete: ${erroriRete}`)

  // Memorizzo gli esiti per dominio: e' la cache che la rotta reale riusa, e
  // serve anche come traccia verificabile dall'esterno (prima non scrivevo
  // nulla qui, quindi "0 domini memorizzati" non distingueva lento da bloccato).
  const dom = Array.from(esito.entries()).filter(([, v]) => v !== null)
  for (let i = 0; i < dom.length; i += 1000) {
    const fetta = dom.slice(i, i + 1000)
    await c.query(
      `insert into dem_domain_checks (domain, has_mx, checked_at)
       select * from unnest($1::text[], $2::boolean[]) as t(d, m), lateral (select now()) as x(c)
       on conflict (domain) do update set has_mx = excluded.has_mx, checked_at = excluded.checked_at`,
      [fetta.map(([d]) => d), fetta.map(([, v]) => v as boolean)],
    )
  }
  console.log(`  domini memorizzati: ${dom.length}`)

  // 4) Classificazione con la funzione reale.
  const conteggio: Record<string, number> = {}
  const perId: { id: string; stato: string; freq: number }[] = []
  for (const r of coda.rows) {
    const d = dominioDi(r.email)!
    const f = freq.get(d) || 1
    const stato = classifica(r.email, f, esito.get(d) ?? null)
    conteggio[stato] = (conteggio[stato] || 0) + 1
    perId.push({ id: r.id, stato, freq: f })
  }

  const tot = coda.rows.length
  console.log("\n=== ESITO SULLA CODA REALE ===")
  for (const k of ["sicuro", "rischio-alto", "dominio-morto", "non-verificato"]) {
    const n = conteggio[k] || 0
    console.log(`  ${k.padEnd(16)} ${String(n).padStart(6)}  ${((n / tot) * 100).toFixed(1)}%`)
  }

  // 5) Scrivo gli stati (serve per provare il filtro dell'invio sui dati veri).
  console.log("\nScrittura stati...")
  for (let i = 0; i < perId.length; i += 1000) {
    const fetta = perId.slice(i, i + 1000)
    await c.query(
      `update dem_recipients as r set validation_status = v.stato,
         validation_checked_at = now(), domain_addresses = v.freq
       from (select * from unnest($1::uuid[], $2::text[], $3::int[]) as t(id, stato, freq)) v
       where r.id = v.id`,
      [fetta.map((x) => x.id), fetta.map((x) => x.stato), fetta.map((x) => x.freq)],
    )
  }
  console.log("  fatto.")

  // 6) TASSO ATTESO: sulle email GIA' INVIATE, quale sarebbe stato il tasso di
  // rimbalzo se avessimo spedito solo alla fascia sicura? Questa e' la domanda
  // che conta, e si puo' rispondere perche' l'esito e' noto.
  console.log("\n=== TASSO ATTESO, misurato sugli invii GIA' FATTI ===")
  const att = await c.query(
    `with inviate as (
       select r.email, r.send_status,
              (select count(*) from dem_recipients x
                where x.campaign_id = r.campaign_id
                  and lower(split_part(x.email,'@',2)) = lower(split_part(r.email,'@',2))) freq
       from dem_recipients r
       where r.campaign_id = $1 and r.sent_at is not null and r.email is not null
     )
     select case when freq >= $2 then 'fascia sicura' else 'rischio alto' end fascia,
            count(*) inviate,
            count(*) filter (where send_status='bounced') rimbalzi
     from inviate group by 1 order by 1`,
    [camp.id, SOGLIA_DOMINIO_SICURO],
  )
  for (const r of att.rows) {
    const t = ((Number(r.rimbalzi) / Number(r.inviate)) * 100).toFixed(1)
    console.log(`  ${String(r.fascia).padEnd(14)} inviate:${String(r.inviate).padStart(5)}  rimbalzi:${String(r.rimbalzi).padStart(4)}  ${t}%`)
  }

  await c.end()
}
main().catch((e) => {
  console.error("ERRORE:", e.message)
  process.exit(1)
})
