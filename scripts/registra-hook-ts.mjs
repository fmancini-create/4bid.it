// Registra l'aggancio di risoluzione TypeScript (scripts/hook-ts.mjs).
//
// Serve un file separato perche' `node --import ./hook-ts.mjs` ESEGUE il modulo
// senza installarne i ganci: la funzione `resolve` esportata non viene mai
// chiamata e l'import fallisce esattamente come prima, dando l'impressione che
// l'aggancio sia sbagliato quando invece non e' nemmeno attivo.
// I ganci vanno dichiarati con module.register().
import { register } from "node:module"
import { pathToFileURL } from "node:url"

register("./hook-ts.mjs", pathToFileURL(import.meta.filename))
