/**
 * TEMPORANEO - da cancellare.
 * Tutte le 100 pagine dichiarate in sitemap sono davvero indicizzabili?
 * Un noindex o un 404 dentro la sitemap e' un difetto reale: dichiariamo a
 * Google una pagina e poi gli diciamo di non usarla.
 */
const BASE = "https://www.4bid.it"

async function main() {
  const sm = await (await fetch(`${BASE}/sitemap.xml`)).text()
  const url = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1])
  console.log(`  pagine dichiarate: ${url.length}`)
  console.log("")

  const problemi: string[] = []
  const canonicalAltrove: string[] = []
  let ok = 0

  for (let i = 0; i < url.length; i += 10) {
    const lotto = url.slice(i, i + 10)
    await Promise.all(
      lotto.map(async (u) => {
        try {
          const r = await fetch(u, { headers: { "User-Agent": "Mozilla/5.0 (verifica interna 4bid)" } })
          const h = await r.text()
          const p = u.replace(BASE, "") || "/"
          if (!r.ok) {
            problemi.push(`${p}  stato ${r.status}`)
            return
          }
          if (/name="robots"[^>]*noindex|<meta[^>]*noindex/i.test(h)) {
            problemi.push(`${p}  NOINDEX ma dichiarata in sitemap`)
            return
          }
          const can = h.match(/rel="canonical"\s+href="([^"]+)"/i)?.[1]
          if (can) {
            const cn = can.replace(/\/$/, "")
            const un = u.replace(/\/$/, "")
            if (cn !== un) canonicalAltrove.push(`${p}  ->  ${can.replace(BASE, "")}`)
          } else {
            problemi.push(`${p}  senza canonical`)
            return
          }
          ok++
        } catch (e: any) {
          problemi.push(`${u.replace(BASE, "")}  errore: ${e.message}`)
        }
      }),
    )
    process.stdout.write(`\r  controllate ${Math.min(i + 10, url.length)}/${url.length}`)
  }

  console.log("")
  console.log("")
  console.log(`  indicizzabili e coerenti: ${ok}`)
  console.log("")
  console.log(`  === PROBLEMI (${problemi.length}) ===`)
  for (const p of problemi.sort()) console.log(`    ${p}`)
  console.log("")
  console.log(`  === canonical che punta ALTROVE (${canonicalAltrove.length}) ===`)
  for (const c of canonicalAltrove.sort()) console.log(`    ${c}`)
}

main().catch((e) => console.error("  ERRORE:", e.message))
