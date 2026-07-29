import { HelpCircle } from "lucide-react"

interface Faq {
  question: string
  answer: string
}

interface FaqSectionProps {
  faqs: Faq[]
  title?: string
  intro?: string
}

/**
 * Sezione FAQ visibile nella pagina.
 *
 * Perche' esiste: diverse pagine dichiaravano un blocco FAQPage nei dati
 * strutturati mentre le domande NON erano presenti nel contenuto visibile.
 * Le linee guida di Google lo vietano (il markup deve descrivere contenuto
 * che l'utente puo' effettivamente leggere), con rischio di perdita del rich
 * result o di penalizzazione manuale.
 *
 * Riceve lo stesso array passato a <StructuredData faqs={...} />, cosi' il
 * testo visibile e il markup restano allineati per costruzione: non possono
 * divergere perche' la fonte e' unica.
 */
export function FaqSection({ faqs, title = "Domande frequenti", intro }: FaqSectionProps) {
  if (!faqs?.length) return null

  return (
    <section className="py-20 bg-muted/30" aria-labelledby="faq-heading">
      <div className="container mx-auto px-6">
        <h2 id="faq-heading" className="text-4xl font-bold text-center text-foreground mb-4 text-balance">
          {title}
        </h2>

        {intro ? (
          <p className="text-center text-muted-foreground mb-12 max-w-3xl mx-auto text-pretty leading-relaxed">
            {intro}
          </p>
        ) : (
          <div className="mb-12" />
        )}

        <div className="max-w-3xl mx-auto flex flex-col gap-6">
          {faqs.map((faq) => (
            <article key={faq.question} className="bg-card rounded-xl p-8 border border-border shadow-sm">
              <div className="flex gap-4">
                <HelpCircle className="h-6 w-6 text-primary-blue shrink-0 mt-1" aria-hidden="true" />
                <div>
                  <h3 className="text-xl font-bold text-card-foreground mb-3 text-pretty">{faq.question}</h3>
                  <p className="text-muted-foreground leading-relaxed text-pretty">{faq.answer}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
