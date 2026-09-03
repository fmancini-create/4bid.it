import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import test from "node:test"

const root = process.cwd()
const client = fs.readFileSync(path.join(root, "app/preventivo/[token]/voce/live-sales-avatar.tsx"), "utf8")
const route = fs.readFileSync(path.join(root, "app/api/quotes/shared/[token]/live-avatar/route.ts"), "utf8")

test("live advisor never treats first silence as an immediate hangup", () => {
  assert.match(client, /const FIRST_REPROMPT_TIMEOUT_MS = 7_000/)
  assert.match(client, /const SECOND_REPROMPT_TIMEOUT_MS = 10_000/)
  assert.match(client, /const FINAL_SILENCE_TIMEOUT_MS = 15_000/)
  assert.match(client, /const action = silenceRepromptCount >= 2 \? sayGoodbyeAndClose : promptForRepeat/)
})

test("live advisor explicitly asks for a repeat when speech is unclear", () => {
  assert.match(client, /Mi scusi, forse non ho sentito bene\. Può ripetermelo\?/)
  assert.match(route, /INPUT NON COMPRESO/)
  assert.match(route, /NON inventare e NON restare in silenzio/)
})

test("a detected user turn resets reprompt escalation", () => {
  assert.match(client, /if \(role === "user"\) \{\s*silenceRepromptCount = 0/)
  assert.match(client, /if \(speaking\.role === "user"\) silenceRepromptCount = 0/)
  assert.match(client, /armInactivityTimer\(RESPONSE_REPROMPT_TIMEOUT_MS\)/)
})
