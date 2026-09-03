import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import test from "node:test"

const root = process.cwd()
const context = fs.readFileSync(path.join(root, "lib/quotes/chat-context.ts"), "utf8")
const liveRoute = fs.readFileSync(path.join(root, "app/api/quotes/shared/[token]/live-avatar/route.ts"), "utf8")

test("quote context separates recurring monthly, annual and one-time amounts", () => {
  assert.match(context, /RIEPILOGO ECONOMICO CALCOLATO/)
  assert.match(context, /canoni ricorrenti/)
  assert.match(context, /voci una tantum/)
  assert.match(context, /applyBillingPreference\(item, "monthly"\)/)
  assert.match(context, /applyBillingPreference\(item, "yearly"\)/)
  assert.match(context, /NON chiamarlo mai "costo mensile" o "costo annuale"/)
})

test("temporary promotions keep their duration in the sales context", () => {
  assert.match(context, /duration_months/)
  assert.match(context, /Promozioni a durata limitata/)
  assert.match(context, /non far credere che il prezzo promozionale duri indefinitamente/)
})

test("sales avatar cannot invent operational actions or onboarding simplifications", () => {
  assert.match(context, /CAPACITA' OPERATIVE/)
  assert.match(context, /non affermare mai di aver inviato messaggi/)
  assert.match(context, /ONBOARDING: una dashboard multi-struttura/)
  assert.match(context, /non inventare una semplificazione operativa non scritta/)
})

test("live quote session overrides unrelated stock Tavus persona instructions", () => {
  assert.match(liveRoute, /OVERRIDE PERSONA DI SESSIONE/)
  assert.match(liveRoute, /Maya, Stratify, product analytics/)
  assert.match(liveRoute, /obblighi di parlare inglese/)
})
