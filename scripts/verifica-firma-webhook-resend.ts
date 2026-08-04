/**
 * Prova la verifica della firma del webhook Resend sul CODICE REALE (importa il
 * gestore POST della rotta, non una copia della logica).
 *
 * Il rischio da escludere e' doppio e i due rami vanno provati entrambi:
 *  - se la correzione dei tipi avesse rotto il calcolo dell'HMAC, Resend
 *    riceverebbe 401 e DISABILITEREBBE il webhook: smetteremmo di registrare i
 *    rimbalzi senza accorgercene (e' esattamente il guasto storico del 22/06);
 *  - se invece la rendesse sempre vera, chiunque potrebbe iniettare rimbalzi
 *    falsi e far sopprimere indirizzi validi. Un "passa" non prova nulla da solo.
 */
import crypto from "crypto"

const SEGRETO = "whsec_" + Buffer.from("segreto-di-prova-solo-locale").toString("base64")

/** Firma calcolata in modo INDIPENDENTE dal codice sotto esame. */
function firma(id: string, ts: string, corpo: string, segreto: string): string {
  const chiave = Uint8Array.from(Buffer.from(segreto.replace(/^whsec_/, ""), "base64"))
  const contenuto = `${id}.${ts}.${corpo}`
  return crypto.createHmac("sha256", chiave).update(contenuto).digest("base64")
}

async function main() {
  process.env.RESEND_WEBHOOK_SECRET = SEGRETO
  const { POST } = await import("../app/api/dem/resend-webhook/route")

  const id = "msg_2abc"
  const ts = String(Math.floor(Date.now() / 1000))
  // `email.delivered` viene ignorato dal gestore: supera la firma e risponde 200
  // SENZA scrivere nel database, quindi la prova non ha effetti collaterali.
  const corpo = JSON.stringify({ type: "email.delivered", data: { to: ["prova@esempio.it"] } })

  const chiama = async (intestazioni: Record<string, string>, corpoInviato: string) => {
    const req = new Request("http://localhost/api/dem/resend-webhook", {
      method: "POST",
      headers: { "content-type": "application/json", ...intestazioni },
      body: corpoInviato,
    })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = await POST(req as any)
    let testo = ""
    try {
      testo = JSON.stringify(await res.json())
    } catch {
      testo = "(nessun corpo)"
    }
    return { stato: res.status, testo }
  }

  const buona = firma(id, ts, corpo, SEGRETO)
  const righe: string[] = []
  let tuttoOk = true
  const controlla = (nome: string, atteso: number, ottenuto: number, extra = "") => {
    const ok = atteso === ottenuto
    if (!ok) tuttoOk = false
    righe.push(`  ${ok ? "OK  " : "FALLITO "} ${nome.padEnd(46)} atteso ${atteso}, ottenuto ${ottenuto} ${extra}`)
  }

  console.log("=== A) FIRMA VALIDA: deve essere ACCETTATA (200) ===")
  const a = await chiama({ "svix-id": id, "svix-timestamp": ts, "svix-signature": `v1,${buona}` }, corpo)
  controlla("firma corretta", 200, a.stato, a.testo)

  console.log("=== B) FIRMA FALSA: deve essere RESPINTA (401) ===")
  const b = await chiama(
    { "svix-id": id, "svix-timestamp": ts, "svix-signature": "v1,ZmFsc2EtZmlybWEtcXVhbHVucXVl" },
    corpo,
  )
  controlla("firma inventata", 401, b.stato)

  console.log("=== C) CORPO MANOMESSO con la firma dell'originale: 401 ===")
  const manomesso = JSON.stringify({ type: "email.bounced", data: { to: ["vittima@esempio.it"] } })
  const c = await chiama({ "svix-id": id, "svix-timestamp": ts, "svix-signature": `v1,${buona}` }, manomesso)
  controlla("corpo sostituito (l'HMAC copre il corpo?)", 401, c.stato)

  console.log("=== D) SEGRETO DIVERSO: 401 ===")
  const altro = firma(id, ts, corpo, "whsec_" + Buffer.from("un-altro-segreto").toString("base64"))
  const d = await chiama({ "svix-id": id, "svix-timestamp": ts, "svix-signature": `v1,${altro}` }, corpo)
  controlla("firmato con un altro segreto", 401, d.stato)

  console.log("=== E) INTESTAZIONI ASSENTI: 401 ===")
  const e = await chiama({}, corpo)
  controlla("nessuna intestazione svix", 401, e.stato)

  console.log("=== F) PIU' FIRME nell'intestazione, una valida: 200 ===")
  const f = await chiama(
    { "svix-id": id, "svix-timestamp": ts, "svix-signature": `v1,ZmFsc2E v1,${buona}` },
    corpo,
  )
  controlla("elenco di firme con una corretta", 200, f.stato)

  console.log("\n=== ESITO ===")
  for (const r of righe) console.log(r)
  console.log(`\n  ${tuttoOk ? "TUTTE LE PROVE SUPERATE" : "ALMENO UNA PROVA FALLITA"}`)
  if (!tuttoOk) process.exit(1)
}

main().catch((e) => {
  console.error("ERRORE:", e?.message || e)
  process.exit(1)
})
