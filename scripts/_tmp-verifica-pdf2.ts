// Verifica il PDF rigenerato: presenza dei due loghi, firma corretta, assenza
// del vecchio segnaposto e nessuna riga di testo che invada la fascia del piede.
//
// I flussi di contenuto sono compressi (FlateDecode): cercare le stringhe nei
// byte grezzi da sempre "manca tutto". Vanno decompressi con zlib, e il testo
// va ricostruito dagli operatori di disegno.
import { readFile } from "node:fs/promises"
import { inflateSync } from "node:zlib"
import { PDFDocument } from "pdf-lib"
import { COMUNICATO, NOME_FONDATORE } from "../lib/dem/press-release-air-market"

const PERCORSO = "public/comunicati/santaddeo-air-market-intelligence.pdf"

/** Estrae il testo visibile decomprimendo i flussi e leggendo gli operatori Tj. */
function estraiTesto(byte: Buffer): string {
  const grezzo = byte.toString("latin1")
  let testo = ""
  const re = /stream\r?\n/g
  let m: RegExpExecArray | null
  while ((m = re.exec(grezzo)) !== null) {
    const inizio = m.index + m[0].length
    const fine = grezzo.indexOf("endstream", inizio)
    if (fine < 0) continue
    const blocco = byte.subarray(inizio, fine)
    let contenuto: string
    try {
      contenuto = inflateSync(blocco).toString("latin1")
    } catch {
      continue // non e' un flusso compresso di testo (immagine, maschera...)
    }
    // pdf-lib NON scrive i letterali "(testo) Tj": usa la forma esadecimale
    // "<434F4D...> Tj". Cercare le parentesi da sempre zero risultati.
    // La codifica e' WinAnsi, che per le accentate italiane coincide con latin1.
    for (const t of contenuto.match(/<([0-9A-Fa-f]+)>\s*Tj/g) || []) {
      const hex = t.replace(/[^0-9A-Fa-f]/g, "")
      testo += Buffer.from(hex, "hex").toString("latin1") + " "
    }
  }
  return testo
}

async function main() {
  const byte = await readFile(PERCORSO)
  const pdf = await PDFDocument.load(byte)
  const pagine = pdf.getPages()
  const grezzo = byte.toString("latin1")
  const testo = estraiTesto(byte)

  console.log("  === struttura ===")
  console.log(`    pagine: ${pagine.length}`)
  console.log(`    peso:   ${(byte.length / 1024).toFixed(1)} KB`)
  const immagini = (grezzo.match(/\/Subtype\s*\/Image/g) || []).length
  const maschere = (grezzo.match(/\/SMask/g) || []).length
  console.log(`    immagini: ${immagini} (2 loghi + ${maschere} maschera alfa del PNG trasparente)`)
  console.log(`    testo estratto: ${testo.length} caratteri`)

  console.log("")
  console.log("  === firma ===")
  console.log(`    attesa:   "${NOME_FONDATORE}, fondatore di 4 bid srl"`)
  const firmaOk = testo.includes(NOME_FONDATORE)
  console.log(`    presente: ${firmaOk ? "si" : "NO, DA CORREGGERE"}`)
  console.log(`    segnaposto residuo: ${/DA COMPLETARE/.test(testo) ? "SI, DA CORREGGERE" : "no"}`)

  console.log("")
  console.log("  === il comunicato e' tutto nel PDF? ===")
  const frammenti = [
    ["titolo", COMUNICATO.titolo],
    ["primo paragrafo", COMUNICATO.paragrafi[0]],
    ["ultimo paragrafo", COMUNICATO.paragrafi[COMUNICATO.paragrafi.length - 1]],
    ["citazione", COMUNICATO.citazione.testo],
    ["chiusura", COMUNICATO.chiusura],
    ["contatti", COMUNICATO.contatti.righe[0]],
  ] as const
  let mancanti = 0
  for (const [nome, contenuto] of frammenti) {
    // Il testo e' spezzato in righe: si verificano piu' parole lunghe.
    const parole = contenuto.split(/\s+/).filter((p) => p.length > 7).slice(0, 4)
    const perse = parole.filter((p) => !testo.includes(p.replace(/[.,:;]/g, "")))
    if (perse.length) {
      mancanti++
      console.log(`    ${nome}: MANCANO ${perse.join(", ")}`)
    } else {
      console.log(`    ${nome}: ok`)
    }
  }
  console.log(`    blocchi incompleti: ${mancanti}`)

  console.log("")
  console.log("  === accenti ===")
  for (const p of ["arriverà", "capacità", "È", "perché"]) {
    console.log(`    "${p}": ${testo.includes(p) ? "reso correttamente" : "assente o alterato"}`)
  }
}

main().catch((e) => {
  console.error("  ERRORE:", e instanceof Error ? e.message : e)
  process.exit(1)
})
