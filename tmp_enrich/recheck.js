const fs = require("fs")
const path = require("path")
const dns = require("dns").promises

// Read bad domains from report
const report = fs.readFileSync(path.join(__dirname, "mx-report.txt"), "utf8")
const marker = "=== DOMINI SCARTATI (no-mx / no-domain) ==="
const badDomains = report.slice(report.indexOf(marker) + marker.length).split(/\r?\n/).map(s => s.trim()).filter(Boolean)
console.log(`Ri-verifico ${badDomains.length} domini scartati...`)

function withTimeout(p, ms) {
  return Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), ms))])
}

// Use Google + Cloudflare DNS for a second opinion
dns.setServers(["8.8.8.8", "1.1.1.1", "8.8.4.4"])

async function alive(dom) {
  try {
    const mx = await withTimeout(dns.resolveMx(dom), 8000)
    if (mx && mx.length) return true
  } catch {}
  try {
    const a = await withTimeout(dns.resolve(dom), 8000)
    if (a && a.length) return true
  } catch {}
  try {
    const aaaa = await withTimeout(dns.resolve6(dom), 8000)
    if (aaaa && aaaa.length) return true
  } catch {}
  return false
}

async function run() {
  const recovered = []
  let idx = 0, done = 0
  const CONC = 30
  async function worker() {
    while (idx < badDomains.length) {
      const dom = badDomains[idx++]
      if (await alive(dom)) recovered.push(dom)
      done++
      if (done % 500 === 0) console.log(`  ${done}/${badDomains.length}`)
    }
  }
  await Promise.all(Array.from({ length: CONC }, worker))
  fs.writeFileSync(path.join(__dirname, "recovered-domains.txt"), recovered.sort().join("\n") + "\n")
  console.log(`\nRecuperati al 2° passaggio: ${recovered.length} / ${badDomains.length}`)
}
run()
