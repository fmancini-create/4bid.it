import { readFile } from "node:fs/promises"
import { COMUNICATO_ECOSISTEMA as C } from "../lib/dem/press-release-ecosistema"

const miei: string[] = [C.titolo, C.sommario]
for (const s of C.sezioni) { if (s.titolo) miei.push(s.titolo); miei.push(...s.paragrafi) }
const sorgente = (await readFile(".v0tmp/sorgente.md", "utf8"))
  .split("\n").map((r) => r.trim()).filter(Boolean).map((r) => r.replace(/^#+\s*/, ""))

const norm = (s: string) => s.replace(/\s+/g, " ").trim()
const setMiei = new Set(miei.map(norm))
const setSorg = new Set(sorgente.map(norm))

const persi = sorgente.map(norm).filter((r) => !setMiei.has(r))
const aggiunti = miei.map(norm).filter((r) => !setSorg.has(r))
console.log("=== NEL SORGENTE E NON NEL MIO TESTO:", persi.length)
for (const r of persi) console.log("  •", r)
console.log("\n=== NEL MIO TESTO E NON NEL SORGENTE:", aggiunti.length)
for (const r of aggiunti) console.log("  •", r)
