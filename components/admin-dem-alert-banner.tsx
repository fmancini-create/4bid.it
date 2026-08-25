"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { AlertTriangle, ArrowRight } from "lucide-react"
import { useDemAlerts } from "@/lib/dem/use-dem-alerts"

export function AdminDemAlertBanner() {
  const pathname = usePathname()
  const isAuthPage = pathname === "/admin/login" || pathname === "/admin/signup"
  const { data } = useDemAlerts(!isAuthPage)

  if (isAuthPage || !data || data.criticalCount === 0) return null

  const first = data.alerts[0]
  const extra = data.criticalCount - 1

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="sticky top-0 z-[70] border-b border-red-800 bg-red-700 px-4 py-3 text-white shadow-lg"
    >
      <div className="mx-auto flex max-w-7xl items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className="font-bold">
            DEM ferma: {data.criticalCount} {data.criticalCount === 1 ? "problema attivo" : "problemi attivi"}
          </p>
          <p className="mt-0.5 text-sm text-red-50">
            {first.title}: {first.message}
            {extra > 0 ? ` Altri ${extra} avvisi richiedono attenzione.` : ""} Destinatari coinvolti: {data.affectedRecipients.toLocaleString("it-IT")}.
          </p>
        </div>
        <Link
          href={first.href}
          className="inline-flex shrink-0 items-center gap-1 rounded-md bg-white px-3 py-1.5 text-sm font-semibold text-red-700 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          Apri DEM
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </div>
  )
}
