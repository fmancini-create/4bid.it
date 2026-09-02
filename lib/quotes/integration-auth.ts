import { timingSafeEqual } from "crypto"
import type { NextRequest } from "next/server"

function safeEqual(left: string, right: string): boolean {
  const a = Buffer.from(left)
  const b = Buffer.from(right)
  return a.length === b.length && timingSafeEqual(a, b)
}

export function authorizeHotelAccelerator(request: NextRequest): { ok: true } | { ok: false; status: number; error: string } {
  const expected = process.env.HOTELACCELERATOR_QUOTES_API_KEY?.trim()
  if (!expected) {
    return { ok: false, status: 503, error: "Integrazione HotelAccelerator non configurata" }
  }

  const header = request.headers.get("authorization") || ""
  const supplied = header.replace(/^Bearer\s+/i, "").trim()
  if (!supplied || !safeEqual(supplied, expected)) {
    return { ok: false, status: 401, error: "Credenziali integrazione non valide" }
  }

  return { ok: true }
}
