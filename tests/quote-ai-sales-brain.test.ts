import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { describe, expect, it } from "vitest"
import { analyzeQuoteSalesSignals } from "@/lib/quotes/sales-intelligence"

function source(path: string) {
  return readFileSync(resolve(process.cwd(), path), "utf8")
}

describe("quote AI sales brain", () => {
  it("uses the premium model and longer memory only for quote conversations", () => {
    const route = source("app/api/ai-support/route.ts")
    expect(route).toContain("QUOTE_SALES_MODEL")
    expect(route).toContain("QUOTE_HISTORY_LIMIT = 20")
    expect(route).toContain("quoteContext ? QUOTE_HISTORY_LIMIT : GENERAL_HISTORY_LIMIT")
    expect(route).toContain("model: QUOTE_SALES_MODEL")
  })

  it("tracks explicit buying signals without pretending to calculate a guaranteed close probability", () => {
    const signal = analyzeQuoteSalesSignals([
      { role: "user", content: "Mi interessa Santaddeo. Quanto costa annuale?" },
      { role: "assistant", content: "Ti spiego la formula." },
      { role: "user", content: "Va bene, come procediamo per attivarlo?" },
    ], { quotedProjects: ["santaddeo"] })
    expect(signal.interestedProducts).toContain("santaddeo")
    expect(signal.positiveSignals.length).toBeGreaterThan(0)
    expect(signal.engagementScore).toBeGreaterThanOrEqual(38)
    expect(["warm", "hot"]).toContain(signal.temperature)
  })

  it("recognizes explicit objections and suggests handling the objection first", () => {
    const signal = analyzeQuoteSalesSignals([{ role: "user", content: "Mi piace, ma costa troppo e devo pensarci." }], { quotedProjects: ["santaddeo"] })
    expect(signal.objections).toContain("prezzo/costo")
    expect(signal.objections).toContain("tempo/decisione")
    expect(signal.nextBestAction.toLowerCase()).toContain("obiezione")
  })

  it("keeps the intelligence table server-side through the admin client", () => {
    const route = source("app/api/ai-support/route.ts")
    expect(route).toContain("createAdminClient")
    expect(route).toContain("saveQuoteSalesIntelligence(admin")
  })
})
