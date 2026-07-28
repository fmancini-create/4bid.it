/**
 * Upload of a new document version.
 *
 * Versions are immutable: this route only ever creates a NEW version (or fills
 * the file of a version that has none). It never replaces the bytes of a version
 * that already has a file, so the history stays truthful.
 */

import { type NextRequest, NextResponse } from "next/server"
import { PDFDocument } from "pdf-lib"
import { createAdminClient } from "@/lib/supabase/server"
import { isUuid, requireDocumentAccess } from "@/lib/project-room/auth"
import { canManageDocuments } from "@/lib/project-room/permissions"
import { buildVersionPath, removeVersionFile, uploadVersionFile } from "@/lib/project-room/storage"
import { notifyUsers, projectAudience, recordAudit } from "@/lib/project-room/activity"

/** Keeps a hostile upload from exhausting memory: read once, bounded. */
const MAX_BYTES = 25 * 1024 * 1024

export async function POST(request: NextRequest) {
  let form: FormData
  try {
    form = await request.formData()
  } catch {
    return NextResponse.json({ error: "Richiesta non valida." }, { status: 400 })
  }

  const documentId = String(form.get("document_id") ?? "")
  const versionLabel = String(form.get("version_label") ?? "").trim()
  const changeSummary = String(form.get("change_summary") ?? "").trim()
  const replaceVersionId = String(form.get("replace_version_id") ?? "").trim()
  const file = form.get("file")

  if (!isUuid(documentId)) {
    return NextResponse.json({ error: "Documento non valido." }, { status: 400 })
  }

  // Authorization before any file handling, so an unauthorized caller never
  // gets us to read or store their bytes.
  const access = await requireDocumentAccess(documentId)
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status })
  }
  if (!canManageDocuments(access.data.role)) {
    return NextResponse.json({ error: "Solo un project manager puo caricare versioni." }, { status: 403 })
  }

  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Allega un file PDF." }, { status: 400 })
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Il file supera i 25 MB." }, { status: 413 })
  }

  const bytes = new Uint8Array(await file.arrayBuffer())

  // Trust the bytes, not the declared MIME type or extension: both are
  // attacker-controlled. A real PDF starts with %PDF-.
  const header = new TextDecoder("latin1").decode(bytes.subarray(0, 5))
  if (header !== "%PDF-") {
    return NextResponse.json({ error: "Il file non e un PDF valido." }, { status: 400 })
  }

  // Page count comes from parsing the document, never from user input.
  let pageCount: number | null = null
  try {
    const parsed = await PDFDocument.load(bytes, { updateMetadata: false })
    pageCount = parsed.getPageCount()
  } catch (error) {
    console.log("[v0] version upload: pdf parse failed:", (error as Error).message)
    return NextResponse.json({ error: "Il PDF risulta illeggibile o danneggiato." }, { status: 400 })
  }

  const admin = createAdminClient()

  // Fill-the-gap path: a version row that exists but has no file yet.
  if (replaceVersionId) {
    if (!isUuid(replaceVersionId)) {
      return NextResponse.json({ error: "Versione non valida." }, { status: 400 })
    }
    const { data: target } = await admin
      .from("pr_document_versions")
      .select("id, document_id, version_number, file_path")
      .eq("id", replaceVersionId)
      .maybeSingle()

    if (!target || target.document_id !== documentId) {
      return NextResponse.json({ error: "Versione non trovata." }, { status: 404 })
    }
    if (target.file_path) {
      return NextResponse.json(
        { error: "Questa versione ha gia un file. Carica una nuova versione." },
        { status: 409 },
      )
    }

    const path = buildVersionPath({
      projectId: access.data.projectId,
      documentId,
      versionNumber: target.version_number,
      fileName: file.name,
    })
    const uploaded = await uploadVersionFile({ path, body: bytes })
    if (!uploaded.ok) {
      return NextResponse.json({ error: "Caricamento non riuscito." }, { status: 502 })
    }

    const { error: updateError } = await admin
      .from("pr_document_versions")
      .update({ file_path: path, file_name: file.name, file_size: file.size, page_count: pageCount })
      .eq("id", replaceVersionId)

    if (updateError) {
      // Do not leave an orphan object behind if the row could not be updated.
      await removeVersionFile(path)
      console.log("[v0] version upload: row update failed:", updateError.message)
      return NextResponse.json({ error: "Caricamento non riuscito." }, { status: 500 })
    }

    await recordAudit({
      projectId: access.data.projectId,
      userId: access.data.user.id,
      action: "version.uploaded",
      entityType: "pr_document_versions",
      entityId: replaceVersionId,
      metadata: { page_count: pageCount, filled_existing_version: true },
    })

    return NextResponse.json({ ok: true, versionId: replaceVersionId, pageCount })
  }

  // New version: number is derived server-side from the current maximum.
  const { data: last } = await admin
    .from("pr_document_versions")
    .select("version_number")
    .eq("document_id", documentId)
    .order("version_number", { ascending: false })
    .limit(1)
    .maybeSingle()

  const versionNumber = (last?.version_number ?? 0) + 1
  const label = versionLabel || `v${versionNumber}.0`

  const path = buildVersionPath({
    projectId: access.data.projectId,
    documentId,
    versionNumber,
    fileName: file.name,
  })
  const uploaded = await uploadVersionFile({ path, body: bytes })
  if (!uploaded.ok) {
    return NextResponse.json({ error: "Caricamento non riuscito." }, { status: 502 })
  }

  const { data: created, error: insertError } = await admin
    .from("pr_document_versions")
    .insert({
      document_id: documentId,
      version_number: versionNumber,
      version_label: label,
      change_summary: changeSummary || null,
      file_path: path,
      file_name: file.name,
      file_size: file.size,
      page_count: pageCount,
      status: "in_revisione",
      uploaded_by: access.data.user.id,
    })
    .select("id")
    .single()

  if (insertError || !created) {
    await removeVersionFile(path)
    console.log("[v0] version upload: insert failed:", insertError?.message)
    return NextResponse.json({ error: "Caricamento non riuscito." }, { status: 500 })
  }

  await admin.from("pr_documents").update({ current_version_id: created.id }).eq("id", documentId)

  await recordAudit({
    projectId: access.data.projectId,
    userId: access.data.user.id,
    action: "version.uploaded",
    entityType: "pr_document_versions",
    entityId: created.id,
    metadata: { version_label: label, page_count: pageCount },
  })

  const audience = await projectAudience(access.data.projectId)
  await notifyUsers({
    userIds: audience,
    projectId: access.data.projectId,
    type: "version.uploaded",
    title: `Nuova versione ${label}`,
    body: changeSummary || null,
    link: `/area-riservata/documenti/${documentId}`,
    exceptUserId: access.data.user.id,
  })

  return NextResponse.json({ ok: true, versionId: created.id, versionLabel: label, pageCount })
}
