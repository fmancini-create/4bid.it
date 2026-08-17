import { readFile } from "node:fs/promises"
const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs")
const data = new Uint8Array(await readFile("public/comunicati/4bid-ecosistema-hotel-ai.pdf"))
const doc = await pdfjs.getDocument({ data, useSystemFonts: true }).promise
const p = await doc.getPage(1)
const c = await p.getTextContent()
const i = c.items.findIndex(it => it.str && it.str.startsWith("Telefonate"))
console.log("frammenti attorno:")
let prec = null
for (const it of c.items.slice(i, i + 8)) {
  const x = it.transform[4], w = it.width || 0
  const buco = prec === null ? null : (x - prec).toFixed(2)
  console.log("  x=", x.toFixed(2), "w=", w.toFixed(2), "buco dal precedente=", buco, JSON.stringify(it.str))
  prec = x + w
}
