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
  assert.match(route, /joinUrl,/)
})

test("live quote auto-joins Tavus through Daily Prebuilt", () => {
  const component = read("app/preventivo/[token]/voce/live-sales-avatar.tsx")
  assert.match(component, /const DAILY_SDK_URL = "https:\/\/unpkg\.com\/@daily-co\/daily-js@0\.92\.2"/)
  assert.match(component, /window\.Daily\.createFrame\(frameContainerRef\.current/)
  assert.match(component, /await call\.join\(\{ url: session\.joinUrl \}\)/)
  assert.match(component, /showLeaveButton:\s*false/)
  assert.doesNotMatch(component, /src=\{session\.joinUrl\}/)
  assert.doesNotMatch(component, /createCallObject/)
  assert.doesNotMatch(component, /remoteAudioRef/)
})

test("live quote requests microphone permission before starting the provider session", () => {
  const component = read("app/preventivo/[token]/voce/live-sales-avatar.tsx")
  assert.match(component, /navigator\.mediaDevices\.getUserMedia\(\{ audio: true, video: false \}\)/)
  assert.match(component, /permissionStream\.getTracks\(\)\.forEach/)
})

test("live call keeps one compact 4BID corner mark without a white panel", () => {
  const component = read("app/preventivo/[token]/voce/live-sales-avatar.tsx")
  assert.match(component, /absolute left-4 top-4/)
  assert.match(component, /src="\/logo\.png"/)
  assert.doesNotMatch(component, /bg-white\/90/)
  assert.doesNotMatch(component, /BrandStrip/)
  assert.doesNotMatch(component, /HotelAccelerator/)
  assert.doesNotMatch(component, /HotelProfit AI/)
})

test("quote CTA is benefit-led and promises direct connection", () => {
  const component = read("app/preventivo/[token]/voce/live-sales-avatar.tsx")
  assert.match(component, /Ti spiego questo preventivo in 60 secondi/)
  assert.match(component, /Fatti spiegare il preventivo in 60 secondi/)
  assert.match(component, /Nessuna schermata Join/)
  assert.match(component, /Consulente AI live/)
})
