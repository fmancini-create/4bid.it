"use client"

import useSWR from "swr"

export interface DemAdminAlert {
  id: string
  kind: "campaign" | "followup"
  title: string
  message: string
  affectedRecipients: number
  href: string
}

export interface DemAlertsResponse {
  alerts: DemAdminAlert[]
  criticalCount: number
  affectedRecipients: number
}

async function fetcher(url: string): Promise<DemAlertsResponse> {
  const response = await fetch(url, { cache: "no-store" })
  if (!response.ok) throw new Error(`Avvisi DEM non disponibili (${response.status})`)
  return response.json()
}

export function useDemAlerts(enabled = true) {
  return useSWR<DemAlertsResponse>(enabled ? "/api/admin/dem-alerts" : null, fetcher, {
    refreshInterval: 60_000,
    revalidateOnFocus: true,
    dedupingInterval: 10_000,
    shouldRetryOnError: false,
  })
}
