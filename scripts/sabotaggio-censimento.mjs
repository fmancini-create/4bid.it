// Applica un sabotaggio alla logica di riconoscimento e pretende che il
// contratto lo colga. Sta in un file, non dentro `node -e`, perche' i sostituti
// contengono backtick e template literal: dentro la shell si spezzano e lo
// script CROLLA. Un sabotaggio che crolla non e' "non colto", e' non applicato:
// leggere le due cose come la stessa e' il modo migliore per dichiarare un buco
// che non esiste (o per non vedere quello che c'e').
import fs from "node:fs"

const FILE = "lib/hospitality/providers.ts"

// [nome, testo da cercare, sostituto]
const SABOTAGGI = [
  [
    "SAB3 il dominio della struttura stessa conta come fornitore",
    "if (h === base || h === `www.${base}` || h.endsWith(`.${base}`)) continue",
    "if (false) continue",
  ],
  [
    "SAB6 gli host sconosciuti si raccolgono anche se il fornitore e' noto",
    "if (riscontri.some((r) => r.confidence >= SOGLIA_ATTENDIBILE)) return []",
    "if (false) return []",
  ],
  [
    "SAB7 una regex sbagliata fa cadere tutto invece di essere saltata",
    "    return null\n  }\n}",
    "    throw new Error('regex non valida')\n  }\n}",
  ],
  [
    "SAB8 l'elenco dei non-fornitori (social, analitiche) viene ignorato",
    "      if (HOST_MAI_FORNITORI.test(h)) continue",
    "      if (false) continue",
  ],
  [
    "SAB9 l'indizio di prenotazione si cerca di nuovo nell'URL intero (query compresa)",
    "if (INDIZI_PRENOTAZIONE.test(h + parsed.pathname)) suoi.add(h)",
    "if (INDIZI_PRENOTAZIONE.test(u)) suoi.add(h)",
  ],
  [
    "SAB10 la prova torna a essere la pagina visitata invece dell'host del fornitore",
    '          evidence_url: h,\n          source_url: urlPagina,',
    "          evidence_url: urlPagina,\n          source_url: urlPagina,",
  ],
]

const quale = process.argv[2]
const originale = fs.readFileSync(FILE, "utf8")

for (const [nome, cerca, sostituto] of SABOTAGGI) {
  if (quale && !nome.startsWith(quale)) continue
  const rotto = originale.replace(cerca, sostituto)
  if (rotto === originale) {
    console.log(`  ${nome}\n    NON APPLICATO: la stringa non esiste piu' nel file. Il sabotaggio va riscritto.`)
    continue
  }
  fs.writeFileSync(FILE, rotto)
  console.log(`  ${nome}\n    applicato (${originale.length} -> ${rotto.length} caratteri)`)
}

fs.writeFileSync("/tmp/originale-providers.ts", originale)
