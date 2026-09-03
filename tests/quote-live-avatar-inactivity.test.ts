import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import test from "node:test"

const root = process.cwd()

function read(relativePath: string) {
  return fs.readFileSync(path.join(root, relativePath), "utf8")
}

test("Tavus session ends immediately after the embedded participant leaves", () => {
  const route = read("app/api/quotes/shared/[token]/live-avatar/route.ts")
  assert.match(route, /participant_left_timeout:\s*0/)
})

test("manual and automatic closure leave and destroy the Daily room", () => {
  const component = read("app/preventivo/[token]/voce/live-sales-avatar.tsx")
  assert.match(component, /const finishCall = async \(\) => \{/)
  assert.match(component, /const leaveCall = async \(\) => \{/)
  assert.match(component, /activeCall\.leave\(\)/)
  assert.match(component, /activeCall\.destroy\(\)/)
  assert.match(component, /setStatus\("ended"\)/)
})

test("authenticated Tavus room joins with conversation URL and meeting token", () => {
  const component = read("app/preventivo/[token]/voce/live-sales-avatar.tsx")
  assert.match(component, /conversationUrl:\s*string/)
  assert.match(component, /meetingToken\?:\s*string \| null/)
  assert.match(component, /url: session\.conversationUrl/)
  assert.match(component, /session\.meetingToken \? \{ token: session\.meetingToken \} : \{\}/)
})

test("silence does not immediately terminate the conversation", () => {
  const component = read("app/preventivo/[token]/voce/live-sales-avatar.tsx")
  assert.match(component, /FIRST_REPROMPT_TIMEOUT_MS/)
  assert.match(component, /SECOND_REPROMPT_TIMEOUT_MS/)
  assert.match(component, /FINAL_SILENCE_TIMEOUT_MS/)
  assert.match(component, /promptForRepeat/)
  assert.match(component, /silenceRepromptCount >= 2/)
})
