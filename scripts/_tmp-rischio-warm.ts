// Quante email farebbe partire un'esecuzione del cron dei richiami? Serve a
// sapere se la prova end-to-end e' innocua o se spedisce davvero.
import { createClient } from "@supabase/supabase-js"
import { fetchEligibleWarmRecipients } from "../lib/dem/warm"

async function main() {
  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  })

  const { data: followups } = await supabase
    .from("dem_followups")
    .select("id, name, status")
    .eq("status", "active")
    .order("created_at")

  for (const f of followups || []) {
    const { data: steps } = await supabase
      .from("dem_followup_steps")
      .select("step_number, delay_days, enabled")
      .eq("followup_id", f.id)
      .order("step_number")

    let totale = 0
    const dettaglio: string[] = []
    for (const s of steps || []) {
      if (!s.enabled) {
        dettaglio.push(`passo ${s.step_number}: disattivato`)
        continue
      }
      // Stessa funzione usata dal cron per scegliere chi riceve.
      const idonei = await fetchEligibleWarmRecipients(supabase, f.id, s.step_number, s.delay_days, 1000)
      totale += idonei.length
      dettaglio.push(`passo ${s.step_number}: ${idonei.length} idonei`)
    }
    console.log(`richiamo: ${String(f.name).slice(0, 40)}  (${f.status})`)
    for (const d of dettaglio) console.log(`  ${d}`)
    console.log(`  TOTALE email che partirebbero: ${totale}\n`)
  }
}

main().catch((e) => {
  console.error("ERRORE:", e.message)
  process.exit(1)
})
