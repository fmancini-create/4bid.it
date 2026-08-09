/**
 * Access to the PRIVATE `job-applications` bucket (candidate CVs).
 *
 * The bucket is not public and there are no policies on storage.objects, so a
 * CV is unreachable from the browser by URL guessing. Every read is a
 * short-lived signed URL minted here (service-role), only after the caller has
 * been verified as an authorized admin in the calling route.
 */

import { createAdminClient } from "@/lib/supabase/server-admin"

export const JOB_APPLICATIONS_BUCKET = "job-applications"

const VIEW_TTL_SECONDS = 60 * 10 // short enough that a leaked link expires fast
const DOWNLOAD_TTL_SECONDS = 60

export async function createSignedCvUrl(filePath: string): Promise<string | null> {
  return signUrl(filePath, VIEW_TTL_SECONDS)
}

export async function createSignedCvDownloadUrl(
  filePath: string,
  fileName?: string | null,
): Promise<string | null> {
  return signUrl(filePath, DOWNLOAD_TTL_SECONDS, fileName ?? undefined)
}

async function signUrl(filePath: string, expiresIn: number, download?: string): Promise<string | null> {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin.storage
      .from(JOB_APPLICATIONS_BUCKET)
      .createSignedUrl(filePath, expiresIn, download ? { download } : undefined)

    if (error || !data?.signedUrl) {
      console.log("[v0] createSignedCvUrl failed:", filePath, error?.message)
      return null
    }
    return data.signedUrl
  } catch (error) {
    console.log("[v0] createSignedCvUrl threw:", (error as Error).message)
    return null
  }
}

/**
 * Deterministic, non-guessable object path scoped by position slug + date,
 * with a random suffix so the path itself is not enumerable.
 */
export function buildCvPath(params: { positionSlug: string; fileName: string }): string {
  const safeSlug = (params.positionSlug || "spontanea").replace(/[^a-z0-9-]+/gi, "-").toLowerCase()
  const safeName = sanitizeFileName(params.fileName)
  const nonce = crypto.randomUUID()
  const yyyymm = new Date().toISOString().slice(0, 7) // YYYY-MM
  return `${safeSlug}/${yyyymm}/${nonce}-${safeName}`
}

export function sanitizeFileName(fileName: string): string {
  const trimmed = (fileName || "cv.pdf").trim()
  const normalized = trimmed
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip accents
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-.]+|[-.]+$/g, "")
  const withExt = normalized.toLowerCase().endsWith(".pdf") ? normalized : `${normalized}.pdf`
  return withExt.slice(-120) || "cv.pdf"
}

export async function uploadCvFile(params: {
  path: string
  body: ArrayBuffer | Buffer | Uint8Array
  contentType?: string
}): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const admin = createAdminClient()
    const { error } = await admin.storage.from(JOB_APPLICATIONS_BUCKET).upload(params.path, params.body, {
      contentType: params.contentType ?? "application/pdf",
      upsert: false,
    })
    if (error) {
      console.log("[v0] uploadCvFile failed:", error.message)
      return { ok: false, error: error.message }
    }
    return { ok: true }
  } catch (error) {
    const message = (error as Error).message
    console.log("[v0] uploadCvFile threw:", message)
    return { ok: false, error: message }
  }
}

export async function removeCvFile(path: string): Promise<void> {
  try {
    const admin = createAdminClient()
    await admin.storage.from(JOB_APPLICATIONS_BUCKET).remove([path])
  } catch (error) {
    console.log("[v0] removeCvFile threw:", (error as Error).message)
  }
}
