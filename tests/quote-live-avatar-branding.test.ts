import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import test from "node:test"

const source = fs.readFileSync(path.join(process.cwd(), "app/preventivo/[token]/voce/live-sales-avatar.tsx"), "utf8")

test("live quote keeps branding to one compact 4BID corner logo", () => {
  assert.match(source, /src="\/logo\.png"/)
  assert.match(source, /absolute left-3 top-3/)
  assert.doesNotMatch(source, /BrandStrip/)
  assert.doesNotMatch(source, /hotel-accelerator-logo/)
  assert.doesNotMatch(source, /hotelprofit-ai-logo/)
  assert.doesNotMatch(source, /manubot-logo/)
  assert.doesNotMatch(source, /santaddeo-logo/)
})
