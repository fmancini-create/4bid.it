"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Save, RefreshCw, Link2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import ComparisonTableEditor from "@/components/quotes/comparison-table-editor"
import ComparisonTablesPreview from "@/components/quotes/comparison-tables-preview"
import {
  COMPARISON_PRODUCTS,
  COMPARISON_PRODUCT_LABELS,
  masterToQuoteTable,
  type ComparisonProduct,
  type ProductComparisonTable,
} from "@/lib/quotes/comparison"

interface Props {
  initialTables: ProductComparisonTable[]
}

export default function ComparisonTablesManager({ initialTables }: Props) {
  const [tables, setTables] = useState<Record<ComparisonProduct, ProductComparisonTable>>(() => {
    const map = {} as Record<ComparisonProduct, ProductComparisonTable>
    for (const t of initialTables) map[t.product] = t
    return map
  })
  const [savingProduct, setSavingProduct] = useState<ComparisonProduct | null>(null)
  const [syncingProduct, setSyncingProduct] = useState<ComparisonProduct | null>(null)

  const setTable = (product: ComparisonProduct, patch: Partial<ProductComparisonTable>) =>
    setTables((prev) => ({ ...prev, [product]: { ...prev[product], ...patch } }))

  const save = async (product: ComparisonProduct) => {
    setSavingProduct(product)
    try {
      const t = tables[product]
      const res = await fetch("/api/admin/comparison-tables", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(t),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Salvataggio non riuscito")
      toast.success(`Tabella ${COMPARISON_PRODUCT_LABELS[product]} salvata`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Errore")
    } finally {
      setSavingProduct(null)
    }
  }

  const sync = async (product: ComparisonProduct) => {
    const url = (tables[product].source_url || "").trim()
    if (!url) {
      toast.error("Inserisci prima l'URL dell'endpoint del prodotto.")
      return
    }
    setSyncingProduct(product)
    try {
      const res = await fetch("/api/admin/comparison-tables/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product, source_url: url }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || data?.detail || "Sincronizzazione non riuscita")
      setTable(product, {
        title: data.table.title,
        headers: data.table.headers,
        rows: data.table.rows,
        footer_note: data.table.footer_note,
      })
      toast.success(`Importata da endpoint: ${COMPARISON_PRODUCT_LABELS[product]}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Errore")
    } finally {
      setSyncingProduct(null)
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Link href="/admin/quotes" className="inline-flex items-center gap-1 hover:text-foreground">
              <ArrowLeft className="h-4 w-4" /> Preventivi
            </Link>
          </div>
          <h1 className="text-2xl font-bold">Tabelle comparative prodotti</h1>
          <p className="text-sm text-muted-foreground mt-1 text-pretty">
            Sono i modelli "master" usati come default nei preventivi. Nell'editor del preventivo puoi attivarle per
            prodotto e ritoccarle sul singolo cliente.
          </p>
        </div>
      </div>

      <Tabs defaultValue={COMPARISON_PRODUCTS[0]}>
        <TabsList className="flex flex-wrap h-auto">
          {COMPARISON_PRODUCTS.map((p) => (
            <TabsTrigger key={p} value={p}>
              {COMPARISON_PRODUCT_LABELS[p]}
            </TabsTrigger>
          ))}
        </TabsList>

        {COMPARISON_PRODUCTS.map((product) => {
          const t = tables[product]
          return (
            <TabsContent key={product} value={product} className="space-y-6">
              {/* Sincronizzazione da endpoint prodotto (opzionale/futura) */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Link2 className="h-4 w-4" /> Origine dal progetto {COMPARISON_PRODUCT_LABELS[product]}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground text-pretty">
                    Se il progetto {COMPARISON_PRODUCT_LABELS[product]} espone un endpoint con la propria tabella, incolla
                    qui l'URL e premi Sincronizza per importarla. Finché non lo configuri, vale la versione qui sotto.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Input
                      value={t.source_url || ""}
                      onChange={(e) => setTable(product, { source_url: e.target.value })}
                      placeholder="https://…/api/comparison-table"
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => sync(product)}
                      disabled={syncingProduct === product}
                    >
                      <RefreshCw className={`h-4 w-4 mr-2 ${syncingProduct === product ? "animate-spin" : ""}`} />
                      Sincronizza
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Editor */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-3">
                  <CardTitle className="text-base">Contenuto tabella</CardTitle>
                  <div className="flex items-center gap-2">
                    <Label htmlFor={`enabled-${product}`} className="text-sm text-muted-foreground">
                      Attiva di default
                    </Label>
                    <Switch
                      id={`enabled-${product}`}
                      checked={t.enabled !== false}
                      onCheckedChange={(v) => setTable(product, { enabled: v })}
                    />
                  </div>
                </CardHeader>
                <CardContent className="space-y-5">
                  <ComparisonTableEditor
                    value={{ title: t.title, headers: t.headers, rows: t.rows, footer_note: t.footer_note }}
                    onChange={(next) => setTable(product, next)}
                  />
                  <div className="flex justify-end">
                    <Button type="button" onClick={() => save(product)} disabled={savingProduct === product}>
                      <Save className="h-4 w-4 mr-2" />
                      {savingProduct === product ? "Salvataggio…" : "Salva tabella"}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Anteprima come la vede il cliente */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Anteprima cliente</CardTitle>
                </CardHeader>
                <CardContent>
                  <ComparisonTablesPreview tables={[masterToQuoteTable(t, true)]} />
                </CardContent>
              </Card>
            </TabsContent>
          )
        })}
      </Tabs>
    </div>
  )
}
