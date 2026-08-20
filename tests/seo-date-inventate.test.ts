import { describe, it, expect } from "vitest"
import { StructuredData } from "@/components/seo-structured-data"

/**
 * Il difetto che queste prove esistono per fermare:
 *
 *   mainSchema.datePublished = datePublished || now   // now = new Date()
 *
 * Misurato prima della correzione: due richieste alla stessa pagina a 3
 * secondi di distanza dichiaravano 10:11:31 e 10:11:34. Ogni guida diceva ai
 * motori di ricerca di essere stata scritta E modificata nell'istante della
 * scansione.
 *
 * Non e' una prova sul testo del file: chiamo il componente e leggo il JSON
 * che produce davvero. `StructuredData` e' una funzione che ritorna JSX, non
 * ha stato ne' effetti, quindi si puo' invocare direttamente e ispezionare i
 * blocchi che genera.
 */

type NodoJsx = { props?: Record<string, unknown>; [k: string]: unknown }

/** Raccoglie i JSON-LD prodotti dal componente, comunque siano annidati. */
function schemiProdotti(elemento: unknown): Array<Record<string, unknown>> {
  const trovati: Array<Record<string, unknown>> = []

  const visita = (n: unknown): void => {
    if (!n || typeof n !== "object") return
    if (Array.isArray(n)) {
      n.forEach(visita)
      return
    }
    const nodo = n as NodoJsx
    const props = nodo.props as Record<string, unknown> | undefined
    if (props) {
      const dsi = props.dangerouslySetInnerHTML as { __html?: string } | undefined
      if (dsi?.__html) {
        try {
          trovati.push(JSON.parse(dsi.__html))
        } catch {
          // Un JSON-LD non parsabile e' un difetto a se': lo segnalo come tale
          // invece di ignorarlo silenziosamente.
          trovati.push({ __NON_PARSABILE__: dsi.__html })
        }
      }
      if (props.children) visita(props.children)
    }
  }

  visita(elemento)
  return trovati
}

type PropsSeo = Parameters<typeof StructuredData>[0]

/** Il nodo principale: quello del @type richiesto, non il grafo di entita'. */
function nodoPrincipale(tipo: string, props: PropsSeo) {
  const schemi = schemiProdotti(StructuredData(props))
  const principale = schemi.find((s) => s["@type"] === tipo)
  expect(principale, `nessun nodo @type=${tipo} prodotto`).toBeDefined()
  return principale as Record<string, unknown>
}

const base = {
  title: "Guida al revenue management",
  description: "Una descrizione",
  url: "https://www.4bid.it/guida",
}

describe("date nello schema: mai inventate", () => {
  it("senza date passate, NON dichiara datePublished ne' dateModified", () => {
    const n = nodoPrincipale("Article", { ...base, type: "Article" })
    expect(n).not.toHaveProperty("datePublished")
    expect(n).not.toHaveProperty("dateModified")
  })

  it("vale per tutti i tipi che prima cadevano sul ripiego", () => {
    for (const type of ["WebPage", "AboutPage", "CollectionPage"] as const) {
      const n = nodoPrincipale(type, { ...base, type })
      expect(n, `${type} non deve inventare la data`).not.toHaveProperty("datePublished")
      expect(n, `${type} non deve inventare la data`).not.toHaveProperty("dateModified")
    }
  })

  // CONTROLLO NEGATIVO: senza questo, la correzione potrebbe aver semplicemente
  // cancellato le date sempre — rompendo il percorso legittimo (il blog, che le
  // date vere le ha) e restando verde sulle prove qui sopra.
  it("conserva le date VERE quando la pagina le passa", () => {
    const n = nodoPrincipale("Article", {
      ...base,
      type: "Article",
      datePublished: "2026-03-14",
      dateModified: "2026-07-02",
    })
    expect(n.datePublished).toBe("2026-03-14")
    expect(n.dateModified).toBe("2026-07-02")
  })

  it("accetta una data sola senza inventare l'altra", () => {
    const n = nodoPrincipale("Article", {
      ...base,
      type: "Article",
      datePublished: "2026-03-14",
    })
    expect(n.datePublished).toBe("2026-03-14")
    expect(n).not.toHaveProperty("dateModified")
  })

  // La forma del difetto, non solo il suo testo: due invocazioni successive
  // devono produrre lo stesso JSON. Con `new Date()` dentro il componente
  // questa prova arrossisce, ed e' l'unica che lo coglie davvero.
  it("produce lo stesso JSON a due invocazioni successive", async () => {
    const primo = JSON.stringify(schemiProdotti(StructuredData({ ...base, type: "Article" })))
    await new Promise((r) => setTimeout(r, 25))
    const secondo = JSON.stringify(schemiProdotti(StructuredData({ ...base, type: "Article" })))
    expect(secondo).toBe(primo)
  })

  it("i blocchi prodotti sono tutti JSON valido", () => {
    const schemi = schemiProdotti(
      StructuredData({
        ...base,
        type: "Article",
        faqs: [{ question: "Domanda?", answer: "Risposta." }],
        breadcrumbs: [{ name: "Home", url: "https://www.4bid.it" }],
      }),
    )
    expect(schemi.length).toBeGreaterThan(0)
    for (const s of schemi) {
      expect(s, "un blocco JSON-LD non era parsabile").not.toHaveProperty("__NON_PARSABILE__")
    }
  })
})
