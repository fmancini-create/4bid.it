import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import { requireVersionAccess } from "@/lib/project-room/auth"
import { canDownload } from "@/lib/project-room/permissions"
import { recordAudit } from "@/lib/project-room/activity"
import { PROJECT_ROOM_BUCKET } from "@/lib/project-room/storage"
import { getVersion } from "@/lib/project-room/queries"

function approvedExternalUrl(filePath: string): URL | null {
  try {
    const url = new URL(filePath)
    if (url.protocol !== "https:") return null
    if (url.hostname !== "docs.google.com" && url.hostname !== "drive.google.com") return null
    return url
  } catch {
    return null
  }
}

/**
 * Serve a protected document version.
 *
 * PDFs stored in the private Project Room bucket are streamed through this
 * route. Approved external Office documents are redirected only after the same
 * membership and download checks have run, so the Project Room remains the
 * access gate for both document types.
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
    return NextResponse.json({ error: "Il download non è consentito per il tuo ruolo." }, { status: 403 })
  }

  const version = await getVersion(access.data.versionId)
  const fileName = version?.file_name ?? "documento.pdf"
  const externalUrl = approvedExternalUrl(access.data.filePath)

  if (externalUrl) {
    if (wantsDownload) {
      await recordAudit({
        projectId: access.data.projectId,
        userId: access.data.user.id,
        action: "version.downloaded",
        entityType: "version",
        entityId: access.data.versionId,
        metadata: { file_name: fileName, provider: externalUrl.hostname },
      })
    }

    return NextResponse.redirect(externalUrl, 302)
  }

  const admin = createAdminClient()
  const { data, error } = await admin.storage.from(PROJECT_ROOM_BUCKET).download(access.data.filePath)

  if (error || !data) {
    console.log("[v0] version download failed:", access.data.filePath, error?.message)
    return NextResponse.json({ error: "Documento non disponibile." }, { status: 404 })
  }

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
      "Cache-Control": "private, no-store, max-age=0",
      "X-Content-Type-Options": "nosniff",
    },
  })
}
