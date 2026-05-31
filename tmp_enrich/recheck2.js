const fs = require("fs")
const path = require("path")
const dns = require("dns").promises

const report = fs.readFileSync(path.join(__dirname, "mx-report.txt"), "utf8")
const marker = "=== DOMINI SCARTATI (no-mx / no-domain) ==="
const badDomains = report
  .slice(report.indexOf(marker) + marker.length)
  .split(/\r?\n/)
  .map((s) => s.trim())
  .filter(Boolean)

function withTimeout(p, ms) {
  return Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), ms))])
}

dns.setServers(["8.8.8.8", "1.1.1.1"])

async function alive(dom) {
  try {
    const mx = await withTimeout(dns.resolveMx(dom), 4000)
    if (mx && mx.length) return true
  } catch {}
  try {
    const a = await withTimeout(dns.resolve(dom), 4000)
    if (a && a.length) return true
  } catch {}
  return false
}

async function run() {
  const recovered = []
  let idx = 0
  const CONC = 120
  async function worker() {
    while (idx < badDomains.length) {
      const dom = badDomains[idx++]
      if (await alive(dom)) recovered.push(dom)
    }
  }
  await Promise.all(Array.from({ length: CONC }, worker))
  fs.writeFileSync(path.join(__dirname, "recovered-domains.txt"), recovered.sort().join("\n") + "\n")
  fs.writeFileSync(path.join(__dirname, "recheck2.done"), String(recovered.length))
}
run()
