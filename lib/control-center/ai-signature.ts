import "server-only"
import { createHmac, timingSafeEqual } from "node:crypto"
import { canonicalAiMetaPayload, type AiPrMeta } from "./ai-meta"

function signingKey() {
  const token = process.env.GITHUB_FIX_TOKEN
  if (!token) throw new Error("GITHUB_FIX_TOKEN non configurato")
  return token
}

function digest(meta: Omit<AiPrMeta, "signature"> | AiPrMeta) {
  return createHmac("sha256", signingKey()).update(canonicalAiMetaPayload(meta)).digest("hex")
}

export function signAiMeta(meta: Omit<AiPrMeta, "signature">): AiPrMeta {
  return { ...meta, signature: digest(meta) }
}

export function verifyAiMetaSignature(meta: AiPrMeta) {
  const expected = Buffer.from(digest(meta), "hex")
  const actual = Buffer.from(meta.signature, "hex")
  return expected.length === actual.length && timingSafeEqual(expected, actual)
}
