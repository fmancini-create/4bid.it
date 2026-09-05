import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, ArrowRight, Check, ExternalLink, SearchCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { StructuredData } from "@/components/seo-structured-data"
import {
  KIND_LABEL,
  KIND_STYLE,
  PROBLEMS,
  getSolutionsForProblem,
} from "@/lib/problem-solutions"
import {
  CATEGORY_PLAYBOOKS,
  getProblemBySlug,
  getProblemCanonical,
  getProblemCategory,
  getProblemDescription,
  getProblemSlug,
  getProblemTitle,
  getRelatedProblems,
} from "@/lib/problem-seo"

export const dynamicParams = false

export function generateStaticParams() {
  return PROBLEMS.map((problem) => ({ slug: getProblemSlug(problem) }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const problem = getProblemBySlug(slug)
  if (!problem) return { title: "Problema hotel non trovato | 4BID.IT" }

  const title = getProblemTitle(problem)
  const description = getProblemDescription(problem)
  const url = getProblemCanonical(problem)
  const keywords = [
    ...(problem.keywords ?? []),
    problem.short,
    "problemi hotel",
    "gestione hotel",
    "soluzioni hotel",
  ]

  return {
    title,
    description,
    keywords: keywords.join(", "),
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: "4BID.IT",
      locale: "it_IT",
      type: "article",
      images: [
        {
          url: "https://www.4bid.it/4bid-colorful-logo.jpg",
          width: 1200,
          height: 630,
          alt: problem.short,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["https://www.4bid.it/4bid-colorful-logo.jpg"],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
  }
}

export default async function ProblemaHotelPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const problem = getProblemBySlug(slug)
  if (!problem) notFound()

  const category = getProblemCategory(problem)
  if (!category) notFound()

  const playbook = CATEGORY_PLAYBOOKS[problem.category]
  const solutions = getSolutionsForProblem(problem)
  const related = getRelatedProblems(problem, 6)
  const canonical = getProblemCanonical(problem)
  const description = getProblemDescription(problem)
  const solutionNames = solutions.map((solution) => solution.name).join(", ")
  const searchTerms = [...new Set(problem.keywords ?? [])].slice(0, 6)

  const faqs = [
    {
      question: `Cosa fare se in hotel ho il problema: ${problem.short}?`,
      answer: `Parti dalla misura del problema e dai dati che lo descrivono. Un primo controllo utile è: ${playbook.checks[0]} Le soluzioni 4BID collegate a questo caso sono ${solutionNames}.`,
    },
    {
      question: "Devo cambiare tutti i software che uso già?",
      answer:
        "Non necessariamente. Prima si verifica quali strumenti funzionano, quali dati devono comunicare e dove nasce davvero il collo di bottiglia. Quando possibile integriamo i sistemi esistenti; si sostituisce o sviluppa qualcosa di nuovo solo se serve al processo.",
    },
    {
      question: `Quali controlli conviene fare prima di intervenire su ${problem.short}?`,
      answer: playbook.checks.slice(0, 3).join(" "),
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      <StructuredData
        type="WebPage"
        title={getProblemTitle(problem)}
        description={description}
        url={canonical}
        keywords={[...(problem.keywords ?? []), problem.short, category.label]}
        faqs={faqs}
        breadcrumbs={[
          { name: "Home", url: "https://www.4bid.it" },
          { name: "Problemi hotel", url: "https://www.4bid.it/problemi-hotel-soluzioni" },
          { name: problem.short, url: canonical },
        ]}
        howTo={{
          name: `Come affrontare ${problem.short}`,
          description: `Percorso operativo iniziale per affrontare ${problem.short} in una struttura ricettiva.`,
          steps: playbook.approach.map((step, index) => ({
            name: `Passo ${index + 1}`,
            text: step,
          })),
        }}
        speakable={["h1", "#cosa-controllare", "#come-affrontarlo"]}
      />

      <Header />

      <main>
        <section className="bg-gradient-to-br from-primary-blue/10 via-blue-grey/5 to-background pt-28 pb-12 md:pt-32 md:pb-16">
          <div className="container mx-auto px-4 sm:px-6">
            <nav aria-label="Percorso" className="mb-7 text-sm text-muted-foreground">
              <ol className="flex flex-wrap items-center gap-2">
                <li>
                  <Link href="/" className="hover:underline">
                    Home
                  </Link>
                </li>
                <li aria-hidden="true">/</li>
                <li>
                  <Link href="/problemi-hotel-soluzioni" className="hover:underline">
                    Problemi hotel
                  </Link>
                </li>
                <li aria-hidden="true">/</li>
                <li aria-current="page" className="font-medium text-foreground">
                  {category.shortLabel}
                </li>
              </ol>
            </nav>

            <div className="max-w-4xl">
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-primary-blue/10 px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-primary-blue">
                  {category.label}
                </span>
                <span className="rounded-full border border-border bg-background/70 px-3 py-1.5 text-xs font-semibold text-muted-foreground">
                  Guida pratica
                </span>
              </div>

              <h1 className="mb-5 text-3xl font-bold leading-tight text-foreground sm:text-4xl md:text-5xl text-balance">
                {problem.label}
              </h1>
              <p className="mb-7 max-w-3xl text-lg leading-relaxed text-muted-foreground text-pretty md:text-xl">
                Se ti riconosci in questa situazione, qui trovi cosa controllare per prima cosa, un percorso pratico e
                le soluzioni 4BID più pertinenti per affrontarla senza aggiungere altro caos operativo.
              </p>

              {searchTerms.length > 0 && (
                <div className="mb-8 flex flex-wrap gap-2" aria-label="Argomenti correlati">
                  {searchTerms.map((term) => (
                    <span key={term} className="rounded-full bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground">
                      {term}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="bg-primary-blue hover:bg-primary-blue/90">
                  <a href="#cosa-controllare">Cosa controllare subito</a>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="/prenota-demo">Analizziamo il mio caso</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="py-12 md:py-16">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[0.9fr_1.1fr]">
              <article className="rounded-2xl border border-border bg-card p-6 shadow-sm md:p-8">
                <p className="mb-3 text-sm font-bold uppercase tracking-widest text-primary-blue">Perché conta</p>
                <h2 className="mb-4 text-2xl font-bold text-card-foreground text-balance">
                  Il costo nascosto di questo problema
                </h2>
                <p className="leading-relaxed text-muted-foreground text-pretty">{playbook.impact}</p>
              </article>

              <article
                id="cosa-controllare"
                className="scroll-mt-28 rounded-2xl border border-border bg-muted/35 p-6 md:p-8"
              >
                <div className="mb-5 flex items-start gap-3">
                  <span className="mt-0.5 flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-primary-blue/10 text-primary-blue">
                    <SearchCheck className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-sm font-bold uppercase tracking-widest text-primary-blue">Diagnosi iniziale</p>
                    <h2 className="mt-1 text-2xl font-bold text-foreground text-balance">Cosa controllare subito</h2>
                  </div>
                </div>

                <ul className="space-y-4">
                  {playbook.checks.map((check) => (
                    <li key={check} className="flex items-start gap-3 leading-relaxed text-muted-foreground">
                      <Check className="mt-1 h-5 w-5 flex-none text-primary-blue" aria-hidden="true" />
                      <span>{check}</span>
                    </li>
                  ))}
                </ul>
              </article>
            </div>
          </div>
        </section>

        <section id="come-affrontarlo" className="scroll-mt-28 border-y border-border bg-muted/25 py-12 md:py-16">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="mx-auto max-w-6xl">
              <div className="mb-8 max-w-3xl">
                <p className="mb-2 text-sm font-bold uppercase tracking-widest text-primary-blue">Metodo</p>
                <h2 className="text-2xl font-bold text-foreground sm:text-3xl md:text-4xl text-balance">
                  Come affrontare {problem.short}
                </h2>
                <p className="mt-3 leading-relaxed text-muted-foreground">
                  Prima di scegliere uno strumento, conviene mettere in ordine il processo. Questo è il percorso minimo
                  che usiamo per capire dove intervenire.
                </p>
              </div>

              <ol className="grid gap-5 md:grid-cols-3">
                {playbook.approach.map((step, index) => (
                  <li key={step} className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                    <span className="mb-4 flex h-9 w-9 items-center justify-center rounded-full bg-primary-blue text-sm font-bold text-white">
                      {index + 1}
                    </span>
                    <p className="font-semibold leading-relaxed text-card-foreground">{step}</p>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        <section className="py-12 md:py-16" aria-labelledby="soluzioni-problema-title">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="mx-auto max-w-6xl">
              <div className="mb-8 max-w-3xl">
                <p className="mb-2 text-sm font-bold uppercase tracking-widest text-primary-blue">Soluzioni collegate</p>
                <h2 id="soluzioni-problema-title" className="text-2xl font-bold text-foreground sm:text-3xl md:text-4xl text-balance">
                  Strumenti e competenze utili per questo caso
                </h2>
                <p className="mt-3 leading-relaxed text-muted-foreground">
                  Non significa che servano tutti: la combinazione corretta dipende dai sistemi che usi già, dai dati
                  disponibili e da dove nasce il problema.
                </p>
              </div>

              <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {solutions.map((solution) => (
                  <li key={solution.id} className="flex flex-col rounded-2xl border border-border bg-card p-6 shadow-sm">
                    <span
                      className={`mb-4 w-fit rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-widest ${KIND_STYLE[solution.kind]}`}
                    >
                      {KIND_LABEL[solution.kind]}
                    </span>
                    <h3 className="mb-2 text-lg font-bold text-card-foreground">{solution.name}</h3>
                    <p className="mb-6 leading-relaxed text-muted-foreground">{solution.claim}</p>
                    <div className="mt-auto space-y-2">
                      <Button asChild variant="outline" className="w-full justify-between bg-transparent">
                        <Link href={solution.href}>
                          <span>Scopri come funziona</span>
                          <ArrowRight className="h-4 w-4" aria-hidden="true" />
                        </Link>
                      </Button>
                      {solution.externalUrl && (
                        <Button asChild className="w-full justify-between bg-primary-blue hover:bg-primary-blue/90">
                          <a href={solution.externalUrl} target="_blank" rel="noopener noreferrer">
                            <span>Visita il sito</span>
                            <ExternalLink className="h-4 w-4" aria-hidden="true" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="border-y border-border bg-muted/30 py-12 md:py-16" aria-labelledby="faq-problema-title">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="mx-auto max-w-3xl">
              <h2 id="faq-problema-title" className="mb-7 text-2xl font-bold text-foreground sm:text-3xl text-balance">
                Domande frequenti
              </h2>
              <div className="divide-y divide-border">
                {faqs.map((faq) => (
                  <details key={faq.question} className="group py-4">
                    <summary className="flex cursor-pointer items-start justify-between gap-4 font-semibold text-foreground marker:content-none sm:text-lg">
                      <span>{faq.question}</span>
                      <ArrowRight
                        className="mt-1 h-5 w-5 flex-none text-primary-blue transition-transform group-open:rotate-90"
                        aria-hidden="true"
                      />
                    </summary>
                    <p className="mt-3 leading-relaxed text-muted-foreground">{faq.answer}</p>
                  </details>
                ))}
              </div>
            </div>
          </div>
        </section>

        {related.length > 0 && (
          <section className="py-12 md:py-16" aria-labelledby="problemi-correlati-title">
            <div className="container mx-auto px-4 sm:px-6">
              <div className="mx-auto max-w-6xl">
                <div className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="mb-2 text-sm font-bold uppercase tracking-widest text-primary-blue">Approfondisci</p>
                    <h2 id="problemi-correlati-title" className="text-2xl font-bold text-foreground sm:text-3xl text-balance">
                      Altri problemi spesso collegati
                    </h2>
                  </div>
                  <Link
                    href="/problemi-hotel-soluzioni#problemi-elenco"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-primary-blue hover:underline"
                  >
                    Vedi tutti i problemi
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {related.map((item) => (
                    <Link
                      key={item.id}
                      href={`/problemi-hotel/${getProblemSlug(item)}`}
                      className="group rounded-2xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-primary-blue hover:shadow-md"
                    >
                      <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                        {getProblemCategory(item)?.shortLabel}
                      </span>
                      <h3 className="mt-2 font-semibold leading-snug text-card-foreground group-hover:text-primary-blue">
                        {item.label}
                      </h3>
                      <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary-blue">
                        Leggi la guida
                        <ArrowRight className="h-4 w-4" aria-hidden="true" />
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        <section className="bg-gray-900 py-12 md:py-16">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="mb-4 text-2xl font-bold text-white sm:text-3xl md:text-4xl text-balance">
                Vuoi capire da dove nasce davvero il problema?
              </h2>
              <p className="mb-8 leading-relaxed text-gray-300 md:text-lg">
                Partiamo dai tuoi dati e dal processo reale della struttura. Se basta correggere il metodo te lo
                diciamo; se serve tecnologia, individuiamo quella giusta.
              </p>
              <div className="flex flex-col justify-center gap-3 sm:flex-row">
                <Button asChild size="lg" className="bg-[#F4B942] text-gray-900 hover:bg-[#e0a72f]">
                  <Link href="/prenota-demo">Prenota una demo</Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-gray-600 bg-transparent text-white hover:bg-gray-800 hover:text-white"
                >
                  <Link href="/problemi-hotel-soluzioni#selettore">Analizza altri problemi</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <div className="container mx-auto px-4 py-8 sm:px-6">
          <Link
            href="/problemi-hotel-soluzioni"
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary-blue hover:underline"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Torna alla mappa completa dei problemi hotel
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  )
}
