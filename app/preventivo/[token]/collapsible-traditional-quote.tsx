import type { ReactNode } from "react"
import { ChevronDown, FileText } from "lucide-react"

export default function CollapsibleTraditionalQuote({ children }: { children: ReactNode }) {
  return (
    <section className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6">
      <details className="group overflow-hidden rounded-2xl border border-slate-200 bg-background shadow-sm">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 transition hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset sm:px-6 sm:py-5 [&::-webkit-details-marker]:hidden">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
              <FileText className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="font-bold text-foreground">Apri il preventivo completo</p>
              <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                Prodotti, prezzi, opzioni, condizioni, dati di attivazione e accettazione.
              </p>
            </div>
          </div>
          <ChevronDown className="h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-180" />
        </summary>
        <div className="border-t bg-muted/15 pb-2">
          {children}
        </div>
      </details>
    </section>
  )
}
