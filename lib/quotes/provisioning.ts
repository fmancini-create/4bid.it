import { randomBytes } from "node:crypto"
import { createAdminClient } from "@/lib/supabase/server-admin"
import { isQuoteLineSelected, type QuoteLineItem, type QuoteProject, type SalesChannelQuote } from "./types"
import { getIncludedCredits, getCommercialMeta } from "./commercial"

const SAAS_PROJECTS = ["hotelaccelerator", "santaddeo", "hotelprofitai", "manubot"] as const
type SaasProject = (typeof SAAS_PROJECTS)[number]

const DEFAULT_PROVISIONING_URLS: Record<SaasProject, string> = {
  hotelaccelerator: "https://baldznorrxlctucsfsto.supabase.co/functions/v1/quote-provision",
  santaddeo: "https://aeynirkfixurikshxfov.supabase.co/functions/v1/quote-provision",
  hotelprofitai: "https://jzfwplsgmcgfqnkkhddc.supabase.co/functions/v1/quote-provision",
  manubot: "https://bblgrdukgxkszuayzqjt.supabase.co/functions/v1/quote-provision",
}

function isSaasProject(project?: QuoteProject): project is SaasProject {
  return SAAS_PROJECTS.includes(project as SaasProject)
}

function envName(project: SaasProject, suffix: string) {
  return `${project.toUpperCase()}_${suffix}`
}

function groupItems(items: QuoteLineItem[]) {
  return items.filter(isQuoteLineSelected).reduce<Partial<Record<SaasProject, QuoteLineItem[]>>>((groups, item) => {
    if (!isSaasProject(item.project)) return groups
    groups[item.project] = [...(groups[item.project] ?? []), item]
    return groups
  }, {})
}

function createProvisioningToken() {
  return randomBytes(32).toString("base64url")
}

/**
 * Contratto ESPLICITO dei limiti che il SaaS deve APPLICARE (non solo mostrare).
 * I limiti vivono in `configuration.commercial` della riga (fragile da leggere
 * lato ricevitore): qui li normalizziamo in un blocco `entitlements` cosi' il
 * SaaS legge un contratto stabile invece di scavare nel meta. Oggi valorizzato
 * per Manubot (piano Corporate, limiti riferiti all'INTERO GRUPPO). `null` = il
 * commerciale non ha impostato un tetto -> il SaaS decide la sua policy di
 * default, ma il campo esiste sempre per non dover indovinare.
 */
function buildEntitlements(project: SaasProject, items: QuoteLineItem[]): Record<string, unknown> | undefined {
  if (project !== "manubot") return undefined
  const corporate = items.find((it) => it.kind === "plan" && /corporate/i.test(it.name || ""))
  if (!corporate) return undefined
  const meta = getCommercialMeta(corporate)
  const maxAssets = Number(meta.corporate_max_assets) || 0
  const maxUsers = Number(meta.corporate_max_users) || 0
  return {
    plan: "corporate",
    scope: "group", // i limiti sono complessivi per l'intero gruppo, non per struttura
    structures: Number(corporate.quantity) || 1,
    max_assets: maxAssets > 0 ? maxAssets : null,
    max_users: maxUsers > 0 ? maxUsers : null,
    enforcement: "hard", // il SaaS deve BLOCCARE la creazione oltre il tetto, non solo avvisare
  }
}

export async function enqueueQuoteProvisioning(quote: SalesChannelQuote) {
  const supabase = createAdminClient()
  const grouped = groupItems(quote.line_items ?? [])
  const entries = Object.entries(grouped) as [SaasProject, QuoteLineItem[]][]

  if (entries.length === 0) {
    await supabase.from("sales_channel_quotes").update({ provisioning_status: "not_required" }).eq("id", quote.id)
    return []
  }

  const jobs = entries.map(([project, items]) => ({
    quote_id: quote.id,
    project,
    idempotency_key: `${quote.id}:${project}`,
    provisioning_token: createProvisioningToken(),
    status: "pending",
    payload: {
      quote_id: quote.id,
      quote_number: quote.quote_number,
      customer: {
        name: quote.client_name,
        company: quote.client_company,
        email: quote.client_email,
        vat: quote.client_vat,
        address: quote.client_address,
        billing_details: quote.billing_details,
      },
      payment: {
        stripe_customer_id: quote.stripe_customer_id,
        stripe_subscription_id: quote.stripe_subscription_id,
        stripe_session_id: quote.stripe_session_id,
        currency: quote.currency,
      },
      entitlements: buildEntitlements(project, items),
      items,
    },
  }))

  const { data, error } = await supabase
    .from("sales_channel_quote_provisioning_jobs")
    .upsert(jobs, { onConflict: "idempotency_key", ignoreDuplicates: true })
    .select("*")
  if (error) throw error

  await supabase.from("sales_channel_quotes").update({
    provisioning_status: "pending",
    provisioning_started_at: new Date().toISOString(),
  }).eq("id", quote.id)

  return data ?? []
}

/**
 * Esegue UN job di provisioning: chiama l'endpoint del SaaS con la sua
 * capability e ne registra l'esito sul job. Il ricevitore puo' rispondere
 * `{ status: "manual_action" }` (es. cliente non ancora presente): in quel caso
 * il job NON e' un fallimento ma resta da gestire a mano, quindi va marcato
 * `manual_action` e non `succeeded` — altrimenti un accredito mai avvenuto
 * risulterebbe "verde".
 */
async function runProvisioningJob(
  supabase: ReturnType<typeof createAdminClient>,
  job: any,
): Promise<string> {
  const project = job.project as SaasProject
  const endpoint = process.env[envName(project, "PROVISIONING_URL")] || DEFAULT_PROVISIONING_URLS[project]
  if (!job.provisioning_token) {
    await supabase.from("sales_channel_quote_provisioning_jobs").update({
      status: "failed", last_error: "Capability di provisioning mancante", updated_at: new Date().toISOString(),
    }).eq("id", job.id)
    return "failed"
  }

  await supabase.from("sales_channel_quote_provisioning_jobs").update({
    status: "processing", attempts: Number(job.attempts ?? 0) + 1, updated_at: new Date().toISOString(),
  }).eq("id", job.id)

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 20_000)
    let response: Response
    try {
      response = await fetch(endpoint, {
        method: "POST", signal: controller.signal,
        headers: { "Content-Type": "application/json", "Idempotency-Key": job.idempotency_key, Authorization: `Bearer ${job.provisioning_token}` },
        body: JSON.stringify({ project }),
      })
    } finally { clearTimeout(timeout) }

    const body = await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(body.error ?? `${response.status} ${response.statusText}`)

    const manual = body?.status === "manual_action"
    await supabase.from("sales_channel_quote_provisioning_jobs").update({
      status: manual ? "manual_action" : "succeeded",
      response: body,
      last_error: manual ? (body?.reason ?? "manual_action") : null,
      completed_at: manual ? null : new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq("id", job.id)
    return manual ? "manual_action" : "succeeded"
  } catch (cause: any) {
    await supabase.from("sales_channel_quote_provisioning_jobs").update({
      status: "failed", last_error: cause?.name === "AbortError" ? "Timeout provisioning" : cause?.message ?? "Provisioning fallito", updated_at: new Date().toISOString(),
    }).eq("id", job.id)
    return "failed"
  }
}

export async function processQuoteProvisioning(quoteId: string) {
  const supabase = createAdminClient()
  const { data: jobs, error } = await supabase
    .from("sales_channel_quote_provisioning_jobs")
    .select("*")
    .eq("quote_id", quoteId)
    .in("status", ["pending", "failed"])
  if (error) throw error

  for (const job of jobs ?? []) {
    await runProvisioningJob(supabase, job)
  }

  const { data: allJobs } = await supabase.from("sales_channel_quote_provisioning_jobs").select("status").eq("quote_id", quoteId)
  const statuses = (allJobs ?? []).map(row => row.status)
  const finalStatus = statuses.every(status => status === "succeeded") ? "completed"
    : statuses.some(status => status === "failed") ? "failed"
      : statuses.some(status => status === "manual_action") ? "manual_action"
        : statuses.some(status => status === "succeeded") ? "partial" : "processing"

  await supabase.from("sales_channel_quotes").update({ provisioning_status: finalStatus, provisioned_at: finalStatus === "completed" ? new Date().toISOString() : null }).eq("id", quoteId)
  return finalStatus
}

/**
 * Ri-accredita i crediti INCLUSI ricorrenti ad ogni rinnovo dell'abbonamento.
 * La chiama il webhook Stripe su `invoice.paid` con billing_reason
 * "subscription_cycle" (i rinnovi, non la prima fattura).
 *
 * `cycleId` (l'id della fattura) rende la chiave del job unica per ciclo: ogni
 * rinnovo accredita una sola volta e un retry dello stesso evento non
 * raddoppia. Le voci con crediti "one_time" NON vengono riaccreditate: quelle
 * sono gia' state date all'attivazione. Non tocca `provisioning_status` del
 * preventivo, che riflette l'esito dell'attivazione iniziale.
 */
export async function provisionQuoteRenewal(quote: SalesChannelQuote, cycleId: string) {
  const supabase = createAdminClient()

  const recurringItems = (quote.line_items ?? []).filter(
    (item) => isQuoteLineSelected(item) && isSaasProject(item.project) && getIncludedCredits(item)?.recharge === "recurring",
  )
  if (recurringItems.length === 0) return { status: "not_required" as const, jobs: 0 }

  const grouped = recurringItems.reduce<Partial<Record<SaasProject, QuoteLineItem[]>>>((groups, item) => {
    const project = item.project as SaasProject
    groups[project] = [...(groups[project] ?? []), item]
    return groups
  }, {})
  const entries = Object.entries(grouped) as [SaasProject, QuoteLineItem[]][]

  const jobs = entries.map(([project, items]) => ({
    quote_id: quote.id,
    project,
    idempotency_key: `${quote.id}:${project}:cycle:${cycleId}`,
    provisioning_token: createProvisioningToken(),
    status: "pending",
    payload: {
      quote_id: quote.id,
      quote_number: quote.quote_number,
      cycle: cycleId,
      renewal: true,
      customer: {
        name: quote.client_name,
        company: quote.client_company,
        email: quote.client_email,
        vat: quote.client_vat,
        address: quote.client_address,
        billing_details: quote.billing_details,
      },
      payment: {
        stripe_customer_id: quote.stripe_customer_id,
        stripe_subscription_id: quote.stripe_subscription_id,
        stripe_session_id: quote.stripe_session_id,
        currency: quote.currency,
      },
      entitlements: buildEntitlements(project, items),
      items,
    },
  }))

  // ignoreDuplicates: se questo ciclo era gia' stato registrato, `created` e'
  // vuoto e non si riaccredita.
  const { data: created, error } = await supabase
    .from("sales_channel_quote_provisioning_jobs")
    .upsert(jobs, { onConflict: "idempotency_key", ignoreDuplicates: true })
    .select("*")
  if (error) throw error

  let processed = 0
  for (const job of created ?? []) {
    await runProvisioningJob(supabase, job)
    processed++
  }
  return { status: "processed" as const, jobs: processed }
}
