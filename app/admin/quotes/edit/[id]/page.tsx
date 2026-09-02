import QuoteCatalogEditor from "./quote-catalog-editor"
import QuoteExpansionEditor from "./quote-expansion-editor"
import QuotePresentationModeEditor from "./quote-presentation-mode-editor"
import QuoteStructureEditor from "./quote-structure-editor"

export default async function QuoteEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return (
    <div className="space-y-6 pb-10">
      <QuotePresentationModeEditor quoteId={id} />
      <QuoteStructureEditor quoteId={id} />

      <details className="mx-auto max-w-7xl overflow-hidden rounded-2xl border bg-card">
        <summary className="cursor-pointer select-none px-5 py-4 text-base font-bold hover:bg-muted/40">
          Editor avanzato · catalogo, prezzi, sconti e configurazioni
        </summary>
        <div className="border-t p-5">
          <QuoteCatalogEditor quoteId={id} />
        </div>
      </details>

      <details className="mx-auto max-w-7xl overflow-hidden rounded-2xl border bg-card">
        <summary className="cursor-pointer select-none px-5 py-4 text-base font-bold hover:bg-muted/40">
          Strumenti avanzati · gruppi e multi-struttura
        </summary>
        <div className="border-t p-5">
          <QuoteExpansionEditor quoteId={id} />
        </div>
      </details>
    </div>
  )
}
