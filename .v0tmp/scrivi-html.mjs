import { writeFile } from "node:fs/promises"
const { htmlComunicatoEcosistema } = await import("../lib/dem/press-release-ecosistema.ts")
let html = htmlComunicatoEcosistema()
// Solo per l'anteprima a schermo: il marcatore dell'allegato e' un commento HTML
// e non si vede, mentre {{unsubscribe}} nell'email vera viene sostituito.
html = html.replace("{{unsubscribe}}", "#")
await writeFile("/tmp/agent-browser/comunicato.html", html)
console.log("byte:", html.length)
