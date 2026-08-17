import { readFile } from "node:fs/promises"
import { COMUNICATO_ECOSISTEMA as C } from "../lib/dem/press-release-ecosistema"

const miei: string[] = [C.titolo, C.sommario]
for (const s of C.sezioni) {
  if (s.titolo) miei.push(s.titolo)
  miei.push(...s.paragrafi)
}

const sorgente = (await readFile(".v0tmp/sorgente.md", "utf8"))
  .split("\n").map((r) => r.trim()).filter(Boolean)
  .map((r) => r.replace(/^#+\s*/, ""))

const norm = (s: string) => s.replace(/\s+/g, " ").trim()
console.log("blocchi nel sorgente:", sorgente.length, "| blocchi miei:", miei.length)

let diversi = 0
const n = Math.max(sorgente.length, miei.length)
for (let i = 0; i < n; i++) {
  const a = sorgente[i] === undefined ? "(ASSENTE)" : norm(sorgente[i])
  const b = miei[i] === undefined ? "(ASSENTE)" : norm(miei[i])
  if (a !== b) {
    diversi++
    console.log(`\n--- blocco ${i + 1} DIVERSO`)
    console.log("  sorgente:", JSON.stringify(a.slice(0, 140)))
    console.log("  mio     :", JSON.stringify(b.slice(0, 140)))
  }
}
console.log("\nblocchi diversi:", diversi)
