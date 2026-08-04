import { resolveMx } from "node:dns/promises"
async function prova(dominio: string) {
  const t0 = Date.now()
  try {
    const mx = await resolveMx(dominio)
    console.log(`  ${dominio.padEnd(22)} OK   ${mx.length} record   ${Date.now() - t0}ms`)
  } catch (e: any) {
    console.log(`  ${dominio.padEnd(22)} ${String(e.code || e.message)}   ${Date.now() - t0}ms`)
  }
}
async function main() {
  console.log("=== Il DNS risponde in questo ambiente? (3 domini, uno per volta) ===")
  await prova("gmail.com")
  await prova("4bid.it")
  await prova("albergo-florida.it")
}
main()
