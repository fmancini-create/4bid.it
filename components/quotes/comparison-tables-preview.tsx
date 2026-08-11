import { Check } from "lucide-react"
import { isCheckValue, type QuoteComparisonTable } from "@/lib/quotes/comparison"

interface Props {
  tables: QuoteComparisonTable[]
  /** Titolo di sezione mostrato sopra le tabelle. Nascondibile in anteprima. */
  heading?: string
}

/**
 * Vista cliente delle tabelle comparative. Condivisa tra l'anteprima admin e le
 * due viste del preventivo (singolo e multi-progetto). Renderizza solo le
 * tabelle abilitate e con almeno una colonna e una riga.
 */
export default function ComparisonTablesPreview({ tables, heading = "Perché sceglierci" }: Props) {
  const visible = (tables || []).filter(
    (t) => t.enabled !== false && t.headers.length > 0 && t.rows.length > 0,
  )
  if (visible.length === 0) return null

  return (
    <section className="rounded-2xl border bg-card p-6 space-y-8">
      {heading && (
        <h2 className="text-lg font-semibold text-balance">{heading}</h2>
      )}

      {visible.map((table) => (
        <div key={table.product} className="space-y-3">
          {table.title && (
            <p className="text-sm font-medium text-muted-foreground">{table.title}</p>
          )}

          <div className="overflow-x-auto -mx-2 px-2">
            <table className="w-full min-w-[480px] border-collapse text-sm">
              <thead>
                <tr>
                  <th className="w-[40%] py-3 pr-3 text-left align-bottom font-medium text-muted-foreground">
                    <span className="sr-only">Caratteristica</span>
                  </th>
                  {table.headers.map((h) => (
                    <th
                      key={h.key}
                      scope="col"
                      className={`px-3 py-3 text-center align-bottom font-semibold ${
                        h.highlight
                          ? "rounded-t-lg bg-primary text-primary-foreground"
                          : "text-foreground"
                      }`}
                    >
                      {h.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {table.rows.map((row, ri) => (
                  <tr key={ri} className="border-t border-border">
                    <th
                      scope="row"
                      className="py-3 pr-3 text-left font-normal text-foreground"
                    >
                      {row.label}
                    </th>
                    {table.headers.map((h) => {
                      const raw = row.cells[h.key] ?? ""
                      const checked = isCheckValue(raw)
                      return (
                        <td
                          key={h.key}
                          className={`px-3 py-3 text-center align-middle ${
                            h.highlight ? "bg-primary/5 font-medium" : ""
                          }`}
                        >
                          {checked ? (
                            <Check
                              className={`inline h-4 w-4 ${h.highlight ? "text-primary" : "text-foreground"}`}
                              aria-label="Sì"
                            />
                          ) : raw ? (
                            <span className="text-muted-foreground">{raw}</span>
                          ) : (
                            <span className="text-muted-foreground/40" aria-label="Non incluso">
                              —
                            </span>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {table.footer_note && (
            <p className="text-sm text-muted-foreground text-pretty">{table.footer_note}</p>
          )}
        </div>
      ))}
    </section>
  )
}
