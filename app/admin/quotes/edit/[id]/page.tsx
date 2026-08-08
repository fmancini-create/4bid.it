import QuoteCatalogEditor from "./quote-catalog-editor"

export default async function QuoteEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <QuoteCatalogEditor quoteId={id} />
}
