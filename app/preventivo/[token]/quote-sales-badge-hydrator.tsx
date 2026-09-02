"use client"

import { useEffect } from "react"
import type { QuoteLineItem } from "@/lib/quotes/types"

type QuoteLineWithBadge = QuoteLineItem & { sales_badge?: string | null }

type Props = { items: QuoteLineWithBadge[] }

const badgeClasses: Record<string, string> = {
  "Offerta speciale": "border-rose-200 bg-rose-100 text-rose-800",
  "Offerta lancio": "border-orange-200 bg-orange-100 text-orange-800",
  "Esclusiva 4BID": "border-violet-200 bg-violet-100 text-violet-800",
  "Più scelto": "border-emerald-200 bg-emerald-100 text-emerald-800",
  "Consigliato": "border-sky-200 bg-sky-100 text-sky-800",
  "Best value": "border-teal-200 bg-teal-100 text-teal-800",
  "Solo per te": "border-fuchsia-200 bg-fuchsia-100 text-fuchsia-800",
  "Novità": "border-blue-200 bg-blue-100 text-blue-800",
  "Bonus incluso": "border-amber-200 bg-amber-100 text-amber-800",
  "Disponibilità limitata": "border-red-200 bg-red-100 text-red-800",
  "Partnership": "border-indigo-200 bg-indigo-100 text-indigo-800",
  "Edizione riservata": "border-slate-300 bg-slate-100 text-slate-800",
}

function normalized(value: string | undefined | null) {
  return (value || "").replace(/\s+/g, " ").trim().toLocaleLowerCase("it-IT")
}

/**
 * Applica ai box del preventivo il badge commerciale salvato sulla line_item.
 * Non entra nei calcoli e non modifica la selezione del cliente.
 */
export default function QuoteSalesBadgeHydrator({ items }: Props) {
  useEffect(() => {
    const expected = new Map(
      items
        .map(item => [normalized(item.name || item.description), (item.sales_badge || "").trim()] as const)
        .filter(([key, badge]) => Boolean(key && badge)),
    )

    let scheduled = false
    const applyBadges = () => {
      scheduled = false
      document.querySelectorAll<HTMLElement>("article").forEach(article => {
        const title = article.querySelector<HTMLElement>("h3")
        if (!title) return

        const badgeText = expected.get(normalized(title.textContent))
        const existing = article.querySelector<HTMLElement>("[data-4bid-sales-badge]")

        if (!badgeText) {
          existing?.remove()
          return
        }

        const headerRow = article.querySelector<HTMLElement>(":scope > div:first-child > div")
        if (!headerRow) return

        const className = `mr-auto inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.08em] shadow-sm ${badgeClasses[badgeText] || "border-primary/20 bg-primary/10 text-primary"}`
        const badge = existing || document.createElement("span")
        badge.setAttribute("data-4bid-sales-badge", "true")
        if (badge.textContent !== badgeText) badge.textContent = badgeText
        if (badge.className !== className) badge.className = className
        if (!existing) headerRow.prepend(badge)
      })
    }

    const scheduleApply = () => {
      if (scheduled) return
      scheduled = true
      window.requestAnimationFrame(applyBadges)
    }

    applyBadges()
    const observer = new MutationObserver(scheduleApply)
    observer.observe(document.body, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [items])

  return null
}
