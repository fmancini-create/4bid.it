/**
 * Access to the PRIVATE `project-room` bucket.
 *
 * The bucket is not public and `authenticated` holds no policy on
 * storage.objects, so a file is unreachable from the browser by URL guessing.
 * Every read is a short-lived signed URL minted here, only after the caller's
 * role on the owning project has been verified.
 */

import { createAdminClient } from "@/lib/supabase/server"

export const PROJECT_ROOM_BUCKET = "project-room"

/** Short enough that a leaked link stops working quickly. */
const VIEW_TTL_SECONDS = 60 * 10
const DOWNLOAD_TTL_SECONDS = 60

export async function createSignedViewUrl(filePath: string): Promise<string | null> {
  return signUrl(filePath, VIEW_TTL_SECONDS)
}

/**
 * Signed URL that forces a download with a clean filename.
 * TTL is deliberately shorter: this one tends to be copied around.
 */
export async function createSignedDownloadUrl(filePath: string, fileName?: string | null): Promise<string | null> {
  return signUrl(filePath, DOWNLOAD_TTL_SECONDS, fileName ?? undefined)
}

async function signUrl(filePath: string, expiresIn: number, download?: string): Promise<string | null> {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin.storage
      .from(PROJECT_ROOM_BUCKET)
      .createSignedUrl(filePath, expiresIn, download ? { download } : undefined)

    if (error || !data?.signedUrl) {
      console.log("[v0] createSignedUrl failed:", filePath, error?.message)
      return null
    }
    return data.signedUrl
  } catch (error) {
    console.log("[v0] createSignedUrl threw:", (error as Error).message)
    return null
  }
}

/**
 * Deterministic, non-guessable object path.
 * Scoped by project and document so the bucket stays navigable for an
 * operator, with a random suffix so the path itself is not enumerable.
 */
export function buildVersionPath(params: {
  projectId: string
  documentId: string
  versionNumber: number
  fileName: string
}): string {
  const safeName = sanitizeFileName(params.fileName)
  const nonce = crypto.randomUUID().slice(0, 8)
  return `${params.projectId}/${params.documentId}/v${params.versionNumber}-${nonce}-${safeName}`
}

export function sanitizeFileName(fileName: string): string {
  const trimmed = (fileName || "documento.pdf").trim()
  const normalized = trimmed
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip accents
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-.]+|[-.]+$/g, "")
  const withExt = normalized.toLowerCase().endsWith(".pdf") ? normalized : `${normalized}.pdf`
  return withExt.slice(-120) || "documento.pdf"
}

export async function uploadVersionFile(params: {
  path: string
  body: ArrayBuffer | Buffer | Uint8Array
  contentType?: string
}): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const admin = createAdminClient()
    const { error } = await admin.storage.from(PROJECT_ROOM_BUCKET).upload(params.path, params.body, {
      contentType: params.contentType ?? "application/pdf",
      upsert: false, // versions are immutable: never overwrite an object
    })
    if (error) {
      console.log("[v0] uploadVersionFile failed:", error.message)
      return { ok: false, error: error.message }
    }
    return { ok: true }
  } catch (error) {
    const message = (error as Error).message
    console.log("[v0] uploadVersionFile threw:", message)
    return { ok: false, error: message }
  }
}

export async function removeVersionFile(path: string): Promise<void> {
  try {
    const admin = createAdminClient()
    await admin.storage.from(PROJECT_ROOM_BUCKET).remove([path])
  } catch (error) {
    console.log("[v0] removeVersionFile threw:", (error as Error).message)
  }
}
