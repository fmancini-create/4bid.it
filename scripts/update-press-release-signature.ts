/**
 * Allinea la copia dell'html salvata nella campagna in bozza al template.
 *
 * Serve perche' `dem_campaigns.html_template` conserva una COPIA del corpo
 * dell'email al momento della creazione: correggere il file in `lib/dem/` non
 * cambia cio' che partirebbe davvero. Qui la firma passa dal segnaposto al nome
 * confermato ("Filippo Mancini").
 *
 * Salvaguardia: agisce SOLO su una campagna in stato `draft` con 0 invii, cosi'
 * non puo' toccare la cronologia di una campagna gia' partita.
 */
async function main() {
  const { createClient } = await import("@supabase/supabase-js")
  const { OGGETTO_COMUNICATO, htmlComunicatoStampa, NOME_FONDATORE } = await import(
    "../lib/dem/press-release-air-market"
  )

  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  )

  const { data: campagne, error } = await db
    .from("dem_campaigns")
    .select("id, name, status, sent_count, html_template, subject")
    .ilike("name", "%Air Market%")
    .order("created_at", { ascending: false })
  if (error) throw new Error(`lettura campagne: ${error.message}`)

  const bozza = (campagne || []).find((c) => c.status === "draft")
  if (!bozza) {
    console.log("  nessuna campagna Air Market in bozza: niente da aggiornare")
    return
  }

  console.log(`  campagna:  "${bozza.name}"`)
  console.log(`  stato:     ${bozza.status}   inviate: ${bozza.sent_count}`)

  if (bozza.status !== "draft" || Number(bozza.sent_count) !== 0) {
    throw new Error(
      `salvaguardia: la campagna non e' una bozza a zero invii (stato=${bozza.status}, inviate=${bozza.sent_count})`,
    )
  }

  const prima = String(bozza.html_template ?? "")
  console.log(`  segnaposto presente prima: ${prima.includes("DA COMPLETARE") ? "si" : "no"}`)

  const nuovoHtml = htmlComunicatoStampa()
  const { error: errUpd } = await db
    .from("dem_campaigns")
    .update({ html_template: nuovoHtml, subject: OGGETTO_COMUNICATO })
    .eq("id", bozza.id)
    .eq("status", "draft")
    .eq("sent_count", 0)
  if (errUpd) throw new Error(`aggiornamento: ${errUpd.message}`)

  // Rilettura: l'unica prova che la copia salvata e' cambiata davvero.
  const { data: dopo } = await db
    .from("dem_campaigns")
    .select("html_template, subject, status, sent_count")
    .eq("id", bozza.id)
    .single()

  const html = String(dopo?.html_template ?? "")
  console.log("")
  console.log("  === verifica sulla copia salvata ===")
  console.log(`    firma "${NOME_FONDATORE}": ${html.includes(NOME_FONDATORE) ? "presente" : "ASSENTE, DA CORREGGERE"}`)
  console.log(`    segnaposto residuo:      ${html.includes("DA COMPLETARE") ? "SI, DA CORREGGERE" : "no"}`)
  console.log(`    oggetto (${String(dopo?.subject).length} caratteri): ${dopo?.subject}`)
  console.log(`    stato: ${dopo?.status}   inviate: ${dopo?.sent_count}`)

  // Controllo che nessun'altra campagna sia stata toccata.
  const { data: tutte } = await db
    .from("dem_campaigns")
    .select("name, status, sent_count")
    .order("created_at", { ascending: true })
  console.log("")
  console.log("  === tutte le campagne ===")
  for (const c of tutte || []) {
    console.log(`    ${String(c.status).padEnd(9)} inviate ${String(c.sent_count).padStart(6)}  ${c.name}`)
  }
}

main().catch((e) => {
  console.error("  ERRORE:", e instanceof Error ? e.message : e)
  process.exit(1)
})
