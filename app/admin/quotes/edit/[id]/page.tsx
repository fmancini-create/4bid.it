import QuoteCatalogEditor from "./quote-catalog-editor"
import QuoteExpansionEditor from "./quote-expansion-editor"

export default async function QuoteEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return (
    <>
      <QuoteExpansionEditor quoteId={id} />
      <QuoteCatalogEditor quoteId={id} />
    </>
  )
}
