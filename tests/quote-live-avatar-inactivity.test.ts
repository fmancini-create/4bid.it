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

test("closing the hosted conversation unloads the embedded room", () => {
  const component = read("app/preventivo/[token]/voce/live-sales-avatar.tsx")
  assert.match(component, /const closeCall = \(\) => \{/)
  assert.match(component, /setSession\(null\)/)
  assert.match(component, /setStatus\("ended"\)/)
  assert.doesNotMatch(component, /activeCall\.leave\(\)/)
  assert.doesNotMatch(component, /activeCall\.destroy\(\)/)
})

test("hosted conversation keeps the authenticated Tavus join URL", () => {
  const component = read("app/preventivo/[token]/voce/live-sales-avatar.tsx")
  assert.match(component, /joinUrl:\s*string/)
  assert.match(component, /setSession\(\{/)
  assert.match(component, /joinUrl,/)
  assert.match(component, /src=\{session\.joinUrl\}/)
})
