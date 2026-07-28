import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import { requireVersionAccess } from "@/lib/project-room/auth"
import { canDownload } from "@/lib/project-room/permissions"
import { recordAudit } from "@/lib/project-room/activity"
import { PROJECT_ROOM_BUCKET } from "@/lib/project-room/storage"
import { getVersion } from "@/lib/project-room/queries"

/**
 * Serve a version's PDF.
 *
 * The bytes are streamed through this route instead of redirecting to a signed
 * storage URL. That costs a hop, and buys two things that matter here:
 *
 *  1. No storage URL ever reaches the browser, so there is nothing to copy out
 *     of devtools and share with someone who has no access.
 *  2. Authorization is re-checked on every request for the file, not once when
 *     a link is minted.
 *
 * `?download=1` is refused unless the caller actually holds the download
 * permission; otherwise the file is served inline for the viewer.
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const access = await requireVersionAccess(id)
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status })
  }

  if (!access.data.filePath) {
    return NextResponse.json({ error: "Documento non ancora disponibile." }, { status: 404 })
  }

  const wantsDownload = new URL(request.url).searchParams.get("download") === "1"
  if (wantsDownload && !canDownload(access.data.role, access.data.canDownload)) {
    return NextResponse.json({ error: "Il download non e consentito per il tuo ruolo." }, { status: 403 })
  }

  const admin = createAdminClient()
  const { data, error } = await admin.storage.from(PROJECT_ROOM_BUCKET).download(access.data.filePath)

  if (error || !data) {
    console.log("[v0] version download failed:", access.data.filePath, error?.message)
    return NextResponse.json({ error: "Documento non disponibile." }, { status: 404 })
  }

  const version = await getVersion(access.data.versionId)
  const fileName = version?.file_name ?? "documento.pdf"

  // Only an explicit download is audited. Logging every viewer byte-range
  // request would bury the entries that actually matter.
  if (wantsDownload) {
    await recordAudit({
      projectId: access.data.projectId,
      userId: access.data.user.id,
      action: "version.downloaded",
      entityType: "version",
      entityId: access.data.versionId,
      metadata: { file_name: fileName },
    })
  }

  const disposition = wantsDownload
    ? `attachment; filename="${encodeURIComponent(fileName)}"`
    : `inline; filename="${encodeURIComponent(fileName)}"`

  return new NextResponse(data, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": disposition,
      // Confidential: never let a shared or CDN cache retain these bytes.
      "Cache-Control": "private, no-store, max-age=0",
      "X-Content-Type-Options": "nosniff",
    },
  })
}
