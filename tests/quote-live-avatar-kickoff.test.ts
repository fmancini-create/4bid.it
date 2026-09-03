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

test("remote Tavus voice is routed through the native audio element", () => {
  const component = read("app/preventivo/[token]/voce/live-sales-avatar.tsx")
  assert.match(component, /remoteAudioRef/)
  assert.match(component, /audio\.srcObject = new MediaStream\(\[track\]\)/)
  assert.match(component, /audio\.muted = false/)
  assert.match(component, /audio\.volume = 1/)
  assert.match(component, /await audio\.play\(\)/)
  assert.doesNotMatch(component, /createMediaStreamSource/)
})

test("live avatar explicitly republishes the microphone after joining", () => {
  const component = read("app/preventivo/[token]/voce/live-sales-avatar.tsx")
  assert.match(component, /navigator\.mediaDevices\.getUserMedia\(\{ audio: true, video: false \}\)/)
  assert.match(component, /call\.setLocalAudio\(true\)/)
  assert.match(component, /ensureMicrophonePublished\(\)/)
})

test("live avatar has a one-shot spoken greeting fallback", () => {
  const component = read("app/preventivo/[token]/voce/live-sales-avatar.tsx")
  assert.match(component, /const GREETING_FALLBACK_MS = 3_500/)
  assert.match(component, /!palHasSpoken/)
  assert.match(component, /sendEcho\(session\.openingMessage\)/)
})

test("live call shows only a transparent-style 4BID corner mark", () => {
  const component = read("app/preventivo/[token]/voce/live-sales-avatar.tsx")
  assert.match(component, /absolute left-4 top-4/)
  assert.match(component, /src="\/logo\.png"/)
  assert.doesNotMatch(component, /bg-white\/90/)
  assert.doesNotMatch(component, /BrandStrip/)
  assert.doesNotMatch(component, /HotelAccelerator/)
  assert.doesNotMatch(component, /HotelProfit AI/)
})

test("quote CTA is benefit-led instead of generic", () => {
  const component = read("app/preventivo/[token]/voce/live-sales-avatar.tsx")
  assert.match(component, /Ti spiego questo preventivo in 60 secondi/)
  assert.match(component, /Fatti spiegare il preventivo in 60 secondi/)
  assert.match(component, /Consulente AI disponibile ora/)
})
