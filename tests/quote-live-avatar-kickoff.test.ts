import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import test from "node:test"

const root = process.cwd()

function read(relativePath: string) {
  return fs.readFileSync(path.join(root, relativePath), "utf8")
}

test("live quote API exposes the same opening greeting it sends to Tavus", () => {
  const route = read("app/api/quotes/shared/[token]/live-avatar/route.ts")
  assert.match(route, /const openingMessage = buildGreeting\(\)/)
  assert.match(route, /custom_greeting:\s*openingMessage/)
  assert.match(route, /openingMessage,/)
})

test("custom Daily UI forces the opening greeting if Tavus stays silent", () => {
  const component = read("app/preventivo/[token]/voce/live-sales-avatar.tsx")
  assert.match(component, /sendAppMessage/)
  assert.match(component, /event_type:\s*"conversation\.echo"/)
  assert.match(component, /OPENING_GREETING_FALLBACK_MS/)
  assert.match(component, /conversation\.started_speaking/)
  assert.match(component, /conversation\.replica\.started_speaking/)
})

test("ecosystem strip contains the 4BID mark and explicit HotelAccelerator and HotelProfit labels", () => {
  const component = read("app/preventivo/[token]/voce/live-sales-avatar.tsx")
  assert.match(component, /includeFourBid = true/)
  assert.match(component, /HotelAccelerator/)
  assert.match(component, /HotelProfit AI/)
  assert.match(component, /BrandChip brand=\{FOUR_BID_BRAND\}/)
})
