// PROVA TEMPORANEA: scrive sullo stesso percorso del comunicato una pagina che
// contiene SOLO la fascia del piede, alle dimensioni reali, per guardare da
// vicino il loghettino 4 bid (nitidezza e assenza di un rettangolo bianco
// visibile sul bianco della pagina).
//
// Si sovrascrive il percorso esistente perche' il server congela l'elenco di
// public/: un file nuovo darebbe 404. SUBITO DOPO va rigenerato l'originale.
import { PDFDocument, StandardFonts, rgb } from "pdf-lib"
import { readFile, writeFile } from "node:fs/promises"

const A4_L = 595.28
const MARGINE = 62

async function main() {
  const pdf = await PDFDocument.create()
  const normale = await pdf.embedFont(StandardFonts.Helvetica)
  const byte = await readFile("public/4bid-logo-email.png")
  const logo = await pdf.embedJpg(byte)

  // Ritaglio della fascia bassa della pagina A4, ingrandito 3 volte.
  const SCALA = 3
  const ALTEZZA_FASCIA = 90
  const pagina = pdf.addPage([A4_L * SCALA, ALTEZZA_FASCIA * SCALA])

  // Sfondo bianco come la pagina vera: un eventuale rettangolo del JPEG
  // risalterebbe solo su bianco puro.
  pagina.drawRectangle({ x: 0, y: 0, width: A4_L * SCALA, height: ALTEZZA_FASCIA * SCALA, color: rgb(1, 1, 1) })

  const ALTEZZA_LOGO = 26
  const larghezza = (logo.width / logo.height) * ALTEZZA_LOGO
  pagina.drawImage(logo, {
    x: (A4_L - MARGINE - larghezza) * SCALA,
    y: (MARGINE - 30) * SCALA,
    width: larghezza * SCALA,
    height: ALTEZZA_LOGO * SCALA,
  })
  pagina.drawText("Santaddeo - Comunicato stampa - 29 luglio 2026 - pagina 1 di 2", {
    x: MARGINE * SCALA,
    y: (MARGINE - 22) * SCALA,
    size: 8 * SCALA,
    font: normale,
    color: rgb(0.62, 0.62, 0.62),
  })

  await writeFile("public/comunicati/santaddeo-air-market-intelligence.pdf", await pdf.save())
  console.log(`  prova scritta (logo ${larghezza.toFixed(1)}x${ALTEZZA_LOGO}pt, ingrandita ${SCALA}x)`)
}

main().catch((e) => {
  console.error("  ERRORE:", e instanceof Error ? e.message : e)
  process.exit(1)
})
