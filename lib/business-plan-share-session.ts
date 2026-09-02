import { createHmac, timingSafeEqual } from "crypto"
import type { NextRequest } from "next/server"

export const BUSINESS_PLAN_SHARE_COOKIE = "bp_share_session"

interface ShareSessionPayload {
  shareId: string
  token: string
  visitorName: string
  visitorEmail: string
  visitorCompany?: string
  exp: number
}

const encode = (value: string) => Buffer.from(value, "utf8").toString("base64url")
const decode = (value: string) => Buffer.from(value, "base64url").toString("utf8")

function getSigningSecret() {
  const secret = process.env.BUSINESS_PLAN_SHARE_SESSION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!secret) throw new Error("Missing BUSINESS_PLAN_SHARE_SESSION_SECRET or SUPABASE_SERVICE_ROLE_KEY")
  return secret
}

function signature(payload: string) {
  return createHmac("sha256", getSigningSecret()).update(payload).digest("base64url")
}

export function createBusinessPlanShareSession(
  payload: Omit<ShareSessionPayload, "exp">,
  ttlSeconds = 60 * 60 * 8,
) {
  const body = encode(JSON.stringify({ ...payload, exp: Math.floor(Date.now() / 1000) + ttlSeconds }))
  return `${body}.${signature(body)}`
}

export function verifyBusinessPlanShareSession(raw: string | undefined, expectedToken: string) {
  if (!raw) return null
  const [body, receivedSignature] = raw.split(".")
  if (!body || !receivedSignature) return null

  const expectedSignature = signature(body)
  const received = Buffer.from(receivedSignature)
  const expected = Buffer.from(expectedSignature)
  if (received.length !== expected.length || !timingSafeEqual(received, expected)) return null

  try {
    const payload = JSON.parse(decode(body)) as ShareSessionPayload
    if (payload.token !== expectedToken || payload.exp <= Math.floor(Date.now() / 1000)) return null
    return payload
  } catch {
    return null
  }
}

export function getBusinessPlanShareSession(request: NextRequest, token: string) {
  return verifyBusinessPlanShareSession(request.cookies.get(BUSINESS_PLAN_SHARE_COOKIE)?.value, token)
}
