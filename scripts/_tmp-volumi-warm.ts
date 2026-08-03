// Misura i volumi REALI dei richiami, per scegliere soglie che possano davvero
// scattare. Con i parametri della lista fredda (minimo 200 email misurate su 3
// giorni) un freno sui richiami non scatterebbe MAI: sarebbe identico a non
// averlo.
import { Client } from "pg"

async function main() {
  const c = new Client({
    connectionString: process.env.SUPABASE_POSTGRES_URL_NON_POOLING!,
    ssl: { rejectUnauthorized: false },
  })
  await c.connect()

  console.log("=== per RICHIAMO: volumi complessivi e rimbalzi ===")
  const per = await c.query(`
    select f.id,
           coalesce(f.name, '(senza nome)') nome,
           f.status,
           count(*) filter (where r.send_status in ('sent','bounced','opened')) inv,
           count(*) filter (where r.send_status='bounced') rim,
           min(r.sent_at)::date dal,
           max(r.sent_at)::date al
    from dem_followups f
    left join dem_campaigns ca on ca.followup_id = f.id
    left join dem_recipients r on r.campaign_id = ca.id
    group by f.id, f.name, f.status
    order by inv desc`)
  for (const x of per.rows) {
    const inv = Number(x.inv)
    const rim = Number(x.rim)
    const tasso = inv > 0 ? ((rim / inv) * 100).toFixed(1) + "%" : "-"
    console.log(
      `  ${String(x.nome).slice(0, 30).padEnd(30)} ${String(x.status).padEnd(10)} inviate:${String(inv).padStart(5)} rimbalzi:${String(rim).padStart(4)} ${tasso.padStart(6)}  ${x.dal ?? "-"} -> ${x.al ?? "-"}`,
    )
  }

  console.log("\n=== quante email inviano i richiami in 3 giorni? (finestra della lista fredda) ===")
  const fin = await c.query(`
    select count(*) filter (where r.sent_at > now() - interval '3 days') tre_giorni,
           count(*) filter (where r.sent_at > now() - interval '7 days') sette_giorni,
           count(*) filter (where r.sent_at > now() - interval '30 days') trenta_giorni,
           count(*) filter (where r.send_status in ('sent','bounced','opened')) sempre
    from dem_campaigns ca join dem_recipients r on r.campaign_id = ca.id
    where ca.followup_id is not null`)
  const f = fin.rows[0]
  console.log(`  ultimi 3 giorni : ${f.tre_giorni}`)
  console.log(`  ultimi 7 giorni : ${f.sette_giorni}`)
  console.log(`  ultimi 30 giorni: ${f.trenta_giorni}`)
  console.log(`  da sempre       : ${f.sempre}`)
  console.log(
    `  -> con minimo 200 su 3 giorni il freno ${Number(f.tre_giorni) >= 200 ? "POTREBBE scattare" : "NON scatterebbe MAI: soglie da adattare"}`,
  )

  console.log("\n=== giorni di invio dei richiami (ultimi 30) ===")
  const g = await c.query(`
    select r.sent_at::date d, count(*) n,
           count(*) filter (where r.send_status='bounced') rim
    from dem_campaigns ca join dem_recipients r on r.campaign_id = ca.id
    where ca.followup_id is not null and r.sent_at > now() - interval '30 days'
    group by 1 order by 1 desc limit 12`)
  if (g.rows.length === 0) console.log("  nessun invio nei 30 giorni")
  for (const x of g.rows) {
    const n = Number(x.n)
    const rim = Number(x.rim)
    console.log(
      `  ${String(x.d).slice(0, 10)}  inviate:${String(n).padStart(4)}  rimbalzi:${String(rim).padStart(3)}  ${n > 0 ? ((rim / n) * 100).toFixed(1) + "%" : "-"}`,
    )
  }

  await c.end()
}

main().catch((e) => {
  console.error("ERRORE:", e.message)
  process.exit(1)
})
