import { createAdminClient } from "@/lib/supabase/server-admin"
import type { QuoteLineItem, QuoteProject, SalesChannelQuote } from "./types"

const SAAS_PROJECTS = ["hotelaccelerator", "santaddeo", "hotelprofitai", "manubot"] as const
type SaasProject = (typeof SAAS_PROJECTS)[number]

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
  const { data: jobs, error } = await supabase
    .from("sales_channel_quote_provisioning_jobs")
    .select("*")
    .eq("quote_id", quoteId)
    .in("status", ["pending", "failed"])
  if (error) throw error

  for (const job of jobs ?? []) {
    const project = job.project as SaasProject
    const endpoint = process.env[envName(project, "PROVISIONING_URL")]
    const secret = process.env[envName(project, "PROVISIONING_TOKEN")]

    if (!endpoint) {
      await supabase.from("sales_channel_quote_provisioning_jobs").update({
        status: "manual_action",
        last_error: `Connettore ${project} non configurato`,
        updated_at: new Date().toISOString(),
      }).eq("id", job.id)
      continue
    }

    await supabase.from("sales_channel_quote_provisioning_jobs").update({
      status: "processing",
      attempts: Number(job.attempts ?? 0) + 1,
      updated_at: new Date().toISOString(),
    }).eq("id", job.id)

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": job.idempotency_key,
          ...(secret ? { Authorization: `Bearer ${secret}` } : {}),
        },
        body: JSON.stringify(job.payload),
      })
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
        last_error: cause?.message ?? "Provisioning fallito",
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
