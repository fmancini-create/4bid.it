import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import test from "node:test"

const source = fs.readFileSync(path.join(process.cwd(), "app/preventivo/[token]/voce/live-sales-avatar.tsx"), "utf8")

test("live quote keeps the original transparent 4BID logo in the bottom-right corner", () => {
  assert.match(source, /import Image from "next\/image"/)
  assert.match(source, /src="\/logo\.png"/)
  assert.match(source, /absolute bottom-5 right-4/)
  assert.doesNotMatch(source, />4BID<\/div>/)
  assert.doesNotMatch(source, /bg-white\/90/)
  assert.doesNotMatch(source, /BrandStrip/)
  assert.doesNotMatch(source, /hotel-accelerator-logo/)
  assert.doesNotMatch(source, /hotelprofit-ai-logo/)
  assert.doesNotMatch(source, /manubot-logo/)
  assert.doesNotMatch(source, /santaddeo-logo/)
})
