const fs = require("fs")
const path = require("path")

const DIR = __dirname
const BASE = "_base.csv"
const OUT = "enriched-hotels.csv"

// ---- CSV parsing (quote-aware) ----
function parseLine(line) {
  const out = []
  let cur = ""
  let q = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (q) {
      if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++ }
      else if (ch === '"') q = false
      else cur += ch
    } else {
      if (ch === '"') q = true
      else if (ch === ",") { out.push(cur); cur = "" }
      else cur += ch
    }
  }
  out.push(cur)
  return out
}

function clean(v) {
  if (v == null) return ""
  return String(v).replace(/\s+/g, " ").trim()
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const EMAIL_FIND = /[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}/

// ---- Output schema ----
const FIELDS = ["email","nome_azienda","referente_nome","referente_cognome","stelle","categoria","indirizzo","cap","citta","provincia","regione","telefono","sito"]

// ---- Header keyword mapping ----
function classifyHeader(h) {
  h = clean(h).toLowerCase()
  if (!h) return null
  if (h === "e-mail" || h === "email" || h.startsWith("email") || h === "mail" || h === "posta elettronica") return "email"
  if (h.includes("ragione sociale") || h === "azienda" || h === "albergo" || h === "nome hotel" || h === "name" || h === "denominazione" || h === "hotel" || h === "struttura" || h === "nome struttura") return "nome_azienda"
  if (h === "cognome") return "referente_cognome"
  if (h === "nome" || h === "name_for_emails") return "referente_nome"
  if (h === "contatto" || h.includes("referente")) return "_contatto_full"
  if (h === "stelle" || h === "stars") return "stelle"
  if (h.startsWith("categ")) return "categoria"
  if (h === "subtypes" || h === "type") return "_subtype"
  if (h === "via" || h === "indirizzo" || h.includes("indirizzo")) return "indirizzo"
  if (h === "cap") return "cap"
  if (h === "citta" || h === "città" || h.includes("localit") || h === "comune") return "citta"
  if (h === "provincia" || h === "prov" || h === "pr." || h === "pr") return "provincia"
  if (h === "regione") return "regione"
  if (h === "telefono" || h === "tel" || h === "phone" || h === "telefono 1") return "telefono"
  if (h === "sito" || h === "web" || h === "site" || h === "sito web" || h.includes("booking")) return "sito"
  return null
}

// Detect a header row within first N rows; return {idx, map: {col->field}}
function detectHeader(lines) {
  for (let i = 0; i < Math.min(8, lines.length); i++) {
    const cols = parseLine(lines[i])
    const map = {}
    let hits = 0
    let hasEmail = false
    for (let c = 0; c < cols.length; c++) {
      const f = classifyHeader(cols[c])
      if (f) {
        map[c] = f
        hits++
        if (f === "email") hasEmail = true
      }
    }
    // A good header has multiple recognizable fields (email may be in an unlabeled column)
    if (hits >= 3 || (hits >= 2 && hasEmail)) return { idx: i, map, hasEmail }
  }
  return null
}

// Split "Citta (PR)" -> {citta, provincia}
function splitCittaProv(rec) {
  if (rec.citta) {
    const m = rec.citta.match(/^(.*?)\s*\(([A-Za-z]{2})\)\s*$/)
    if (m) {
      rec.citta = clean(m[1])
      if (!rec.provincia) rec.provincia = m[2].toUpperCase()
    }
  }
}

function starsFromCategoria(v) {
  v = clean(v)
  if (!v) return ""
  const stars = (v.match(/[★☆⭐]/g) || []).length
  if (stars) return String(stars)
  const m = v.match(/(\d)\s*stelle/i)
  if (m) return m[1]
  return ""
}

// ---- 1) Seed from base (canonical 34k) ----
const map = new Map()
{
  const lines = fs.readFileSync(path.join(DIR, BASE), "utf8").split(/\r?\n/)
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue
    const c = parseLine(lines[i])
    const email = clean(c[0]).toLowerCase()
    if (!email || !EMAIL_RE.test(email)) continue
    const rec = {}
    for (const f of FIELDS) rec[f] = ""
    rec.email = email
    rec.referente_nome = clean(c[1])
    rec.referente_cognome = clean(c[2])
    rec.nome_azienda = clean(c[3])
    map.set(email, rec)
  }
}
console.log("Base:", map.size, "contatti")

// ---- 2) Enrich from a rich file (header-driven) ----
function enrichFile(file) {
  const full = path.join(DIR, file)
  if (!fs.existsSync(full)) return
  const lines = fs.readFileSync(full, "utf8").split(/\r?\n/)
  const hdr = detectHeader(lines)
  if (!hdr) return { file, matched: 0, noHeader: true }
  let matched = 0
  for (let i = hdr.idx + 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue
    const cols = parseLine(lines[i])
    // email: prefer mapped email cols, else scan any cell
    let email = ""
    for (const [cStr, f] of Object.entries(hdr.map)) {
      if (f === "email") {
        const m = clean(cols[+cStr]).toLowerCase().match(EMAIL_FIND)
        if (m) { email = m[0]; break }
      }
    }
    if (!email) {
      for (const cell of cols) {
        const m = clean(cell).toLowerCase().match(EMAIL_FIND)
        if (m) { email = m[0]; break }
      }
    }
    if (!email) continue
    const rec = map.get(email)
    if (!rec) continue // only enrich canonical contacts
    matched++
    for (const [cStr, f] of Object.entries(hdr.map)) {
      const val = clean(cols[+cStr])
      if (!val) continue
      if (f === "email") continue
      if (f === "_subtype") { if (!rec.categoria) rec.categoria = val; continue }
      if (f === "_contatto_full") {
        if (val.toUpperCase() === "NULL") continue
        if (!rec.referente_nome && !rec.referente_cognome) {
          const parts = val.split(/\s+/)
          rec.referente_nome = parts.slice(0, -1).join(" ") || parts[0] || ""
          rec.referente_cognome = parts.length > 1 ? parts[parts.length - 1] : ""
        }
        continue
      }
      if (f === "stelle") { const s = /^\d$/.test(val) ? val : starsFromCategoria(val); if (s && !rec.stelle) rec.stelle = s; continue }
      if (f === "categoria") {
        const s = starsFromCategoria(val)
        if (s && !rec.stelle) rec.stelle = s
        if (!rec.categoria && !/^[★☆⭐]+$/.test(val)) rec.categoria = val
        continue
      }
      if (val.toUpperCase() === "NULL") continue
      // fill only if empty (first rich source wins)
      if (!rec[f]) rec[f] = val
    }
  }
  return { file, matched }
}

// Positional parser for Nazionale (headerless): cognome,nome,,hotel,,,citta(prov),,email,,,,regione
function enrichNazionale(file) {
  const full = path.join(DIR, file)
  if (!fs.existsSync(full)) return
  const lines = fs.readFileSync(full, "utf8").split(/\r?\n/)
  let matched = 0
  for (const line of lines) {
    if (!line.trim()) continue
    const c = parseLine(line)
    let email = ""
    for (const cell of c) {
      const m = clean(cell).toLowerCase().match(EMAIL_FIND)
      if (m) { email = m[0]; break }
    }
    if (!email) continue
    const rec = map.get(email)
    if (!rec) continue
    matched++
    if (!rec.referente_cognome && clean(c[0])) rec.referente_cognome = clean(c[0])
    if (!rec.referente_nome && clean(c[1])) rec.referente_nome = clean(c[1])
    if (!rec.nome_azienda && clean(c[3])) rec.nome_azienda = clean(c[3])
    if (!rec.citta && clean(c[6])) rec.citta = clean(c[6])
    const reg = clean(c[12]) || clean(c[c.length - 1])
    if (!rec.regione && reg && !reg.includes("@")) rec.regione = reg
  }
  console.log(`  nazionale (pos): matched ${matched}`)
}

// Priority: richest, most-structured first
const RICH_FILES = [
  "dbufficiale.csv",   // regione, via, citta, provincia, stelle
  "bmit1.csv", "bmit2.csv", // indirizzo, cap, citta, prov, regione, telefono
  "db4bid-f1.csv", "db4bid-pulito.csv", "db4bid-b2.csv",
  "hoteltoscana.csv",  // indirizzo, cap, citta, prov, contatto, stelle, telefono, web
  "hotelok1.csv", "hotelok2.csv",
  "giulianova-contatti.csv", "giulianova-lista1.csv",
  "booking-toscana.csv",
]
for (const f of RICH_FILES) {
  const r = enrichFile(f)
  if (r) console.log(`  ${r.file}: matched ${r.matched}${r.noHeader ? " (no header)" : ""}`)
}
enrichNazionale("nazionale1.csv")

// Normalize citta "(PR)" -> provincia for all records
for (const rec of map.values()) splitCittaProv(rec)

// ---- Sanitize fields (drop implausible values from misaligned rows) ----
const VALID_REGIONS = new Set([
  "abruzzo","basilicata","calabria","campania","emilia-romagna","emilia romagna","friuli-venezia giulia","friuli venezia giulia",
  "lazio","liguria","lombardia","marche","molise","piemonte","puglia","sardegna","sicilia","toscana",
  "trentino-alto adige","trentino alto adige","umbria","valle d'aosta","veneto",
])
function digits(s) { return (s.match(/\d/g) || []).length }
for (const rec of map.values()) {
  // provincia: 2-letter code only
  if (rec.provincia) {
    const p = rec.provincia.replace(/[.\s]/g, "")
    rec.provincia = /^[A-Za-z]{2}$/.test(p) ? p.toUpperCase() : ""
  }
  // stelle: 1-5 only
  if (rec.stelle && !/^[1-5]$/.test(rec.stelle)) rec.stelle = ""
  // cap: 5 digits
  if (rec.cap && !/^\d{5}$/.test(rec.cap.replace(/\s/g, ""))) rec.cap = ""
  else if (rec.cap) rec.cap = rec.cap.replace(/\s/g, "")
  // telefono: must have >=5 digits, strip stray; clear if it looks like a url/email/text
  if (rec.telefono) {
    if (rec.telefono.includes("@") || /https?:\/\//i.test(rec.telefono) || digits(rec.telefono) < 5) rec.telefono = ""
  }
  // regione: validate + normalize to canonical name
  if (rec.regione) {
    const key = rec.regione.toLowerCase()
    const CANON = {
      "emilia romagna": "Emilia-Romagna", "emilia-romagna": "Emilia-Romagna",
      "friuli venezia giulia": "Friuli-Venezia Giulia", "friuli-venezia giulia": "Friuli-Venezia Giulia",
      "trentino alto adige": "Trentino-Alto Adige", "trentino-alto adige": "Trentino-Alto Adige",
      "valle d'aosta": "Valle d'Aosta",
      "abruzzo": "Abruzzo", "basilicata": "Basilicata", "calabria": "Calabria", "campania": "Campania",
      "lazio": "Lazio", "liguria": "Liguria", "lombardia": "Lombardia", "marche": "Marche", "molise": "Molise",
      "piemonte": "Piemonte", "puglia": "Puglia", "sardegna": "Sardegna", "sicilia": "Sicilia",
      "toscana": "Toscana", "umbria": "Umbria", "veneto": "Veneto",
    }
    rec.regione = CANON[key] || ""
  }
  // sito: must look like a url/domain
  if (rec.sito && !/(https?:\/\/|www\.|\.[a-z]{2,})/i.test(rec.sito)) rec.sito = ""
  // categoria: drop pure star strings and overly long junk
  if (rec.categoria) {
    if (/^[★☆⭐\s]+$/.test(rec.categoria) || rec.categoria.length > 60) rec.categoria = ""
  }
  // citta: clear if it contains digits-only or looks like address leftover
  if (rec.citta && /^\d+$/.test(rec.citta)) rec.citta = ""
}

// ---- 3) Region from regional sheet filenames (fill only if empty) ----
const REGION_FILES = {
  "r-campania.csv": "Campania",
  "r-emiliaromagna.csv": "Emilia-Romagna",
  "r-lazio.csv": "Lazio",
  "r-lombardia.csv": "Lombardia",
  "r-piemonte.csv": "Piemonte",
  "r-puglia.csv": "Puglia",
  "r-toscana.csv": "Toscana",
  "r-veneto.csv": "Veneto",
  "r-venezia.csv": "Veneto",
}
for (const [file, regione] of Object.entries(REGION_FILES)) {
  const full = path.join(DIR, file)
  if (!fs.existsSync(full)) continue
  const lines = fs.readFileSync(full, "utf8").split(/\r?\n/)
  let n = 0
  for (const line of lines) {
    if (!line.trim()) continue
    const m = line.toLowerCase().match(EMAIL_FIND)
    if (!m) continue
    const rec = map.get(m[0])
    if (rec && !rec.regione) { rec.regione = regione; n++ }
  }
  console.log(`  ${file}: regione ${regione} -> ${n}`)
}

// ---- 4) Write enriched CSV ----
function csvCell(v) {
  v = v == null ? "" : String(v)
  if (/[",\n]/.test(v)) return '"' + v.replace(/"/g, '""') + '"'
  return v
}
const rows = [FIELDS.join(",")]
for (const rec of map.values()) {
  rows.push(FIELDS.map((f) => csvCell(rec[f])).join(","))
}
fs.writeFileSync(path.join(DIR, OUT), rows.join("\n") + "\n")

// ---- 5) Coverage stats ----
const stats = {}
for (const f of FIELDS) stats[f] = 0
for (const rec of map.values()) for (const f of FIELDS) if (rec[f]) stats[f]++
console.log("\n=== Copertura campi (su " + map.size + ") ===")
for (const f of FIELDS) console.log(`  ${f}: ${stats[f]} (${Math.round((stats[f] / map.size) * 100)}%)`)
