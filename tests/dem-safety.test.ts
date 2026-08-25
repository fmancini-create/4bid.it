import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"
import {
  isSystemicEmailProviderError,
  providerPauseReason,
} from "@/lib/dem/provider-health"

function source(path: string): string {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8")
}

describe("classificazione degli errori del provider email", () => {
  it("considera sistemici credenziali, sospensione, rate limit e guasti 5xx", () => {
    expect(isSystemicEmailProviderError({ statusCode: 401 })).toBe(true)
    expect(isSystemicEmailProviderError({ statusCode: 403 })).toBe(true)
    expect(isSystemicEmailProviderError({ statusCode: 429 })).toBe(true)
    expect(isSystemicEmailProviderError({ statusCode: 503 })).toBe(true)
    expect(isSystemicEmailProviderError({ message: "API key is invalid" })).toBe(true)
    expect(isSystemicEmailProviderError({ message: "Account suspended" })).toBe(true)
  })

  it("non confonde un indirizzo malformato con un guasto globale", () => {
    expect(
      isSystemicEmailProviderError({
        statusCode: 422,
        message: "The email address is invalid",
      }),
    ).toBe(false)
  })

  it("produce un motivo persistente e operativo", () => {
    expect(
      providerPauseReason({ healthy: false, error: "API key is invalid", statusCode: 401 }),
    ).toContain("Invii fermati automaticamente")
  })
})

describe("contratto di sicurezza delle DEM", () => {
  it("autentica il cron warm e inoltra gli errori HTTP", () => {
    const warm = source("lib/dem/warm.ts")
    const cron = source("app/api/cron/dem-warm-send/route.ts")
    expect(warm).toContain("Authorization: `Bearer ${cronSecret}`")
    expect(warm).toContain("httpStatus: res.status")
    expect(cron).toContain("return NextResponse.json(")
    expect(cron).toContain("dispatch fallito")
  })

  it("esclude le campagne warm dal cron freddo e usa un ordine round-robin", () => {
    const cron = source("app/api/cron/dem-auto-send/route.ts")
    expect(cron).toContain('campaign_kind.is.null,campaign_kind.eq.cold')
    expect(cron).toContain('.order("updated_at", { ascending: true })')
  })

  it("ferma il lotto senza marcare il destinatario come fallito su errore sistemico", () => {
    const send = source("app/api/dem/send/route.ts")
    expect(send).toContain("else if (result.systemic)")
    expect(send).toContain("if (providerFailure) break")
    expect(send).toContain('code: "provider_unavailable"')
  })

  it("rende l'avviso DEM globale in tutto il segmento admin", () => {
    const layout = source("app/admin/layout.tsx")
    const banner = source("components/admin-dem-alert-banner.tsx")
    expect(layout).toContain("<AdminDemAlertBanner />")
    expect(banner).toContain('role="alert"')
    expect(banner).toContain("useDemAlerts")
  })

  it("impedisce sequenze ricorsive di solleciti", () => {
    const warmApi = source("app/api/dem/warm/route.ts")
    expect(warmApi).toContain('campaign.campaign_kind === "warm_followup"')
    expect(warmApi).toContain("I solleciti si configurano solo sulla campagna originale")
  })
})
