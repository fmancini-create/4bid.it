import { readFile } from "node:fs/promises"
const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs")
const data = new Uint8Array(await readFile("public/comunicati/4bid-ecosistema-hotel-ai.pdf"))
const doc = await pdfjs.getDocument({ data, useSystemFonts: true }).promise
for (let i = 1; i <= doc.numPages; i++) {
  const p = await doc.getPage(i)
  const c = await p.getTextContent()
  const idx = c.items.findIndex(it => it.str && it.str.includes("occuparsene"))
  if (idx >= 0) {
    console.log("pagina", i)
    for (const it of c.items.slice(Math.max(0, idx-3), idx+6)) {
      console.log("  x=", it.transform[4].toFixed(1), "y=", it.transform[5].toFixed(1), "w=", (it.width||0).toFixed(1), JSON.stringify(it.str))
    }
  }
}
