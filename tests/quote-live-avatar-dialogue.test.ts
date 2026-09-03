import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import test from "node:test"

const root = process.cwd()
const route = fs.readFileSync(path.join(root, "app/api/quotes/shared/[token]/live-avatar/route.ts"), "utf8")
const client = fs.readFileSync(path.join(root, "app/preventivo/[token]/voce/live-sales-avatar.tsx"), "utf8")

test("live advisor verifies identity before discussing a quote addressed to someone else", () => {
  assert.match(route, /Prima di iniziare, mi dice come posso chiamarla\?/)
  assert.match(route, /CONTROLLO IDENTITA' E RUOLO/)
  assert.match(route, /Se il primo nome dichiarato coincide/i)
  assert.match(route, /quale ruolo ricopre/i)
})

test("quote description is introduced as the creator's personal message", () => {
  assert.match(route, /MESSAGGIO DI CHI HA CREATO IL PREVENTIVO/)
  assert.match(route, /context\.description/)
  assert.match(route, /ha preparato questa proposta/)
})

test("unclear speech asks the customer to repeat instead of guessing", () => {
  assert.match(route, /INPUT NON COMPRESO/)
  assert.match(route, /NON inventare e NON restare in silenzio/)
  assert.match(route, /non ho capito bene/i)
})

test("silence reprompts twice before the inactivity goodbye", () => {
  assert.match(client, /FIRST_REPROMPT_TIMEOUT_MS = 7_000/)
  assert.match(client, /SECOND_REPROMPT_TIMEOUT_MS = 10_000/)
  assert.match(client, /RESPONSE_REPROMPT_TIMEOUT_MS = 6_000/)
  assert.match(client, /FINAL_SILENCE_TIMEOUT_MS = 15_000/)
  assert.match(client, /Mi scusi, forse non ho sentito bene\. Può ripetermelo\?/)
  assert.match(client, /Mi sente\? Se vuole, può ripetere con calma/)
  assert.match(client, /let silenceRepromptCount = 0/)
  assert.match(client, /promptForRepeat/)
  assert.match(client, /armInactivityTimer\(RESPONSE_REPROMPT_TIMEOUT_MS\)/)
  assert.match(client, /conversation\.echo/)
  assert.match(client, /arrivederci e buona giornata/i)
})

test("spoken final farewell closes the Daily Tavus room", () => {
  assert.match(client, /conversation\.utterance/)
  assert.match(client, /activeCall\.leave\(\)/)
  assert.match(client, /activeCall\.destroy\(\)/)
  assert.match(client, /closeAfterReplicaStops/)
})

test("final farewell closes even when the utterance event arrives after stopped_speaking", () => {
  assert.match(client, /let replicaSpeaking = false/)
  assert.match(client, /replicaSpeaking = true/)
  assert.match(client, /replicaSpeaking = false/)
  assert.match(client, /if \(!replicaSpeaking\) \{\s*void finishCall\(\)/)
})
