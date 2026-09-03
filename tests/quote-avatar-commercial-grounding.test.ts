import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import test from "node:test"

const source = fs.readFileSync(path.join(process.cwd(), "lib/quotes/chat-context.ts"), "utf8")

test("quote context separates recurring monthly, annual and one-time amounts", () => {
  assert.match(source, /RIEPILOGO ECONOMICO CALCOLATO/)
  assert.match(source, /canoni ricorrenti/)
  assert.match(source, /voci una tantum/)
  assert.match(source, /applyBillingPreference\(item, "monthly"\)/)
  assert.match(source, /applyBillingPreference\(item, "yearly"\)/)
  assert.match(source, /NON chiamarlo mai "costo mensile" o "costo annuale"/)
})

test("temporary promotions keep their duration in the sales context", () => {
  assert.match(source, /duration_months/)
  assert.match(source, /Promozioni a durata limitata/)
  assert.match(source, /non far credere che il prezzo promozionale duri indefinitamente/)
})

test("sales avatar cannot invent operational actions or onboarding simplifications", () => {
  assert.match(source, /CAPACITA' OPERATIVE/)
  assert.match(source, /non affermare mai di aver inviato messaggi/)
  assert.match(source, /ONBOARDING: una dashboard multi-struttura/)
  assert.match(source, /non inventare una semplificazione operativa non scritta/)
})
