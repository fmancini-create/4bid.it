/**
 * Sonda: estrae TUTTI i blocchi JSON-LD di una pagina e li valida.
 *
 * Scritta come file e non inline perche' il quoting Bash su sonde inline mi si
 * e' rotto due volte. Estrae il contenuto dei tag <script type="application/
 * ld+json"> con un parsing non ingordo, invece di una regex che si mangia
 * anche i tag successivi.
 */
const url = process.argv[2]
if (!url) {
  console.error("uso: node scripts/sonda-jsonld.mjs <url>")
  process.exit(2)
}

const html = await (await fetch(url)).text()

const blocchi = []
const apertura = /<script[^>]*type="application\/ld\+json"[^>]*>/g
let m
while ((m = apertura.exec(html)) !== null) {
  const inizio = m.index + m[0].length
  const fine = html.indexOf("</script>", inizio)
  if (fine === -1) continue
  blocchi.push(html.slice(inizio, fine))
}

if (blocchi.length === 0) {
  console.log("  NESSUN blocco JSON-LD trovato: la sonda non conclude nulla")
  process.exit(1)
}

let validi = 0
let conData = 0
for (const b of blocchi) {
  let o
  try {
    o = JSON.parse(b)
  } catch (e) {
    console.log(`  JSON NON VALIDO: ${e.message}`)
    continue
  }
  validi++
  const nodi = o["@graph"] ? o["@graph"] : [o]
  for (const n of nodi) {
    const campi = Object.keys(n)
    const date = campi.filter((c) => c === "datePublished" || c === "dateModified")
    if (date.length > 0) conData++
    console.log(
      `  @type=${n["@type"]} campi=${campi.length}` +
        (date.length > 0 ? ` DATE=${date.join(",")}` : ""),
    )
  }
}

console.log(`\n  blocchi: ${blocchi.length}, JSON valido: ${validi}/${blocchi.length}`)
console.log(`  nodi con date: ${conData}`)
process.exit(validi === blocchi.length ? 0 : 1)
