// Prova il freno sui richiami chiamando la FUNZIONE REALE usata dal cron
// (`checkWarmBounceRate`), non una sua riscrittura: una copia proverebbe la copia.
// Sola lettura: non invia e non modifica nulla.
import { createClient } from "@supabase/supabase-js"
import { checkWarmBounceRate, WARM_BOUNCE_MIN_SAMPLE, WARM_BOUNCE_THRESHOLD } from "../lib/dem/warm"

async function main() {
  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  })

  console.log(`=== soglia: ${WARM_BOUNCE_THRESHOLD * 100}%  campione minimo: ${WARM_BOUNCE_MIN_SAMPLE} email ===\n`)

  const { data: followups, error } = await supabase
    .from("dem_followups")
    .select("id, name, status, paused_reason")
    .order("created_at")
  if (error) {
    console.error("ERRORE lettura richiami:", error.message)
    process.exit(1)
  }

  for (const f of followups || []) {
    const r = await checkWarmBounceRate(supabase, f.id)
    const tasso = r.measured > 0 ? ((r.bounced / r.measured) * 100).toFixed(1) + "%" : "-"
    console.log(`richiamo: ${String(f.name).slice(0, 40)}  (stato attuale: ${f.status})`)
    console.log(`  misurate:${r.measured}  rimbalzi:${r.bounced}  tasso:${tasso}`)
    if (r.unreadable) {
      console.log(`  ESITO: NON MISURABILE -> non invia (per prudenza). ${r.reason}`)
    } else if (r.blocked) {
      console.log(`  ESITO: SOSPENDE -> ${r.reason}`)
    } else if (r.measured < WARM_BOUNCE_MIN_SAMPLE) {
      console.log(`  ESITO: passa, campione sotto il minimo (${r.measured} < ${WARM_BOUNCE_MIN_SAMPLE})`)
    } else {
      console.log(`  ESITO: passa, sotto soglia`)
    }
    console.log(`  motivo registrato ora nel db: ${f.paused_reason ?? "(nessuno)"}\n`)
  }

  // CONTROPROVA: un identificativo inesistente non deve "passare" silenziosamente
  // come se fosse sano.
  const finto = await checkWarmBounceRate(supabase, "00000000-0000-0000-0000-000000000000")
  console.log("=== CONTROPROVA: richiamo inesistente ===")
  console.log(`  bloccato:${finto.blocked}  non misurabile:${finto.unreadable}  misurate:${finto.measured}`)
  console.log("  (atteso: passa senza bloccare, perche' non ha mai inviato nulla)")
}

main().catch((e) => {
  console.error("ERRORE:", e.message)
  process.exit(1)
})
