// Aggancio di risoluzione per eseguire moduli TypeScript del progetto da script
// Node, senza dipendenze esterne.
//
// PERCHE': `tsx` NON e' installato in questo progetto (node_modules/.bin non lo
// contiene), quindi il comando `npx tsx` documentato in cima a
// scripts/create-air-market-dem.ts scaricherebbe il pacchetto dalla rete. Node 24
// sa già togliere i tipi da solo (--experimental-strip-types), ma NON inventa le
// estensioni: `import "./email-shell"` fallisce con "Cannot find module", perche'
// il file in TypeScript si chiama `email-shell.ts`.
//
// Questo aggancio fa due sole cose, entrambe minime:
//   1. traduce l'alias "@/..." nella radice del progetto (come fa tsconfig);
//   2. aggiunge ".ts" quando il percorso senza estensione esiste come .ts.
// Non compila e non trasforma nulla: la rimozione dei tipi resta di Node.
import { existsSync } from "node:fs"
import { fileURLToPath, pathToFileURL } from "node:url"
import path from "node:path"

const RADICE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")

export async function resolve(specifier, context, nextResolve) {
  // Alias "@/lib/..." -> "<radice>/lib/..."
  if (specifier.startsWith("@/")) {
    const assoluto = path.join(RADICE, specifier.slice(2))
    for (const tentativo of [assoluto, `${assoluto}.ts`, `${assoluto}.tsx`, path.join(assoluto, "index.ts")]) {
      if (existsSync(tentativo)) return nextResolve(pathToFileURL(tentativo).href, context)
    }
  }

  // Percorso relativo senza estensione: prova .ts / .tsx / index.ts
  if (specifier.startsWith(".") && context.parentURL?.startsWith("file:")) {
    const base = path.resolve(path.dirname(fileURLToPath(context.parentURL)), specifier)
    if (!existsSync(base) || !path.extname(base)) {
      for (const tentativo of [`${base}.ts`, `${base}.tsx`, path.join(base, "index.ts")]) {
        if (existsSync(tentativo)) return nextResolve(pathToFileURL(tentativo).href, context)
      }
    }
  }

  return nextResolve(specifier, context)
}
