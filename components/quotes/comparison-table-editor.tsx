"use client"

import { Plus, Trash2, Check, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  CHECK_VALUE,
  isCheckValue,
  type ComparisonColumn,
  type ComparisonRow,
} from "@/lib/quotes/comparison"

export interface EditableComparisonTable {
  title: string
  headers: ComparisonColumn[]
  rows: ComparisonRow[]
  footer_note: string
}

interface Props {
  value: EditableComparisonTable
  onChange: (next: EditableComparisonTable) => void
}

function slugKey(label: string, taken: string[]): string {
  const base =
    label
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "") || "col"
  let key = base
  let i = 2
  while (taken.includes(key)) key = `${base}_${i++}`
  return key
}

export default function ComparisonTableEditor({ value, onChange }: Props) {
  const { title, headers, rows, footer_note } = value

  const update = (patch: Partial<EditableComparisonTable>) => onChange({ ...value, ...patch })

  const addColumn = () => {
    const key = slugKey(`colonna ${headers.length + 1}`, headers.map((h) => h.key))
    update({ headers: [...headers, { key, label: "", highlight: false }] })
  }

  const removeColumn = (key: string) => {
    update({
      headers: headers.filter((h) => h.key !== key),
      rows: rows.map((r) => {
        const { [key]: _drop, ...rest } = r.cells
        return { ...r, cells: rest }
      }),
    })
  }

  const setColumn = (key: string, patch: Partial<ComparisonColumn>) => {
    update({ headers: headers.map((h) => (h.key === key ? { ...h, ...patch } : h)) })
  }

  const setHighlight = (key: string) => {
    update({ headers: headers.map((h) => ({ ...h, highlight: h.key === key })) })
  }

  const addRow = () => {
    const cells: Record<string, string> = {}
    for (const h of headers) cells[h.key] = ""
    update({ rows: [...rows, { label: "", cells }] })
  }

  const removeRow = (idx: number) => update({ rows: rows.filter((_, i) => i !== idx) })

  const setRowLabel = (idx: number, label: string) =>
    update({ rows: rows.map((r, i) => (i === idx ? { ...r, label } : r)) })

  const setCell = (idx: number, key: string, cellValue: string) =>
    update({
      rows: rows.map((r, i) => (i === idx ? { ...r, cells: { ...r.cells, [key]: cellValue } } : r)),
    })

  const toggleCheck = (idx: number, key: string) => {
    const current = rows[idx]?.cells[key]
    setCell(idx, key, isCheckValue(current) ? "" : CHECK_VALUE)
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-2">
        <Label className="text-xs font-medium text-muted-foreground">Sottotitolo tabella</Label>
        <Input
          value={title}
          onChange={(e) => update({ title: e.target.value })}
          placeholder="Es. Per un gruppo multi-hotel"
        />
      </div>

      {/* Colonne */}
      <div className="grid gap-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-medium text-muted-foreground">
            Colonne di confronto (la stella = colonna del nostro prodotto)
          </Label>
          <Button type="button" size="sm" variant="outline" onClick={addColumn}>
            <Plus className="h-4 w-4 mr-1" /> Colonna
          </Button>
        </div>
        <div className="space-y-2">
          {headers.map((h) => (
            <div key={h.key} className="flex items-center gap-2">
              <Button
                type="button"
                size="icon"
                variant={h.highlight ? "default" : "outline"}
                onClick={() => setHighlight(h.key)}
                title="Segna come colonna del nostro prodotto"
                aria-label="Segna come colonna del nostro prodotto"
                className="shrink-0"
              >
                <Star className={`h-4 w-4 ${h.highlight ? "fill-current" : ""}`} />
              </Button>
              <Input
                value={h.label}
                onChange={(e) => setColumn(h.key, { label: e.target.value })}
                placeholder="Intestazione colonna"
              />
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={() => removeColumn(h.key)}
                aria-label="Rimuovi colonna"
                className="shrink-0 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          {headers.length === 0 && (
            <p className="text-sm text-muted-foreground">Nessuna colonna. Aggiungine almeno una.</p>
          )}
        </div>
      </div>

      {/* Righe */}
      <div className="grid gap-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-medium text-muted-foreground">
            Righe (clic sulla spunta per attivarla/disattivarla nella cella)
          </Label>
          <Button type="button" size="sm" variant="outline" onClick={addRow} disabled={headers.length === 0}>
            <Plus className="h-4 w-4 mr-1" /> Riga
          </Button>
        </div>

        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nessuna riga.</p>
        ) : (
          <div className="space-y-3">
            {rows.map((row, idx) => (
              <div key={idx} className="rounded-lg border border-border p-3 space-y-2 bg-muted/30">
                <div className="flex items-center gap-2">
                  <Input
                    value={row.label}
                    onChange={(e) => setRowLabel(idx, e.target.value)}
                    placeholder="Caratteristica (es. Manutenzione programmata)"
                    className="font-medium"
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => removeRow(idx)}
                    aria-label="Rimuovi riga"
                    className="shrink-0 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {headers.map((h) => {
                    const cellValue = row.cells[h.key] ?? ""
                    const checked = isCheckValue(cellValue)
                    return (
                      <div key={h.key} className="flex items-center gap-2">
                        <Button
                          type="button"
                          size="icon"
                          variant={checked ? "default" : "outline"}
                          onClick={() => toggleCheck(idx, h.key)}
                          title="Spunta"
                          aria-label={`Spunta ${h.label || h.key}`}
                          className="shrink-0 h-9 w-9"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Input
                          value={checked ? "" : cellValue}
                          disabled={checked}
                          onChange={(e) => setCell(idx, h.key, e.target.value)}
                          placeholder={h.label || h.key}
                          className="text-sm"
                        />
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-2">
        <Label className="text-xs font-medium text-muted-foreground">Frase finale (sotto la tabella)</Label>
        <Textarea
          value={footer_note}
          onChange={(e) => update({ footer_note: e.target.value })}
          placeholder="Es. MANUBOT è pensato per offrire capacità enterprise senza introdurre complessità enterprise."
          rows={2}
        />
      </div>
    </div>
  )
}
