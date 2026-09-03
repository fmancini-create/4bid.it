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

test("remote Tavus voice is routed directly through the native audio element", () => {
  const component = read("app/preventivo/[token]/voce/live-sales-avatar.tsx")
  assert.match(component, /remoteAudioRef/)
  assert.match(component, /audio\.srcObject = new MediaStream\(\[track\]\)/)
  assert.match(component, /audio\.muted = false/)
  assert.match(component, /audio\.volume = 1/)
  assert.match(component, /await audio\.play\(\)/)
  assert.doesNotMatch(component, /createMediaStreamSource/)
})

test("live call shows only the compact 4BID corner logo", () => {
  const component = read("app/preventivo/[token]/voce/live-sales-avatar.tsx")
  assert.match(component, /absolute left-3 top-3/)
  assert.match(component, /src="\/logo\.png"/)
  assert.doesNotMatch(component, /BrandStrip/)
  assert.doesNotMatch(component, /HotelAccelerator/)
  assert.doesNotMatch(component, /HotelProfit AI/)
})
