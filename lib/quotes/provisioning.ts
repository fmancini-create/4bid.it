import { createAdminClient } from "@/lib/supabase/server-admin"
import type { QuoteLineItem, QuoteProject, SalesChannelQuote } from "./types"

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
  return items.reduce<Partial<Record<SaasProject, QuoteLineItem[]>>>((groups, item) => {
    if (!isSaasProject(item.project)) return groups
    groups[item.project] = [...(groups[item.project] ?? []), item]
    return groups
  }, {})
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

export async function processQuoteProvisioning(quoteId: string) {
  const supabase = createAdminClient()
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceRole) throw new Error("SUPABASE_SERVICE_ROLE_KEY non configurata")

  const { data: jobs, error } = await supabase
    .from("sales_channel_quote_provisioning_jobs")
    .select("*")
    .eq("quote_id", quoteId)
    .in("status", ["pending", "failed"])
  if (error) throw error

  for (const job of jobs ?? []) {
    const project = job.project as SaasProject
    const endpoint = process.env[envName(project, "PROVISIONING_URL")] || DEFAULT_PROVISIONING_URLS[project]

    await supabase.from("sales_channel_quote_provisioning_jobs").update({
      status: "processing",
      attempts: Number(job.attempts ?? 0) + 1,
      updated_at: new Date().toISOString(),
    }).eq("id", job.id)

    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 20_000)
      let response: Response
      try {
        response = await fetch(endpoint, {
          method: "POST",
          signal: controller.signal,
          headers: {
            "Content-Type": "application/json",
            "Idempotency-Key": job.idempotency_key,
            Authorization: `Bearer ${serviceRole}`,
          },
          body: JSON.stringify(job.payload),
        })
      } finally {
        clearTimeout(timeout)
      }

      const body = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(body.error ?? `${response.status} ${response.statusText}`)

      await supabase.from("sales_channel_quote_provisioning_jobs").update({
        status: "succeeded",
        response: body,
        last_error: null,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }).eq("id", job.id)
    } catch (cause: any) {
      await supabase.from("sales_channel_quote_provisioning_jobs").update({
        status: "failed",
        last_error: cause?.name === "AbortError" ? "Timeout provisioning" : cause?.message ?? "Provisioning fallito",
        updated_at: new Date().toISOString(),
      }).eq("id", job.id)
    }
  }

  const { data: allJobs } = await supabase
    .from("sales_channel_quote_provisioning_jobs")
    .select("status")
    .eq("quote_id", quoteId)

  const statuses = (allJobs ?? []).map(row => row.status)
  const finalStatus = statuses.every(status => status === "succeeded")
    ? "completed"
    : statuses.some(status => status === "failed")
      ? "failed"
      : statuses.some(status => status === "manual_action")
        ? "manual_action"
        : statuses.some(status => status === "succeeded")
          ? "partial"
          : "processing"

  await supabase.from("sales_channel_quotes").update({
    provisioning_status: finalStatus,
    provisioned_at: finalStatus === "completed" ? new Date().toISOString() : null,
  }).eq("id", quoteId)

  return finalStatus
}
