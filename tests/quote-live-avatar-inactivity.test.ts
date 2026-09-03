import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import test from "node:test"

const root = process.cwd()

function read(relativePath: string) {
  return fs.readFileSync(path.join(root, relativePath), "utf8")
}

test("live quote avatar closes after 15 seconds of conversational inactivity", () => {
  const component = read("app/preventivo/[token]/voce/live-sales-avatar.tsx")

  assert.match(component, /const INACTIVITY_TIMEOUT_MS = 15_000/)
  assert.match(component, /\.on\("app-message", handleAppMessage\)/)
  assert.match(component, /conversation\.started_speaking/)
  assert.match(component, /conversation\.stopped_speaking/)
  assert.match(component, /speaking\.role === "pal" \|\| speaking\.role === "replica"/)
  assert.match(component, /armInactivityTimer\(\)/)
})

test("inactive live quote avatar says goodbye before leaving the Daily room", () => {
  const component = read("app/preventivo/[token]/voce/live-sales-avatar.tsx")

  assert.match(component, /event_type: "conversation\.echo"/)
  assert.match(component, /text: INACTIVITY_GOODBYE/)
  assert.match(component, /void finishInactiveCall\(\)/)
  assert.match(component, /activeCall\.leave\(\)/)
  assert.match(component, /activeCall\.destroy\(\)/)
})

test("Tavus session ends immediately after the participant leaves", () => {
  const route = read("app/api/quotes/shared/[token]/live-avatar/route.ts")

  assert.match(route, /participant_left_timeout:\s*0/)
})

test("starting a new live quote session retains Tavus conversation id for interactions", () => {
  const component = read("app/preventivo/[token]/voce/live-sales-avatar.tsx")

  assert.match(component, /const conversationId = String\(data\?\.conversationId \|\| ""\)/)
  assert.match(component, /conversation_id: session\.conversationId/)
})
