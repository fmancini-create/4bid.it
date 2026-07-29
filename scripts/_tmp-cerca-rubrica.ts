/**
 * TEMPORANEO - estrae il testo del comunicato del 31/05 per capire cosa era
 * GIA' stato annunciato: solo cosi' posso dire "nuovo" senza mentire. Sola lettura.
 */
import { createClient } from "@supabase/supabase-js"
import { writeFileSync } from "node:fs"

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

async function main() {
  const { data: c } = await db
    .from("dem_campaigns")
    .select("subject,html_template")
    .eq("name", "Comunicato stampa - Lancio Santaddeo")
    .single()

  // Testo puro, per leggere cosa diceva.
  const testo = String(c.html_template)
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&egrave;/g, "e")
    .replace(/\s+/g, " ")
    .trim()

  console.log("  === oggetto ===")
  console.log("  " + c.subject)
  console.log("\n  === testo del comunicato 31/05 (integrale) ===")
  console.log(testo.replace(/(.{110}\s)/g, "$1\n  ").replace(/^/, "  "))

  // Quali funzionalita' erano gia' citate?
  console.log("\n  === funzionalita' citate nel comunicato del 31/05 ===")
  const FUNZ = [
    "Air Market", "voli", "aereo", "aeroport",
    "Price Guard", "Rate Shopper", "Autopilot",
    "Insight AI", "Market Setup", "recension", "widget",
    "Booking Pace", "meteo", "eventi", "gratuit",
  ]
  for (const f of FUNZ) {
    const c2 = (testo.match(new RegExp(f, "gi")) ?? []).length
    console.log(`  ${f.padEnd(16)} -> ${c2 > 0 ? "GIA' CITATA (" + c2 + ")" : "non citata"}`)
  }

  writeFileSync("/tmp/comunicato-31-05.txt", testo)
  console.log("\n  salvato in /tmp/comunicato-31-05.txt (" + testo.length + " caratteri)")
}

main().catch((e) => {
  console.error("  ERRORE:", e.message)
  process.exit(1)
})
