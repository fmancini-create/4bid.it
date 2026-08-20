import { describe, expect, it } from "vitest"
import { readdirSync, readFileSync, statSync } from "node:fs"
import { join } from "node:path"

/**
 * Contratto: ogni pagina che si dichiara `Article` deve passare una data VERA.
 *
 * Perche' esiste: il componente non inventa piu' le date (PR #230), quindi una
 * pagina `Article` senza `datePublished` non sbaglia la data — semplicemente
 * non ce l'ha, e per `Article` quel campo Google lo usa. Senza questo contratto
 * una pagina nuova nascerebbe muta e nessuno se ne accorgerebbe: non e' un
 * errore, non rompe niente, non si vede.
 *
 * Misura il SORGENTE e non il JSON reso, perche' il difetto sta nel punto di
 * chiamata: il componente si comporta gia' correttamente. E rimuove i commenti
 * prima di cercare, altrimenti la prosa che spiega la regola (per esempio il
 * commento in metodo-4bid che nomina `Article` e `datePublished`) la farebbe
 * arrossire a caso.
 */

const RADICE = join(process.cwd(), "app")

/** Via i commenti: la prosa che spiega la regola non e' codice. */
function senzaCommenti(codice: string): string {
  return codice
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, "")
    .replace(/^\s*\/\/.*$/gm, "")
}

function paginePresenti(dir: string, trovate: string[] = []): string[] {
  for (const voce of readdirSync(dir)) {
    const percorso = join(dir, voce)
    if (statSync(percorso).isDirectory()) paginePresenti(percorso, trovate)
    else if (voce === "page.tsx") trovate.push(percorso)
  }
  return trovate
}

describe("contratto: ogni Article dichiara una data vera", () => {
  const pagine = paginePresenti(RADICE)

  it("trova le pagine da controllare (se 0, la prova sarebbe vacua)", () => {
    expect(pagine.length).toBeGreaterThan(20)
  })

  it("nessuna pagina Article e' senza datePublished", () => {
    const mute: string[] = []

    for (const percorso of pagine) {
      const codice = senzaCommenti(readFileSync(percorso, "utf8"))
      if (!/type=["']Article["']/.test(codice)) continue

      // Le rotte dinamiche passano la data del contenuto tramite variabile,
      // quindi basta che il campo sia presente in qualunque forma.
      if (/datePublished=/.test(codice)) continue

      mute.push(percorso.replace(RADICE, "app"))
    }

    expect(mute, `pagine Article senza datePublished:\n${mute.join("\n")}`).toEqual([])
  })

  it("nessuna data e' l'istante di adesso (il ripiego non e' tornato)", () => {
    const oggi = new Date().toISOString().slice(0, 10)
    const sospette: string[] = []

    for (const percorso of pagine) {
      const codice = senzaCommenti(readFileSync(percorso, "utf8"))
      if (!/datePublished=/.test(codice)) continue

      // Una data letterale uguale a oggi, o un new Date() usato come data,
      // e' il difetto di partenza in altra forma.
      if (new RegExp(`datePublished=["']${oggi}["']`).test(codice)) {
        sospette.push(`${percorso.replace(RADICE, "app")} (data = oggi)`)
      }
      if (/datePublished=\{[^}]*new Date\(\)/.test(codice)) {
        sospette.push(`${percorso.replace(RADICE, "app")} (new Date())`)
      }
    }

    expect(sospette, `date non affidabili:\n${sospette.join("\n")}`).toEqual([])
  })
})
