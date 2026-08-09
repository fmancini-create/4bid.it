import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server-admin"
import { getAdminUser } from "@/lib/jobs/admin-guard"
import { createSignedCvUrl, createSignedCvDownloadUrl } from "@/lib/jobs/storage"

/**
 * Mints a short-lived signed URL for a candidate's CV, only after verifying the
 * caller is an authorized admin. The CV bucket is private and never exposed by
 * a public/stable URL.
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getAdminUser())) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
  }

  const { id } = await params
  const download = new URL(request.url).searchParams.get("download") === "1"

  const admin = createAdminClient()
  const { data, error } = await admin
    .from("job_applications")
    .select("cv_path, cv_filename")
    .eq("id", id)
    .single()

  if (error || !data?.cv_path) {
    return NextResponse.json({ error: "CV non disponibile" }, { status: 404 })
  }

  const url = download
    ? await createSignedCvDownloadUrl(data.cv_path, data.cv_filename)
    : await createSignedCvUrl(data.cv_path)

  if (!url) {
    return NextResponse.json({ error: "Impossibile generare il link" }, { status: 500 })
  }
  return NextResponse.json({ url })
}
