/**
 * Sezione FAQ visibile (accordion accessibile via <details>, senza JS client).
 * Lo schema FAQPage è emesso separatamente da StructuredData con gli stessi dati.
 * La classe "kb-faq" è usata anche come selettore Speakable.
 */
export function KBFaq({
  faqs,
  title = "Domande frequenti",
}: {
  faqs?: { question: string; answer: string }[]
  title?: string
}) {
  if (!faqs || faqs.length === 0) return null

  return (
    <section aria-labelledby="faq-title" className="kb-faq">
      <h2 id="faq-title" className="mb-6 text-2xl font-bold text-foreground md:text-3xl text-balance">
        {title}
      </h2>
      <div className="space-y-3">
        {faqs.map((faq, i) => (
          <details key={i} className="group rounded-lg border border-border bg-card">
            <summary className="flex cursor-pointer items-center justify-between gap-4 p-5 font-semibold text-foreground">
              {faq.question}
              <span className="text-primary-blue transition-transform group-open:rotate-45" aria-hidden="true">
                +
              </span>
            </summary>
            <p className="px-5 pb-5 text-muted-foreground leading-relaxed">{faq.answer}</p>
          </details>
        ))}
      </div>
    </section>
  )
}
