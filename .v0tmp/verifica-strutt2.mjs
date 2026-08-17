import { createClient } from "@supabase/supabase-js"
import { readFile } from "node:fs/promises"

// 1) EMAIL salvata nel DB (colonna vera: html_template)
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
const { data, error } = await db.from("dem_campaigns").select("html_template,subject,status,auto_send,sent_count,attach_as_link").ilike("name","%Ecosistema 4 BID%").single()
if (error) throw error
const h = data.html_template
// I quattro blocchi devono essere <p> DISTINTI: cerco i tag, non solo il testo.
const paragrafi = [...h.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/g)].map(m => m[1].replace(/<[^>]+>/g,"").replace(/&quot;/g,'"').replace(/\s+/g," ").trim())
const atteso = ["La domanda cambia quindi da:", '"Quanto abbiamo guadagnato il mese scorso?"', "a:", '"Come sta andando economicamente la struttura adesso, e perché?"']
const i0 = paragrafi.indexOf(atteso[0])
console.log("EMAIL · i 4 blocchi come <p> distinti e consecutivi:",
  i0 >= 0 && atteso.every((t, k) => paragrafi[i0 + k] === t) ? "SI" : "NO")
if (i0 >= 0) for (let k = 0; k < 4; k++) console.log(`   p[${i0 + k}] =`, JSON.stringify(paragrafi[i0 + k]))
console.log("EMAIL · asterischi di enfasi residui:", (h.match(/\*\*/g) || []).length)
console.log("EMAIL · stato:", data.status, "| auto_send:", data.auto_send, "| inviate:", data.sent_count, "| allegato come link:", data.attach_as_link)

// 2) PDF: leggo i flussi di testo con pdfjs (pdftotext non esiste in questa macchina)
const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs")
const doc = await pdfjs.getDocument({ data: new Uint8Array(await readFile("public/comunicati/4bid-ecosistema-hotel-ai.pdf")), useSystemFonts: true }).promise
let righe = []
for (let p = 1; p <= doc.numPages; p++) {
  const c = await (await doc.getPage(p)).getTextContent()
  // raggruppo per coordinata verticale: una riga = stessa y
  const perY = new Map()
  for (const it of c.items) { const y = Math.round(it.transform[5]); perY.set(y, (perY.get(y) || "") + it.str) }
  righe.push(...[...perY.entries()].sort((a,b)=>b[0]-a[0]).map(([,t]) => t.replace(/\s+/g," ").trim()))
}
console.log("PDF · righe totali:", righe.length)
for (const t of atteso) console.log(`PDF · riga propria ${JSON.stringify(t)}:`, righe.includes(t) ? "SI" : "NO")
console.log("PDF · asterischi residui:", righe.join("\n").match(/\*\*/g)?.length || 0)
