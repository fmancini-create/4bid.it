import { readFile } from "node:fs/promises"
const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs")
const file = process.argv[2] || "public/comunicati/4bid-ecosistema-hotel-ai.pdf"
const data = new Uint8Array(await readFile(file))
const doc = await pdfjs.getDocument({ data, useSystemFonts: true }).promise
const MARGINE = 62
let tutto = ""
let fuori = 0
// Ricostruzione GEOMETRICA: lo spazio si mette solo se fra due frammenti c'e' un
// buco reale. Unire i frammenti con uno spazio fisso e' sbagliato: ogni cambio di
// stile e' un frammento nuovo, e "AI," (grassetto + tondo attaccati) sembrerebbe
// "AI ," anche quando nel PDF non c'e' nessuno spazio.
for (let i = 1; i <= doc.numPages; i++) {
  const p = await doc.getPage(i)
  const vp = p.getViewport({ scale: 1 })
  const c = await p.getTextContent()
  let fineX = null, ultimaY = null
  for (const it of c.items) {
    if (!it.str) continue
    const x = it.transform[4], yy = it.transform[5]
    // Il piede di pagina si SALTA: e' disegnato dopo tutto il contenuto, quindi
    // nell'ordine di estrazione finisce in mezzo a un paragrafo che continua
    // sulla pagina successiva e spezzerebbe il confronto senza che il PDF abbia
    // nulla di sbagliato.
    if (yy < MARGINE) continue
    const fine = x + (it.width || 0)
    if (x < MARGINE - 1 || fine > vp.width - MARGINE + 1) { fuori++; console.log("FUORI MARGINE p"+i, x.toFixed(1), fine.toFixed(1), JSON.stringify(it.str.slice(0,60))) }
    if (fineX !== null) {
      const nuovaRiga = ultimaY !== null && Math.abs(yy - ultimaY) > 1
      const buco = x - fineX
      if (nuovaRiga || buco > 0.4) tutto += " "
    }
    tutto += it.str
    fineX = fine; ultimaY = yy
  }
  tutto += " "
}
console.log("pagine:", doc.numPages, "| frammenti fuori margine:", fuori)
tutto = tutto.replace(/\s+/g, " ")

const { COMUNICATO_ECOSISTEMA: C, senzaEnfasi } = await import("../lib/dem/press-release-ecosistema.ts")
const pezzi = [C.etichetta, C.luogoData, C.titolo, C.sommario, ...C.sezioni.flatMap(s => [s.titolo ?? "", ...s.paragrafi]), C.scheda.titolo, C.scheda.testo, C.contatti.titolo, ...C.contatti.righe]
const norm = (s) => senzaEnfasi(s).replace(/[\u2018\u2019]/g,"'").replace(/[\u201C\u201D]/g,'"').replace(/\s+/g," ").trim()
let mancanti = 0
for (const pezzo of pezzi) {
  const t = norm(pezzo)
  if (!t) continue
  if (!tutto.includes(t)) {
    mancanti++
    const parole = t.split(" ")
    let rotto = null
    for (let k = 1; k <= parole.length; k++) { if (!tutto.includes(parole.slice(0,k).join(" "))) { rotto = parole.slice(Math.max(0,k-4), k+2).join(" "); break } }
    console.log("MANCA:", JSON.stringify(t.slice(0,70)), "-> si rompe a:", JSON.stringify(rotto))
  }
}
console.log("blocchi di testo:", pezzi.filter(p=>norm(p)).length, "| mancanti:", mancanti)
console.log("accenti (perché / già / è):", tutto.includes("perché"), tutto.includes("già"), tutto.includes("è "))
console.log("asterischi residui:", (tutto.match(/\*/g) || []).length)
console.log("spazio prima di virgola/punto:", (tutto.match(/ [,.]/g) || []).length)
