/**
 * Copies the pdf.js worker out of node_modules into public/.
 *
 * The worker MUST be the exact same version as the pdf.js API that react-pdf
 * bundles, otherwise pdf.js refuses to start with
 * "The API version does not match the Worker version".
 * Copying it from the installed package (instead of pinning a CDN URL or a
 * hand-written version string) makes that mismatch impossible: the file in
 * public/ is always whatever is in node_modules.
 *
 * Re-run after every dependency bump:
 *   node scripts/project-room/copy-pdf-worker.mjs
 */

import { copyFile, mkdir, readFile } from "node:fs/promises"
import { existsSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, "..", "..")

const source = join(root, "node_modules", "pdfjs-dist", "build", "pdf.worker.min.mjs")
const destination = join(root, "public", "pdf.worker.min.mjs")

if (!existsSync(source)) {
  console.error(`[project-room] worker non trovato: ${source}`)
  console.error("[project-room] esegui prima l'installazione delle dipendenze.")
  process.exit(1)
}

const pkg = JSON.parse(await readFile(join(root, "node_modules", "pdfjs-dist", "package.json"), "utf8"))

await mkdir(dirname(destination), { recursive: true })
await copyFile(source, destination)

console.log(`[project-room] pdf.js worker ${pkg.version} copiato in public/pdf.worker.min.mjs`)
