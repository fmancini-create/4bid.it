/**
 * TEMPORANEO - da cancellare.
 *
 * Quali pagine sono RAGGIUNGIBILI navigando dalla home, e quali stanno solo in
 * sitemap. Il grep su `href="..."` non basta: molti collegamenti nascono da
 * elenchi di dati (lib/seo/solutions.ts, entities.ts) e non compaiono come
 * stringa letterale nel file della pagina. Questa e' la verifica vera: scarico
 * l'HTML servito e seguo i collegamenti, come farebbe un motore di ricerca.
 */
const BASE = "https://www.4bid.it"

async function html(u: string): Promise<string> {
  try {
    const r = await fetch(u, { headers: { "User-Agent": "Mozilla/5.0 (verifica interna 4bid)" } })
    return r.ok ? await r.text() : ""
  } catch {
    return ""
  }
}

function interni(h: string): string[] {
  const out = new Set<string>()
  for (const m of h.matchAll(/href="(\/[^"#?]*)"/g)) {
    let p = m[1].replace(/\/$/, "")
    if (p === "") p = "/"
    if (/\.(png|jpg|jpeg|svg|pdf|ico|xml|txt|webp|css|js)$/i.test(p)) continue
    out.add(p)
  }
  return [...out]
}

async function main() {
  // 1. sitemap = cio' che dichiariamo a Google
  const sm = await html(`${BASE}/sitemap.xml`)
  const inSitemap = new Set(
    [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => {
      const p = m[1].replace(BASE, "").replace(/^https?:\/\/[^/]+/, "").replace(/\/$/, "")
      return p === "" ? "/" : p
    }),
  )

  // 2. percorro dalla home, in ampiezza, fino a 3 livelli
  const visti = new Set<string>(["/"])
  let bordo = ["/"]
  for (let livello = 0; livello < 3; livello++) {
    const prossimo: string[] = []
    for (let i = 0; i < bordo.length; i += 8) {
      const lotto = bordo.slice(i, i + 8)
      const pagine = await Promise.all(lotto.map((p) => html(BASE + (p === "/" ? "/" : p))))
      for (const h of pagine) {
        for (const l of interni(h)) {
          if (!visti.has(l)) {
            visti.add(l)
            prossimo.push(l)
          }
        }
      }
    }
    bordo = prossimo
    console.log(`  livello ${livello + 1}: raggiunte ${visti.size} pagine in totale`)
    if (bordo.length === 0) break
  }

  console.log("")
  console.log(`  in sitemap:      ${inSitemap.size}`)
  console.log(`  raggiungibili:   ${visti.size}`)
  console.log("")

  const orfane = [...inSitemap].filter((p) => !visti.has(p)).sort()
  console.log(`  === IN SITEMAP ma NON raggiungibili navigando (${orfane.length}) ===`)
  for (const p of orfane) console.log(`    ${p}`)

  const fuoriSitemap = [...visti].filter((p) => !inSitemap.has(p)).sort()
  console.log("")
  console.log(`  === raggiungibili ma NON in sitemap (${fuoriSitemap.length}) ===`)
  for (const p of fuoriSitemap.slice(0, 24)) console.log(`    ${p}`)
}

main().catch((e) => console.error("  ERRORE:", e.message))
