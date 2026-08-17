import { createClient } from "@supabase/supabase-js"
import { execSync } from "node:child_process"

// 1) PDF: il testo estratto deve contenere le due domande su righe proprie
const txt = execSync("pdftotext -layout public/comunicati/4bid-ecosistema-hotel-ai.pdf - 2>/dev/null || true").toString()
const righe = txt.split("\n").map(r => r.trim())
const cerca = (s) => righe.some(r => r === s)
console.log("PDF · 'La domanda cambia quindi da:' riga propria:", cerca("La domanda cambia quindi da:") ? "SI" : "NO")
console.log("PDF · '\"Quanto abbiamo guadagnato il mese scorso?\"' riga propria:", cerca('"Quanto abbiamo guadagnato il mese scorso?"') ? "SI" : "NO")
console.log("PDF · 'a:' riga propria:", cerca("a:") ? "SI" : "NO")
console.log("PDF · asterischi residui:", (txt.match(/\*\*/g) || []).length)

// 2) Email salvata nel DB: quattro <p> distinti, zero asterischi
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
const { data, error } = await db.from("dem_campaigns").select("html_content,subject,status,auto_send,sent_count").ilike("name","%Ecosistema 4 BID%").single()
if (error) throw error
const h = data.html_content
for (const frase of ["La domanda cambia quindi da:", "Quanto abbiamo guadagnato il mese scorso?", ">a:<", "Come sta andando economicamente la struttura adesso, e perch"]) {
  console.log(`EMAIL · presente ${JSON.stringify(frase)}:`, h.includes(frase) ? "SI" : "NO")
}
console.log("EMAIL · asterischi di enfasi residui:", (h.match(/\*\*/g) || []).length)
console.log("EMAIL · stato:", data.status, "| auto_send:", data.auto_send, "| inviate:", data.sent_count)
