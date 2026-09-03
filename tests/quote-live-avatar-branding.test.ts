import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import test from "node:test"

const source = fs.readFileSync(path.join(process.cwd(), "app/preventivo/[token]/voce/live-sales-avatar.tsx"), "utf8")

test("4BID ecosystem strip exposes readable brand labels", () => {
  assert.match(source, /name: "4BID"/)
  assert.match(source, /name: "HotelAccelerator"/)
  assert.match(source, /name: "HotelProfit AI"/)
  assert.match(source, /name: "ManuBot"/)
  assert.match(source, /includeFourBid = true/)
})
