/**
 * Fixture di VERIFICA TECNICA — non e' un seed di produzione.
 *
 * Crea un progetto isolato ("zz-verifica-tecnica") con un PDF generato
 * artificialmente, per poter provare in browser il visualizzatore, i commenti
 * e le proposte di revisione. Non tocca in alcun modo i progetti reali.
 *
 *   node --env-file-if-exists=/vercel/share/.env.project scripts/project-room/verify-fixture.mjs up
 *   node --env-file-if-exists=/vercel/share/.env.project scripts/project-room/verify-fixture.mjs down
 */

import { createClient } from "@supabase/supabase-js"
import { PDFDocument, StandardFonts, rgb } from "pdf-lib"

const SLUG = "zz-verifica-tecnica"
const BUCKET = "project-room"
const TEST_EMAIL = "verifica.tecnica@4bid.local"
const TEST_PASSWORD = "VerificaTecnica!2026"

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.error("Mancano SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY")
  process.exit(1)
}
const db = createClient(url, key, { auth: { persistSession: false } })

async function buildPdf() {
  const doc = await PDFDocument.create()
  doc.setTitle("Documento di verifica tecnica")
  const bold = await doc.embedFont(StandardFonts.HelveticaBold)
  const font = await doc.embedFont(StandardFonts.Helvetica)

  const pages = [
    {
      h: "Documento di verifica tecnica",
      body: [
        "Questo file NON e' un documento di 4Bid.",
        "Serve solo a verificare il visualizzatore PDF, i commenti",
        "e le proposte di revisione dell'area riservata.",
        "",
        "Al termine della verifica viene eliminato insieme al",
        "progetto che lo contiene.",
      ],
    },
    {
      h: "Pagina 2 — ancoraggio commenti",
      body: [
        "Il testo di questa pagina esiste per poter selezionare una",
        "porzione e verificare che il commento venga ancorato alla",
        "pagina corretta con l'estratto selezionato.",
        "",
        "Paragrafo di prova: la copertura del perimetro va calcolata",
        "sul totale dei costi imputabili, non sul solo campione.",
      ],
    },
    {
      h: "Pagina 3 — proposte di revisione",
      body: [
        "Testo originale proposto per la modifica:",
        "",
        "  \"Il termine di consegna e' fissato in trenta giorni.\"",
        "",
        "Serve per verificare il flusso proposta -> approvazione o",
        "rifiuto, con motivazione obbligatoria.",
      ],
    },
  ]

  for (const p of pages) {
    const page = doc.addPage([595, 842])
    page.drawText(p.h, { x: 56, y: 760, size: 18, font: bold, color: rgb(0.17, 0.24, 0.31) })
    page.drawLine({
      start: { x: 56, y: 748 },
      end: { x: 539, y: 748 },
      thickness: 1,
      color: rgb(0.36, 0.61, 0.84),
    })
    let y = 710
    for (const line of p.body) {
      page.drawText(line, { x: 56, y, size: 11, font, color: rgb(0.2, 0.2, 0.2) })
      y -= 20
    }
    page.drawText("FILE DI VERIFICA TECNICA - NON UN DOCUMENTO REALE", {
      x: 56,
      y: 60,
      size: 9,
      font,
      color: rgb(0.6, 0.6, 0.6),
    })
  }
  return Buffer.from(await doc.save())
}

async function findProject() {
  const { data } = await db.from("pr_projects").select("id, organization_id, client_id").eq("slug", SLUG).maybeSingle()
  return data
}

async function down() {
  const project = await findProject()
  if (!project) {
    console.log("nessun progetto di verifica da rimuovere")
  } else {
    const { data: docs } = await db.from("pr_documents").select("id").eq("project_id", project.id)
    const docIds = (docs || []).map((d) => d.id)
    if (docIds.length) {
      const { data: versions } = await db.from("pr_document_versions").select("file_path").in("document_id", docIds)
      const paths = (versions || []).map((v) => v.file_path).filter(Boolean)
      if (paths.length) {
        await db.storage.from(BUCKET).remove(paths)
        console.log("rimossi file:", paths.length)
      }
      // La FK current_version_id impedisce di cancellare prima le versioni.
      await db.from("pr_documents").update({ current_version_id: null }).in("id", docIds)
      await db.from("pr_document_versions").delete().in("document_id", docIds)
      await db.from("pr_documents").delete().in("id", docIds)
    }
    await db.from("pr_projects").delete().eq("id", project.id)
    console.log("progetto di verifica rimosso")
  }

  // Indipendente dal progetto: un run interrotto a metà può aver creato il
  // cliente e non il progetto, e resterebbe irraggiungibile da project.client_id.
  await db.from("pr_clients").delete().eq("slug", SLUG + "-client")

  const { data: list } = await db.auth.admin.listUsers({ perPage: 1000 })
  const u = list?.users?.find((x) => x.email === TEST_EMAIL)
  if (u) {
    await db.auth.admin.deleteUser(u.id)
    console.log("utente di verifica rimosso")
  }
}

async function up() {
  await down()

  const { data: org, error: orgErr } = await db
    .from("pr_organizations")
    .select("id")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle()
  if (orgErr || !org) throw new Error("organizzazione non trovata: " + (orgErr?.message || "vuota"))

  const { data: list } = await db.auth.admin.listUsers({ perPage: 1000 })
  let user = list?.users?.find((x) => x.email === TEST_EMAIL)
  if (!user) {
    const { data, error } = await db.auth.admin.createUser({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: "Utente Verifica Tecnica" },
    })
    if (error) throw new Error("createUser: " + error.message)
    user = data.user
  }

  const { data: client, error: cErr } = await db
    .from("pr_clients")
    .insert({ organization_id: org.id, name: "Verifica Tecnica", slug: SLUG + "-client" })
    .select("id")
    .single()
  if (cErr) throw new Error("client: " + cErr.message)

  const { data: project, error: pErr } = await db
    .from("pr_projects")
    .insert({
      organization_id: org.id,
      client_id: client.id,
      name: "Verifica tecnica (temporaneo)",
      slug: SLUG,
      description: "Progetto temporaneo per la verifica in browser. Da eliminare.",
      status: "in_revisione",
    })
    .select("id")
    .single()
  if (pErr) throw new Error("project: " + pErr.message)

  const { error: mErr } = await db
    .from("pr_project_members")
    .insert({ project_id: project.id, user_id: user.id, role: "project_manager", can_download: true })
  if (mErr) throw new Error("member: " + mErr.message)

  const { data: document, error: dErr } = await db
    .from("pr_documents")
    .insert({
      project_id: project.id,
      title: "Documento di verifica tecnica",
      description: "File generato per verificare il visualizzatore. Non e' un documento reale.",
      status: "in_revisione",
    })
    .select("id")
    .single()
  if (dErr) throw new Error("document: " + dErr.message)

  const pdf = await buildPdf()
  const path = `${project.id}/${document.id}/v1-verifica-tecnica.pdf`
  const { error: upErr } = await db.storage.from(BUCKET).upload(path, pdf, {
    contentType: "application/pdf",
    upsert: true,
  })
  if (upErr) throw new Error("upload: " + upErr.message)

  const { data: version, error: vErr } = await db
    .from("pr_document_versions")
    .insert({
      document_id: document.id,
      version_number: 1,
      version_label: "v1.0",
      file_path: path,
      file_name: "documento-di-verifica-tecnica.pdf",
      file_size: pdf.length,
      page_count: 3,
      status: "in_revisione",
      changelog: "Versione generata per la verifica tecnica.",
      uploaded_by: user.id,
    })
    .select("id")
    .single()
  if (vErr) throw new Error("version: " + vErr.message)

  await db.from("pr_documents").update({ current_version_id: version.id }).eq("id", document.id)

  console.log("FIXTURE PRONTA")
  console.log("  email:      ", TEST_EMAIL)
  console.log("  password:   ", TEST_PASSWORD)
  console.log("  progetto:   /area-riservata/progetti/" + SLUG)
  console.log("  documento:  /area-riservata/documenti/" + document.id)
}

const mode = process.argv[2]
if (mode === "down") {
  await down()
} else if (mode === "up") {
  await up()
} else {
  console.error("uso: verify-fixture.mjs up|down")
  process.exit(1)
}
