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

test("closing the Daily Prebuilt conversation leaves and destroys the room", () => {
  const component = read("app/preventivo/[token]/voce/live-sales-avatar.tsx")
  assert.match(component, /const closeCall = async \(\) => \{/)
  assert.match(component, /activeCall\.leave\(\)/)
  assert.match(component, /activeCall\.destroy\(\)/)
  assert.match(component, /setSession\(null\)/)
  assert.match(component, /setStatus\("ended"\)/)
})

test("authenticated Tavus join URL is passed directly to Daily Prebuilt join", () => {
  const component = read("app/preventivo/[token]/voce/live-sales-avatar.tsx")
  assert.match(component, /joinUrl:\s*string/)
  assert.match(component, /setSession\(\{/)
  assert.match(component, /joinUrl,/)
  assert.match(component, /await call\.join\(\{ url: session\.joinUrl \}\)/)
})
