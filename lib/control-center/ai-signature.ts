import "server-only"
import { createHmac } from "node:crypto"
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
  return digest(meta) === meta.signature
}
