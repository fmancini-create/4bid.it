"use client"

import { useEffect, useMemo, useState } from "react"
import { ChevronDown, ChevronRight, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import ComparisonTableEditor from "./comparison-table-editor"
import {
  COMPARISON_PRODUCT_LABELS,
  masterToQuoteTable,
  normalizeMasterTable,
  normalizeQuoteTables,
  type ComparisonProduct,
  type ProductComparisonTable,
  type QuoteComparisonTable,
} from "@/lib/quotes/comparison"

interface Props {
  /** Prodotti presenti nelle voci del preventivo: solo questi hanno una tabella. */
  productsInQuote: ComparisonProduct[]
  /** Snapshot attuale salvato sul preventivo. */
  value: QuoteComparisonTable[]
  onChange: (next: QuoteComparisonTable[]) => void
}

/**
 * Sezione dell'editor preventivo: per ogni prodotto presente tra le voci mostra
 * un interruttore (attiva/disattiva la tabella nel preventivo) e, se attiva, un
 * editor inline della tabella (partendo dalla master). Lo snapshot risultante
 * viaggia in `comparison_tables` del preventivo.
 */
export default function QuoteComparisonSection({ productsInQuote, value, onChange }: Props) {
  const [masters, setMasters] = useState<Record<string, ProductComparisonTable>>({})
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState<Record<string, boolean>>({})

  useEffect(() => {
    let active = true
    fetch("/api/admin/comparison-tables", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { tables: [] }))
      .then((d) => {
        if (!active) return
        const map: Record<string, ProductComparisonTable> = {}
        for (const t of d.tables || []) {
          const m = normalizeMasterTable(t.product, t)
          map[m.product] = m
        }
        setMasters(map)
      })
      .catch(() => {})
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [])

  const byProduct = useMemo(() => {
    const map = new Map<ComparisonProduct, QuoteComparisonTable>()
    for (const t of normalizeQuoteTables(value)) map.set(t.product, t)
    return map
  }, [value])

  const setTable = (product: ComparisonProduct, next: QuoteComparisonTable | null) => {
    const others = normalizeQuoteTables(value).filter((t) => t.product !== product)
    onChange(next ? [...others, next] : others)
  }

  const toggle = (product: ComparisonProduct, enabled: boolean) => {
    const existing = byProduct.get(product)
    if (existing) {
      setTable(product, { ...existing, enabled })
      return
    }
    // Prima attivazione: semina dalla master (se manca, tabella vuota).
    const master = masters[product]
    const seed = master
      ? masterToQuoteTable(master, enabled)
      : { product, title: "", headers: [], rows: [], footer_note: "", enabled }
    setTable(product, seed)
    if (enabled) setOpen((o) => ({ ...o, [product]: true }))
  }

  const resetToMaster = (product: ComparisonProduct) => {
    const master = masters[product]
    if (!master) return
    setTable(product, masterToQuoteTable(master, true))
  }

  if (productsInQuote.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Nessuno dei prodotti con tabella comparativa (Santaddeo, ManuBot, HotelProfitAI, HotelAccelerator) è tra le voci
        del preventivo. Aggiungi un prodotto per poter includere la sua tabella.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      {productsInQuote.map((product) => {
        const current = byProduct.get(product)
        const enabled = current?.enabled === true
        const isOpen = open[product] ?? false
        const hasMaster = !!masters[product]
        return (
          <div key={product} className="rounded-lg border">
            <div className="flex items-center justify-between gap-3 p-4">
              <div className="flex items-center gap-3 min-w-0">
                <Switch
                  id={`cmp-${product}`}
                  checked={enabled}
                  onCheckedChange={(v) => toggle(product, v)}
                  disabled={loading}
                />
                <Label htmlFor={`cmp-${product}`} className="font-medium">
                  {COMPARISON_PRODUCT_LABELS[product]}
                </Label>
                {enabled ? (
                  <Badge variant="secondary" className="shrink-0">
                    Nel preventivo
                  </Badge>
                ) : (
                  <span className="text-xs text-muted-foreground">Non mostrata</span>
                )}
              </div>
              {enabled && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setOpen((o) => ({ ...o, [product]: !isOpen }))}
                >
                  {isOpen ? <ChevronDown className="h-4 w-4 mr-1" /> : <ChevronRight className="h-4 w-4 mr-1" />}
                  {isOpen ? "Chiudi" : "Personalizza"}
                </Button>
              )}
            </div>

            {enabled && isOpen && current && (
              <div className="border-t p-4 space-y-4 bg-muted/20">
                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => resetToMaster(product)}
                    disabled={!hasMaster}
                    title="Ripristina dal modello master"
                  >
                    <RotateCcw className="h-4 w-4 mr-1" /> Ripristina dal modello
                  </Button>
                </div>
                <ComparisonTableEditor
                  value={{
                    title: current.title,
                    headers: current.headers,
                    rows: current.rows,
                    footer_note: current.footer_note,
                  }}
                  onChange={(next) => setTable(product, { product, enabled: true, ...next })}
                />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
