import { describe, expect, it } from "vitest"
import { calculateQuoteLine, type QuoteLineItem } from "./types"

function reviewsLine(quantity: number, billing_period: "monthly" | "yearly", unit_amount: number): QuoteLineItem {
  return {
    id: "reviews",
    kind: "module",
    project: "santaddeo",
    source_product_id: `reviews:${billing_period}`,
    name: "Recensioni",
    description: "Recensioni",
    quantity,
    unit_amount,
    amount: 0,
    billing_period,
    configuration: {
      pricing_model: "per_accommodation_minimum",
      pricing_unit: "accommodation",
      unit_price: 0.5,
      minimum_monthly: 5,
      annual_discount_pct: 20,
    },
  }
}

describe("per-accommodation pricing with a monthly minimum", () => {
  it("applies the 5 EUR monthly minimum to small properties", () => {
    expect(calculateQuoteLine(reviewsLine(5, "monthly", 0.5)).amount).toBe(5)
  })

  it("charges 0.50 EUR per accommodation above the minimum", () => {
    expect(calculateQuoteLine(reviewsLine(24, "monthly", 0.5)).amount).toBe(12)
    expect(calculateQuoteLine(reviewsLine(80, "monthly", 0.5)).amount).toBe(40)
  })

  it("applies the annual -20% to both the minimum and per-unit price", () => {
    expect(calculateQuoteLine(reviewsLine(5, "yearly", 4.8)).amount).toBe(48)
    expect(calculateQuoteLine(reviewsLine(24, "yearly", 4.8)).amount).toBeCloseTo(115.2, 2)
  })

  it("still applies an explicit quote discount after the pricing floor", () => {
    const item = reviewsLine(5, "monthly", 0.5)
    item.discount = { type: "percentage", value: 10 }
    expect(calculateQuoteLine(item).amount).toBe(4.5)
  })
})
