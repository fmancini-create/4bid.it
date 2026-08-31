import { describe, expect, it } from "vitest"
import { applyBillingPreference, setCommercialMeta } from "@/lib/quotes/commercial"
import {
  getPropertyPricing,
  isEcosystemOffer,
  isEcosystemOfferSelected,
  markEcosystemOffer,
  selectEcosystemOffer,
  withPropertyPricing,
} from "@/lib/quotes/ecosystem"
import { calculateQuoteLine, calculateQuoteTotal, type QuoteLineItem } from "@/lib/quotes/types"

function reviewsLine(quantity: number, billing_period: "monthly" | "yearly", unit_amount: number, id = "reviews"): QuoteLineItem {
  return {
    id,
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

function baseLine(): QuoteLineItem {
  return setCommercialMeta({
    id: "crm",
    kind: "module",
    project: "hotelaccelerator",
    name: "CRM",
    description: "CRM",
    quantity: 1,
    unit_amount: 10,
    amount: 10,
    billing_period: "monthly",
    optional: true,
  }, {
    billing_family: "crm",
    billing_options: {
      monthly: { billing_period: "monthly", unit_amount: 10 },
      yearly: { billing_period: "yearly", unit_amount: 100, discount_pct: 16.67 },
    },
    dependency: { role: "addon", project: "hotelaccelerator", requires_base: true, required_kind: "plan" },
  })
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

  it("applies the minimum separately to every hotel in a group", () => {
    const smallHotel = reviewsLine(6, "monthly", 0.5, "reviews-hotel-a")
    const largerHotel = reviewsLine(24, "monthly", 0.5, "reviews-hotel-b")
    expect(calculateQuoteLine(smallHotel).amount).toBe(5)
    expect(calculateQuoteLine(largerHotel).amount).toBe(12)
    expect(calculateQuoteTotal([smallHotel, largerHotel])).toBe(17)
  })
})

describe("quote ecosystem offers", () => {
  it("freezes an unselected offer with the customer advantage", () => {
    const offer = markEcosystemOffer(baseLine(), 10)
    expect(isEcosystemOffer(offer)).toBe(true)
    expect(isEcosystemOfferSelected(offer)).toBe(false)
    expect(offer.default_selected).toBe(false)
    expect(offer.customer_selected).toBe(false)
    expect(offer.discount).toMatchObject({ type: "percentage", value: 10, reason: "Vantaggio cliente 4BID" })
    expect(calculateQuoteLine(offer).amount).toBe(9)
  })

  it("keeps the customer advantage when switching to annual billing", () => {
    const offer = markEcosystemOffer(baseLine(), 10)
    const yearly = applyBillingPreference(offer, "yearly")
    expect(yearly.billing_period).toBe("yearly")
    expect(yearly.amount).toBe(90)
  })

  it("selects and deselects only the prepared ecosystem offer", () => {
    const offer = markEcosystemOffer(baseLine(), 0)
    const selected = selectEcosystemOffer(offer, true)
    expect(isEcosystemOfferSelected(selected)).toBe(true)
    expect(selected.customer_selected).toBeUndefined()
    const removed = selectEcosystemOffer(selected, false)
    expect(isEcosystemOfferSelected(removed)).toBe(false)
    expect(removed.customer_selected).toBe(false)
  })
})

describe("multi-property quote lines", () => {
  it("stores hotel identity and rooms without trusting a group-wide minimum", () => {
    const line = withPropertyPricing({
      id: "reviews-hotel-a",
      kind: "module",
      project: "santaddeo",
      name: "Recensioni · Hotel A",
      description: "Recensioni",
      quantity: 1,
      unit_amount: 0.5,
      amount: 0,
      billing_period: "monthly",
      configuration: { pricing_model: "per_accommodation_minimum", minimum_monthly: 5, unit_price: 0.5 },
    }, {
      family: "reviews",
      propertyId: "hotel-a",
      propertyName: "Hotel A",
      accommodations: 6,
    })

    expect(line.quantity).toBe(6)
    expect(line.amount).toBe(5)
    expect(getPropertyPricing(line)).toEqual({
      managed_by: "multi_property",
      family: "reviews",
      property_id: "hotel-a",
      property_name: "Hotel A",
      accommodations: 6,
    })
  })
})
