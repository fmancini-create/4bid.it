"use client"

import { useEffect, useMemo, useState } from "react"
import { createPortal } from "react-dom"
import { CheckCircle2, CircleDollarSign, Info, Sparkles } from "lucide-react"
import {
  calculateQuoteLine,
  formatQuoteAmount,
  type QuoteLineItem,
} from "@/lib/quotes/types"
import {
  annualSetupPromo,
  applyBillingPreference,
  type QuoteBillingPreference,
} from "@/lib/quotes/commercial"
import { resolveDependentParent } from "@/lib/quotes/dependent-lines"

type Props = {
  items: QuoteLineItem[]
  currency: string
  accepted: boolean
}

type SelectionMap = Record<string, boolean>

function initialSelected(item: QuoteLineItem, accepted: boolean) {
  if (!item.optional) return true
  if (accepted) return item.customer_selected !== false
  return item.default_selected !== false
}

function itemKey(item: QuoteLineItem, index: number) {
  return item.id || item.source_product_id || `${item.name || "voce"}-${index}`
}

function chosenFormula(items: QuoteLineItem[]): QuoteBillingPreference {
  return items.some(item => item.billing_period === "yearly")
    && !items.some(item => item.billing_period === "monthly")
    ? "yearly"
    : "monthly"
}

function currentUiSelection(item: QuoteLineItem, fallback: boolean) {
  if (!item.optional || typeof document === "undefined") return fallback
  const name = (item.name || item.description || "").trim()
  if (!name) return fallback
  const cards = Array.from(document.querySelectorAll<HTMLElement>("article"))
  const card = cards.find(article => {
    const heading = article.querySelector("h3")?.textContent?.trim()
    return heading === name
  })
  if (!card) return fallback
  const action = Array.from(card.querySelectorAll<HTMLButtonElement>("button")).find(button => {
    const text = button.textContent || ""
    return /Scelto|Scegli questa opzione|Aggiungi alla mia soluzione/.test(text)
  })
  if (!action) return fallback
  return /Scelto/.test(action.textContent || "")
}

function currentUiFormula(fallback: QuoteBillingPreference): QuoteBillingPreference {
  if (typeof document === "undefined") return fallback
  const pressed = Array.from(document.querySelectorAll<HTMLButtonElement>('button[aria-pressed="true"]'))
    .find(button => /^(Mensile|Annuale)/.test((button.textContent || "").trim()))
  if (!pressed) return fallback
  return /^Annuale/.test((pressed.textContent || "").trim()) ? "yearly" : "monthly"
}

export default function QuoteOneTimeInvestmentDetails({ items, currency, accepted }: Props) {
  const initialFormula = useMemo(() => chosenFormula(items), [items])
  const [target, setTarget] = useState<HTMLElement | null>(null)
  const [formula, setFormula] = useState<QuoteBillingPreference>(initialFormula)
  const [selected, setSelected] = useState<SelectionMap>(() => {
    const map: SelectionMap = {}
    items.forEach((item, index) => { map[itemKey(item, index)] = initialSelected(item, accepted) })
    return map
  })

  useEffect(() => {
    const findTarget = () => {
      const heading = Array.from(document.querySelectorAll<HTMLHeadingElement>("h2"))
        .find(node => node.textContent?.trim() === "Il tuo investimento")
      setTarget(heading?.closest("section") as HTMLElement | null)
    }

    const syncUiState = () => {
      setFormula(previous => currentUiFormula(previous))
      setSelected(previous => {
        let changed = false
        const next = { ...previous }
        items.forEach((item, index) => {
          const key = itemKey(item, index)
          const value = currentUiSelection(item, previous[key] ?? initialSelected(item, accepted))
          if (next[key] !== value) { next[key] = value; changed = true }
        })
        return changed ? next : previous
      })
    }

    findTarget()
    syncUiState()
    const onClick = () => window.setTimeout(() => {
      findTarget()
      syncUiState()
    }, 0)
    document.addEventListener("click", onClick, true)
    return () => document.removeEventListener("click", onClick, true)
  }, [items, accepted])

  const groups = useMemo(() => {
    const rows = items
      .map((item, index) => ({ item, index, parent: item.billing_period === "one_time" ? resolveDependentParent(item, items) : null }))
      .filter(row => row.item.billing_period === "one_time")
      .filter(row => {
        if (!row.parent) return true
        const parentIndex = items.indexOf(row.parent)
        const parentKey = itemKey(row.parent, parentIndex >= 0 ? parentIndex : 0)
        return selected[parentKey] ?? initialSelected(row.parent, accepted)
      })

    const map = new Map<string, { parent: QuoteLineItem | null; rows: typeof rows }>()
    for (const row of rows) {
      const key = row.parent?.id || "__standalone__"
      const group = map.get(key) || { parent: row.parent, rows: [] }
      group.rows.push(row)
      map.set(key, group)
    }
    return Array.from(map.values())
  }, [items, selected, accepted])

  const selectedOneTimeTotal = useMemo(() => groups.reduce((total, group) =>
    total + group.rows.reduce((sum, row) => {
      const key = itemKey(row.item, row.index)
      if (!(selected[key] ?? initialSelected(row.item, accepted))) return sum
      return sum + Number(applyBillingPreference(calculateQuoteLine(row.item), formula).amount || 0)
    }, 0), 0), [groups, selected, accepted, formula])

  if (!target || !groups.length) return null

  return createPortal(
    <div className="mt-5 border-t border-border pt-5" data-quote-one-time-investment-details>
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <CircleDollarSign className="h-5 w-5 text-primary" aria-hidden="true" />
            <h3 className="font-bold">Una tantum collegate ai canoni</h3>
          </div>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-muted-foreground">
            Qui vedi setup e servizi di configurazione collegati ai moduli scelti. Le voci opzionali non entrano nel totale finché non le selezioni sopra.
          </p>
        </div>
        <div className="rounded-xl border bg-muted/30 px-3 py-2 sm:text-right">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Una tantum selezionate</p>
          <p className="text-lg font-black">{formatQuoteAmount(selectedOneTimeTotal, currency)}</p>
        </div>
      </div>

      {selectedOneTimeTotal <= 0.005 ? (
        <div className="mb-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span><strong>Nessuna una tantum è selezionata.</strong> Per questo il totale del primo anno che vedi sopra comprende in questo momento soltanto i canoni.</span>
        </div>
      ) : null}

      <div className="grid gap-3 md:grid-cols-2">
        {groups.map((group, groupIndex) => {
          const parent = group.parent
          const parentEffective = parent ? applyBillingPreference(calculateQuoteLine(parent), formula) : null
          const parentPeriod = parentEffective?.billing_period === "yearly" ? "/anno" : "/mese"
          return (
            <div key={parent?.id || `standalone-${groupIndex}`} className="overflow-hidden rounded-xl border bg-card">
              <div className="border-b bg-muted/30 px-3 py-2.5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{parent ? "Collegata a" : "Voce autonoma"}</p>
                    <p className="text-sm font-bold">{parent?.name || "Altre una tantum"}</p>
                  </div>
                  {parentEffective ? <p className="shrink-0 text-xs font-semibold">{formatQuoteAmount(Number(parentEffective.amount || 0), currency)} {parentPeriod}</p> : null}
                </div>
              </div>
              <div className="divide-y">
                {group.rows.map(({ item, index }) => {
                  const key = itemKey(item, index)
                  const isSelected = selected[key] ?? initialSelected(item, accepted)
                  const effective = applyBillingPreference(calculateQuoteLine(item), formula)
                  const promo = annualSetupPromo(item)
                  return (
                    <div key={key} className={`px-3 py-3 ${isSelected ? "bg-emerald-50/50" : ""}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <p className="text-sm font-semibold">{item.name || item.description}</p>
                            <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${isSelected ? "bg-emerald-100 text-emerald-800" : "bg-muted text-muted-foreground"}`}>
                              {isSelected ? "Selezionata" : "Opzionale"}
                            </span>
                          </div>
                          {promo ? (
                            <p className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                              <Sparkles className="h-3 w-3" aria-hidden="true" />
                              {promo.mode === "free"
                                ? `Con l'annuale: OMAGGIO (invece di ${formatQuoteAmount(promo.normalPrice, currency)})`
                                : `Con l'annuale: ${formatQuoteAmount(promo.annualPrice, currency)} (-${promo.pct}%)`}
                            </p>
                          ) : <p className="mt-1 text-[11px] text-muted-foreground">Addebito una sola volta, senza rinnovo.</p>}
                        </div>
                        <div className="shrink-0 text-right">
                          <p className={`text-sm font-black ${formula === "yearly" && promo ? "text-emerald-700" : ""}`}>
                            {formula === "yearly" && promo?.mode === "free" ? "OMAGGIO" : formatQuoteAmount(Number(effective.amount || 0), currency)}
                          </p>
                          <p className="text-[10px] text-muted-foreground">una tantum</p>
                        </div>
                      </div>
                      {isSelected ? <p className="mt-1.5 flex items-center gap-1 text-[10px] font-semibold text-emerald-700"><CheckCircle2 className="h-3 w-3" aria-hidden="true" />Inclusa nel totale del primo anno</p> : null}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>,
    target,
  )
}
