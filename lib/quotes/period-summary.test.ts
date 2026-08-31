import { describe, expect, it } from "vitest"
import { setCommercialMeta } from "./commercial"
import { summarizeQuotePeriods, summarizeYearlyQuoteScenario } from "./period-summary"
import type { QuoteLineItem } from "./types"

function line(patch: Partial<QuoteLineItem>): QuoteLineItem {
  return {
    id: crypto.randomUUID(),
    kind: "module",
    project: "custom",
    name: "Voce",
    description: "Voce",
    quantity: 1,
    unit_amount: 0,
    amount: 0,
    billing_period: "one_time",
    trial_days: 0,
    features: [],
    configuration: {},
    catalog_snapshot: {},
    optional: false,
    default_selected: true,
    ...patch,
  }
}

describe("quote period summaries", () => {
  it("keeps the discounted setup in monthly formula and zeros it in yearly formula", () => {
    const setup = setCommercialMeta(
      line({
        kind: "setup",
        name: "Setup / attivazione",
        quantity: 10,
        unit_amount: 150,
        discount: { type: "percentage", value: 50 },
      }),
      { normal_price: 150, annual_setup_mode: "free", free_on_annual: true },
    )

    const monthly = summarizeQuotePeriods([setup])
    const yearly = summarizeYearlyQuoteScenario([setup])

    expect(monthly.oneTime).toBe(750)
    expect(monthly.firstYear).toBe(750)
    expect(yearly.oneTime).toBe(0)
    expect(yearly.firstYear).toBe(0)
  })

  it("matches the screenshot first-year arithmetic before annual setup benefits", () => {
    const setup = line({
      kind: "setup",
      quantity: 1,
      unit_amount: 1750,
      amount: 1750,
    })
    const recurring = line({
      kind: "module",
      billing_period: "monthly",
      unit_amount: 2504.8,
      amount: 2504.8,
    })

    const totals = summarizeQuotePeriods([setup, recurring])
    expect(totals.firstYear).toBeCloseTo(31807.6, 2)
  })
})
