/**
 * Sonda: nessuna firma deve identificare un fornitore con una PAROLA GENERICA.
 *
 * Nasce da un difetto reale: la firma Beds24 aveva `/(booking|booking2\.php)`,
 * un pattern che combacia con qualunque percorso `/booking`. Risultato: veniva
 * attribuito a Beds24 sia Passepartout (un altro gestionale italiano) sia
 * una semplice immagine chiamata `booking-banner-2024.jpg`.
 *
 * La regola: un pattern che deve identificare un fornitore deve contenere un
 * DOMINIO (cioe' un punto letterale `\.`), non una parola sola.
 *
 * Scritta come file e non come comando: provandola da riga di comando le barre
 * rovesciate venivano mangiate dai livelli di virgolette e la sonda dichiarava
 * "23 pattern generici" elencando pattern che contenevano il dominio. Una sonda
 * che sbaglia il confronto e' peggio di nessuna sonda, perche' si crede.
 */
import pg from "pg"

const conn = (process.env.SUPABASE_POSTGRES_URL_NON_POOLING || "")
  .replace(/[?&]sslmode=[^&]*/g, (m) => (m[0] === "?" ? "?" : ""))
  .replace(/\?$/, "")

// Un pattern e' ancorato a un dominio se contiene un punto LETTERALE, cioe' la
// sequenza barra-rovesciata + punto. In una stringa JS quella sequenza si
// scrive "\\." e nel valore letto dal database e' esattamente due caratteri.
const HA_DOMINIO = (p) => p.includes("\\.")

/**
 * ECCEZIONI DICHIARATE, non tolleranze.
 *
 * Un percorso senza dominio e' ammesso SOLO se e' cosi' distintivo da non poter
 * comparire per caso, e serve a riconoscere i motori WHITE-LABEL: quelli che
 * girano su un sottodominio dell'albergo (`booking.hotel.it`), dove il dominio
 * del fornitore non compare da nessuna parte. Senza questi percorsi quei motori
 * resterebbero invisibili.
 *
 * La differenza con il difetto Beds24: `/booking` e' una parola che compare su
 * mezzo web, `/preventivov2/?cod=` no. Ogni voce qui va motivata; una lista che
 * cresce senza motivazioni e' il difetto che questa sonda dovrebbe fermare.
 */
const ECCEZIONI = new Map([
  ["mews|/distributor/", "percorso del motore Mews, riconosce le installazioni white-label"],
  [
    "scidoo|/preventivov2/.*[?&]cod=",
    "percorso + parametro obbligatorio di Scidoo: due condizioni insieme, non una parola",
  ],
])

const c = new pg.Client({ connectionString: conn, ssl: { rejectUnauthorized: false } })
await c.connect()

const { rows } = await c.query(
  "SELECT slug, host_patterns, url_patterns FROM hospitality_provider_signatures ORDER BY slug",
)

console.log(`=== ${rows.length} firme, cerco pattern SENZA dominio ===`)
let generici = 0

for (const r of rows) {
  for (const p of r.host_patterns || []) {
    if (!HA_DOMINIO(p)) {
      generici++
      console.log(`  GENERICO  host  ${r.slug.padEnd(18)}${p}`)
    }
  }
  for (const p of r.url_patterns || []) {
    if (HA_DOMINIO(p)) continue
    const motivo = ECCEZIONI.get(`${r.slug}|${p}`)
    if (motivo) {
      console.log(`  ammesso   url   ${r.slug.padEnd(18)}${p}`)
      console.log(`                  motivo: ${motivo}`)
      continue
    }
    generici++
    console.log(`  GENERICO  url   ${r.slug.padEnd(18)}${p}`)
  }
}

console.log()
console.log(`  pattern generici: ${generici}${generici === 0 ? "   OK" : "   <== DA CORREGGERE"}`)

// CONTROLLO POSITIVO: la sonda sa riconoscere un pattern generico quando c'e'
// davvero? Senza questo, uno zero non distingue "tutto a posto" da "sonda rotta"
// -- ed e' esattamente l'errore che ho appena fatto al contrario.
const finti = ["/booking", "booking2", "^prenota$"]
const buoni = ["(^|\\.)beds24\\.com$", "^book\\.octorate\\.com$"]
const coltiFinti = finti.filter((p) => !HA_DOMINIO(p)).length
const salvatiBuoni = buoni.filter((p) => HA_DOMINIO(p)).length

console.log()
console.log("=== controllo positivo della sonda stessa ===")
console.log(`  pattern generici finti colti:   ${coltiFinti} su ${finti.length}`)
console.log(`  pattern col dominio non accusati: ${salvatiBuoni} su ${buoni.length}`)

const sondaSana = coltiFinti === finti.length && salvatiBuoni === buoni.length
console.log(`  la sonda funziona: ${sondaSana ? "SI" : "NO <== non fidarsi del suo zero"}`)

await c.end()
process.exit(generici === 0 && sondaSana ? 0 : 1)
