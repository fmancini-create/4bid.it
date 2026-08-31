import { describe, expect, it } from "vitest"
import { applyBillingPreference, setCommercialMeta } from "./commercial"
import {
  getPropertyPricing,
  isEcosystemOffer,
  isEcosystemOfferSelected,
  markEcosystemOffer,
  selectEcosystemOffer,
  withPropertyPricing,
} from "./ecosystem"
import { calculateQuoteLine, type QuoteLineItem } from "./types"

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
