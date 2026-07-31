/**
 * TEMPORANEO - da cancellare.
 * Quali URL di 4bid.it reggono le chiavi posizionate.
 * Serve PRIMA di consolidare le pagine doppie: se accorpassi una pagina che
 * regge una chiave, perderei l'unica traccia di visibilita' che il sito ha.
 */
const login = Buffer.from(
  `${process.env.DATAFORSEO_LOGIN}:${process.env.DATAFORSEO_PASSWORD}`,
).toString("base64")

async function chiama(percorso: string, corpo: unknown) {
  const r = await fetch(`https://api.dataforseo.com/v3${percorso}`, {
    method: "POST",
    headers: { Authorization: `Basic ${login}`, "Content-Type": "application/json" },
    body: JSON.stringify([corpo]),
  })
  const j = await r.json()
  if (j.status_code !== 20000) throw new Error(`${j.status_code} ${j.status_message}`)
  return j.tasks?.[0]?.result?.[0]
}

async function main() {
  const res = await chiama("/dataforseo_labs/google/ranked_keywords/live", {
    target: "4bid.it",
    language_code: "it",
    location_code: 2380,
    limit: 60,
    order_by: ["ranked_serp_element.serp_item.rank_absolute,asc"],
  })

  const items = res?.items ?? []
  console.log(`  chiavi posizionate: ${res?.total_count ?? 0}`)
  console.log("")
  console.log("  pos   volume  chiave                                URL che si posiziona")
  console.log("  " + "-".repeat(96))

  const perUrl = new Map<string, number>()
  for (const it of items) {
    const s = it.ranked_serp_element?.serp_item
    const pos = s?.rank_absolute ?? 0
    const url = String(s?.relative_url ?? s?.url ?? "?").replace(/^https?:\/\/[^/]+/, "") || "/"
    const kw = String(it.keyword_data?.keyword ?? "?")
    const vol = it.keyword_data?.keyword_info?.search_volume ?? 0
    console.log(`  ${String(pos).padStart(3)}  ${String(vol).padStart(6)}  ${kw.slice(0, 36).padEnd(36)}  ${url}`)
    perUrl.set(url, (perUrl.get(url) ?? 0) + 1)
  }

  console.log("")
  console.log("  === URL da NON toccare (reggono chiavi) ===")
  for (const [u, n] of [...perUrl.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${String(n).padStart(2)} chiave(i)  ${u}`)
  }
}

main().catch((e) => console.error("  ERRORE:", e.message))
