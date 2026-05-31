const fs = require("fs")
const path = require("path")
const dns = require("dns").promises

const SRC = path.join(__dirname, "..", "public", "dem", "hotels-italia.csv")
const OUT_VALID = path.join(__dirname, "valid.csv")
const OUT_INVALID = path.join(__dirname, "invalid.csv")
const OUT_REPORT = path.join(__dirname, "mx-report.txt")

// --- CSV parse (quote-aware) ---
function parseLine(l) {
  const o = []
  let c = "", q = false
  for (let i = 0; i < l.length; i++) {
    const ch = l[i]
    if (q) {
      if (ch === '"' && l[i + 1] === '"') { c += '"'; i++ }
      else if (ch === '"') q = false
      else c += ch
    } else {
      if (ch === '"') q = true
      else if (ch === ",") { o.push(c); c = "" }
      else c += ch
    }
  }
  o.push(c)
  return o
}

const lines = fs.readFileSync(SRC, "utf8").split(/\r?\n/).filter((x) => x.trim())
const header = lines[0]
const rows = lines.slice(1)

// Collect unique domains
const domains = new Set()
const rowDomain = []
for (const r of rows) {
  const email = (parseLine(r)[0] || "").trim().toLowerCase()
  const dom = email.split("@")[1] || ""
  rowDomain.push(dom)
  if (dom) domains.add(dom)
}
const domainList = [...domains]
console.log(`Righe: ${rows.length} | Domini unici: ${domainList.length}`)

// --- MX check with timeout ---
function withTimeout(p, ms) {
  return Promise.race([
    p,
    new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), ms)),
  ])
}

const cache = new Map() // domain -> "ok" | "no-mx" | "no-domain"

async function checkDomain(dom) {
  try {
    const mx = await withTimeout(dns.resolveMx(dom), 5000)
    if (mx && mx.length > 0) return "ok"
    // no MX records -> try A record (some domains accept mail on A)
    try {
      const a = await withTimeout(dns.resolve(dom), 5000)
      return a && a.length > 0 ? "ok" : "no-mx"
    } catch {
      return "no-mx"
    }
  } catch (e) {
    const code = e && e.code
    if (code === "ENOTFOUND" || code === "ENODATA") {
      // domain may exist with A only; try A
      try {
        const a = await withTimeout(dns.resolve(dom), 5000)
        return a && a.length > 0 ? "ok" : "no-domain"
      } catch {
        return "no-domain"
      }
    }
    // timeout / servfail -> mark uncertain as ok-uncertain (keep, don't discard on transient)
    return "uncertain"
  }
}

async function run() {
  const CONCURRENCY = 50
  let idx = 0
  let done = 0
  async function worker() {
    while (idx < domainList.length) {
      const i = idx++
      const dom = domainList[i]
      const res = await checkDomain(dom)
      cache.set(dom, res)
      done++
      if (done % 1000 === 0) console.log(`  verificati ${done}/${domainList.length} domini`)
    }
  }
  const workers = Array.from({ length: CONCURRENCY }, () => worker())
  await workers.reduce((p) => p, Promise.resolve())
  await Promise.all(workers)

  // Classify rows
  const valid = []
  const invalid = []
  const reasonCount = { ok: 0, uncertain: 0, "no-mx": 0, "no-domain": 0, "no-domain-part": 0 }
  for (let i = 0; i < rows.length; i++) {
    const dom = rowDomain[i]
    const status = !dom ? "no-domain-part" : cache.get(dom)
    reasonCount[status] = (reasonCount[status] || 0) + 1
    // Keep "ok" and "uncertain" (transient DNS issues shouldn't drop a contact)
    if (status === "ok" || status === "uncertain") valid.push(rows[i])
    else invalid.push(rows[i] + "," + status)
  }

  fs.writeFileSync(OUT_VALID, header + "\n" + valid.join("\n") + "\n")
  fs.writeFileSync(OUT_INVALID, header + ",motivo_scarto\n" + invalid.join("\n") + "\n")

  // Domain-level report
  const domStatus = { ok: 0, uncertain: 0, "no-mx": 0, "no-domain": 0 }
  for (const s of cache.values()) domStatus[s] = (domStatus[s] || 0) + 1
  const badDomains = domainList
    .filter((d) => ["no-mx", "no-domain"].includes(cache.get(d)))
    .sort()

  const report = [
    `Report verifica MX/DNS lista hotel`,
    `Data: ${new Date().toISOString()}`,
    ``,
    `=== RIGHE (contatti) ===`,
    `Totale: ${rows.length}`,
    `Validi (ok + uncertain): ${valid.length}`,
    `Scartati: ${invalid.length}`,
    ``,
    `Dettaglio righe per stato:`,
    ...Object.entries(reasonCount).map(([k, v]) => `  ${k}: ${v}`),
    ``,
    `=== DOMINI ===`,
    `Domini unici: ${domainList.length}`,
    ...Object.entries(domStatus).map(([k, v]) => `  ${k}: ${v}`),
    ``,
    `=== DOMINI SCARTATI (no-mx / no-domain) ===`,
    ...badDomains,
  ].join("\n")
  fs.writeFileSync(OUT_REPORT, report)

  console.log(`\n=== FATTO ===`)
  console.log(`Validi: ${valid.length} | Scartati: ${invalid.length}`)
  console.log(`Stati righe:`, reasonCount)
  console.log(`Stati domini:`, domStatus)
}

run()
