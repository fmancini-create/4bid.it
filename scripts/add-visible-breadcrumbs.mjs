import fs from "node:fs"
import path from "node:path"

const APP = path.resolve("app")

// Elenco file target (relativi ad app/)
const targets = `
adr-hotel-come-aumentarlo
analisi-competitiva-hotel-firenze
blog/[slug]
blog
consulenza-personalizzata-hotel
cose-il-revenue-management
dynamic-pricing-hotel
forecast-budgeting-hotel
formazione-revenue-management-hotel
gestione-canali-distribuzione-hotel
guida-prenotazioni-dirette-hotel
guida-pricing-hotel
guida-revenue-management-hotel
kpi-hotel-revenue-management
kpi-metriche-hotel
ottimizzazione-adr-hotel
ottimizzazione-ota-hotel
ottimizzazione-prezzi-hotel-toscana
parlano-di-noi
prenota-demo
privacy
progetti/autoexel
progetti/hotel-accelerator
progetti/hotelprofit-ai
progetti/manubot
progetti/mypetsenseai
progetti/santaddeo
proponi-idea
revenue-management-agriturismo
revenue-management-bed-breakfast
revenue-management-boutique-hotel
revenue-management-catene-hotel
software-revenue-management-hotel
software-revenue-management-santaddeo
soluzioni-revenue-management
strategie-pricing-hotel
terms
yield-management-hotel
`
  .trim()
  .split("\n")
  .map((s) => s.trim())

// Estrae il contenuto {[ ... ]} bilanciando le parentesi a partire da breadcrumbs={
function extractBreadcrumbsBlock(src) {
  const key = "breadcrumbs={"
  const start = src.indexOf(key)
  if (start === -1) return null
  let i = start + key.length
  // i punta subito dopo la prima {
  let depth = 1
  for (; i < src.length; i++) {
    const c = src[i]
    if (c === "{") depth++
    else if (c === "}") {
      depth--
      if (depth === 0) break
    }
  }
  return src.slice(start + key.length, i) // contenuto tra le graffe esterne, es. "[ ... ]"
}

// Ricava coppie {name, url} solo se sono STRINGHE LETTERALI semplici
function parsePairs(block) {
  const pairs = []
  const re = /\{\s*name:\s*(["'`])(.*?)\1\s*,\s*url:\s*(["'`])(.*?)\3\s*\}/gs
  let m
  let count = 0
  while ((m = re.exec(block))) {
    count++
    pairs.push({ name: m[2], url: m[4] })
  }
  // Se il numero di oggetti nel blocco non coincide con quelli parsati => contiene roba dinamica
  const objCount = (block.match(/\{\s*name:/g) || []).length
  if (objCount !== count) return null
  return pairs
}

function urlToHref(url) {
  if (url.startsWith("http")) {
    const h = url.replace(/^https?:\/\/www\.4bid\.it/, "")
    return h === "" ? "/" : h
  }
  return url
}

const skipped = []
const done = []

for (const t of targets) {
  const file = path.join(APP, t, "page.tsx")
  if (!fs.existsSync(file)) {
    skipped.push(`${t} (file mancante)`)
    continue
  }
  let src = fs.readFileSync(file, "utf8")

  if (src.includes("@/components/breadcrumbs")) {
    skipped.push(`${t} (gia' presente)`)
    continue
  }

  const block = extractBreadcrumbsBlock(src)
  if (!block) {
    skipped.push(`${t} (no breadcrumbs prop)`)
    continue
  }
  const pairs = parsePairs(block)
  if (!pairs) {
    skipped.push(`${t} (breadcrumb dinamico -> manuale)`)
    continue
  }

  // Trova un <Header ... /> per inserire subito dopo
  const headerRe = /<Header\s*\/>/
  if (!headerRe.test(src)) {
    skipped.push(`${t} (nessun <Header />)`)
    continue
  }

  // 1) import dopo la riga di import di seo-structured-data
  const importLine = 'import { Breadcrumbs } from "@/components/breadcrumbs"'
  const sdImport = /import\s*\{\s*StructuredData\s*\}\s*from\s*"@\/components\/seo-structured-data"\n/
  if (sdImport.test(src)) {
    src = src.replace(sdImport, (mm) => mm + importLine + "\n")
  } else {
    // fallback: dopo il primo import
    src = src.replace(/(^import .*\n)/, (mm) => mm + importLine + "\n")
  }

  // 2) items JSX
  const itemsStr = pairs
    .map((p) => `          { name: ${JSON.stringify(p.name)}, href: ${JSON.stringify(urlToHref(p.url))} },`)
    .join("\n")
  const bc = `\n      <Breadcrumbs\n        items={[\n${itemsStr}\n        ]}\n      />\n`

  src = src.replace(headerRe, (mm) => mm + "\n" + bc)

  fs.writeFileSync(file, src)
  done.push(`${t} (${pairs.length} voci)`)
}

console.log("=== AGGIORNATE ===")
console.log(done.join("\n") || "nessuna")
console.log("\n=== SALTATE ===")
console.log(skipped.join("\n") || "nessuna")
