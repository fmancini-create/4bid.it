import { type NextRequest, NextResponse } from "next/server"
import { processSlopeScanBatch, SLOPE_DEFAULT_BATCH_SIZE } from "@/lib/slope/catalog"

export const dynamic = "force-dynamic"
export const maxDuration = 180

async function handler(request: NextRequest) {
  const authorization = request.headers.get("authorization")
  const validSecret = Boolean(process.env.CRON_SECRET) && authorization === `Bearer ${process.env.CRON_SECRET}`
  const isDev = process.env.NODE_ENV === "development"
  if (!isDev && !validSecret) return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })

  try {
    const result = await processSlopeScanBatch(SLOPE_DEFAULT_BATCH_SIZE)
    return NextResponse.json({ ok: true, ...result })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Errore scansione Slope"
    console.log("[v0] Slope scan failed:", message)
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  return handler(request)
}

export async function POST(request: NextRequest) {
  return handler(request)
}
