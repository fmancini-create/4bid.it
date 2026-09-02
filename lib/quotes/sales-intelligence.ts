export type SalesChatMessage = {
  role: string
  content: string
}

export type QuoteSalesContext = {
  quoteId?: string | null
  quoteNumber?: string | null
  recipientEmail?: string | null
  quotedProjects?: string[]
}

type SalesSignal = {
  engagementScore: number
  temperature: "cold" | "warm" | "hot"
  intent: string
  primaryProduct: string | null
  interestedProducts: string[]
  objections: string[]
  positiveSignals: string[]
  nextBestAction: string
  rationale: string
}

const PRODUCT_TERMS: Record<string, string[]> = {
  santaddeo: ["santaddeo", "rms", "revenue", "pricing", "tariffe", "adr", "revpar", "occupazione", "autopilot"],
  hotelprofitai: ["hotelprofit", "hotelprofitai", "controllo di gestione", "ebitda", "margini", "costi", "cash flow", "budget"],
  hotelaccelerator: ["hotelaccelerator", "hotel accelerator", "crm", "omnichannel", "whatsapp", "lead", "prospect", "conversione"],
  manubot: ["manubot", "manutenzione", "manutenzioni", "interventi", "guasti", "asset", "fornitori"],
}

const OBJECTION_TERMS: Array<[string, string[]]> = [
  ["prezzo/costo", ["costa troppo", "troppo caro", "costoso", "prezzo alto", "abbassare il prezzo", "sconto"]],
  ["tempo/decisione", ["ci devo pensare", "devo pensarci", "ne parlo", "piu avanti", "più avanti", "non ora"]],
  ["complessita", ["complicato", "difficile", "troppo complesso", "non ho tempo", "tempo per configurare"]],
  ["software esistente", ["uso gia", "uso già", "abbiamo gia", "abbiamo già", "altro software", "altro rms", "altro crm"]],
  ["integrazione", ["si integra", "integrazione", "compatibile", "pms", "channel manager", "gestionale"]],
  ["utilita/valore", ["non mi serve", "a cosa serve", "perche conviene", "perché conviene", "vantaggio", "beneficio"]],
  ["fiducia/ai", ["non mi fido", "intelligenza artificiale", "ia sbaglia", "ai sbaglia", "automatico"]],
]

const POSITIVE_TERMS: Array<[string, string[]]> = [
  ["richiesta prezzo", ["quanto costa", "prezzo", "mensile", "annuale", "sconto annuale"]],
  ["richiesta avvio", ["come si parte", "come iniziare", "attivare", "attivazione", "setup", "onboarding"]],
  ["richiesta acquisto", ["acquistare", "procedere", "accettare", "firmare", "pagare", "lo voglio", "va bene procediamo"]],
  ["richiesta contatto/demo", ["demo", "chiamatemi", "richiamatemi", "contattatemi", "appuntamento"]],
  ["valutazione concreta", ["cosa e incluso", "cosa è incluso", "confronto", "differenza", "integrazione", "tempi"]],
]

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)))
}

function includesAny(text: string, terms: string[]): boolean {
  return terms.some((term) => text.includes(term))
}

export function analyzeQuoteSalesSignals(messages: SalesChatMessage[], context: QuoteSalesContext): SalesSignal {
  const userMessages = messages.filter((m) => m.role === "user" && m.content?.trim())
  const corpus = userMessages.map((m) => m.content.toLowerCase()).join("\n")
  const last = userMessages.at(-1)?.content?.toLowerCase() || ""

  const interestedProducts = unique([
    ...(context.quotedProjects || []),
    ...Object.entries(PRODUCT_TERMS).filter(([, terms]) => includesAny(corpus, terms)).map(([product]) => product),
  ])
  const objections = OBJECTION_TERMS.filter(([, terms]) => includesAny(corpus, terms)).map(([label]) => label)
  const positiveSignals = POSITIVE_TERMS.filter(([, terms]) => includesAny(corpus, terms)).map(([label]) => label)

  let score = 10
  score += Math.min(userMessages.length * 4, 20)
  score += positiveSignals.length * 10
  score += interestedProducts.length > 1 ? 8 : interestedProducts.length === 1 ? 4 : 0
  if (includesAny(last, ["procedere", "accettare", "firmare", "pagare", "acquistare", "lo voglio"])) score += 25
  if (includesAny(last, ["demo", "chiamatemi", "richiamatemi", "contattatemi", "appuntamento"])) score += 18
  if (includesAny(last, ["quanto costa", "annuale", "mensile", "sconto", "tempi", "attivazione"])) score += 8
  if (objections.includes("tempo/decisione")) score -= 8
  if (includesAny(last, ["non mi interessa", "lasciamo perdere", "non mi serve"])) score -= 20
  score = Math.max(0, Math.min(100, score))

  const temperature: SalesSignal["temperature"] = score >= 70 ? "hot" : score >= 38 ? "warm" : "cold"
  let intent = "esplorazione"
  if (includesAny(last, ["procedere", "accettare", "firmare", "pagare", "acquistare"])) intent = "decisione_acquisto"
  else if (includesAny(last, ["quanto costa", "prezzo", "mensile", "annuale", "sconto"])) intent = "valutazione_economica"
  else if (includesAny(last, ["integrazione", "pms", "channel manager", "setup", "attivazione", "onboarding"])) intent = "fattibilita_implementazione"
  else if (objections.length) intent = "gestione_obiezione"
  else if (includesAny(last, ["differenza", "confronto", "alternativa"])) intent = "confronto"
  else if (includesAny(last, ["cosa fa", "come funziona", "perche", "perché", "vantaggio", "beneficio"])) intent = "comprensione_valore"

  const primaryProduct = interestedProducts.find((product) => includesAny(last, PRODUCT_TERMS[product] || [])) || interestedProducts[0] || null
  let nextBestAction = "Chiarire il problema operativo principale e collegarlo al modulo piu pertinente."
  if (intent === "decisione_acquisto") nextBestAction = "Rimuovere gli ultimi dubbi pratici e accompagnare il cliente al passo concreto di accettazione/attivazione."
  else if (intent === "valutazione_economica") nextBestAction = "Confrontare le formule reali del preventivo e riportare il prezzo al valore operativo per la struttura."
  else if (intent === "fattibilita_implementazione") nextBestAction = "Spiegare integrazione, avvio e supporto usando solo condizioni realmente disponibili nel preventivo o nella knowledge base."
  else if (intent === "gestione_obiezione") nextBestAction = `Isolare e rispondere prima all'obiezione principale: ${objections[0]}.`
  else if (temperature === "hot") nextBestAction = "Proporre una micro-azione concreta verso la chiusura, senza pressione artificiale."

  const rationale = [
    `${userMessages.length} messaggi utente osservati`,
    positiveSignals.length ? `segnali positivi: ${positiveSignals.join(", ")}` : "nessun segnale di acquisto esplicito",
    objections.length ? `obiezioni: ${objections.join(", ")}` : "nessuna obiezione esplicita",
    interestedProducts.length ? `prodotti citati/interessati: ${interestedProducts.join(", ")}` : "nessun prodotto specifico citato",
  ].join("; ")

  return { engagementScore: score, temperature, intent, primaryProduct, interestedProducts, objections, positiveSignals, nextBestAction, rationale }
}

export async function saveQuoteSalesIntelligence(supabase: any, conversationId: string, context: QuoteSalesContext, messages: SalesChatMessage[]): Promise<void> {
  const signal = analyzeQuoteSalesSignals(messages, context)
  const lastUserMessage = [...messages].reverse().find((m) => m.role === "user")?.content || null
  const { error } = await supabase.from("quote_ai_sales_intelligence").upsert({
    conversation_id: conversationId,
    quote_id: context.quoteId || null,
    quote_number: context.quoteNumber || null,
    recipient_email: context.recipientEmail || null,
    engagement_score: signal.engagementScore,
    temperature: signal.temperature,
    intent: signal.intent,
    primary_product: signal.primaryProduct,
    interested_products: signal.interestedProducts,
    objections: signal.objections,
    positive_signals: signal.positiveSignals,
    next_best_action: signal.nextBestAction,
    rationale: signal.rationale,
    last_user_message: lastUserMessage,
    metadata: { scoring_kind: "engagement_readiness", scoring_version: 1, note: "Indicatore euristico basato su segnali espliciti della conversazione; non e una probabilita garantita di chiusura." },
    updated_at: new Date().toISOString(),
  }, { onConflict: "conversation_id" })
  if (error) throw error
}
