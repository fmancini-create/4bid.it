import type { Metadata } from "next"
import Link from "next/link"
import { Lightbulb, Smartphone, Globe, Database, ShoppingCart, LineChart, ArrowRight } from "lucide-react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import ProjectIdeaForm from "@/components/project-idea-form"
import { LandingPageTracker } from "@/components/landing-page-tracker"
import { StructuredData } from "@/components/seo-structured-data"

const PAGE_URL = "https://www.4bid.it/proponi-idea"

const faqs = [
  {
    question: "Quanto costa proporre un'idea o chiedere un preventivo?",
    answer:
      "La consulenza iniziale e la valutazione di fattibilità sono completamente gratuite. Ricevi una stima di costi e tempi senza impegno e paghi solo se decidi di procedere con lo sviluppo del software.",
  },
  {
    question: "Come funziona lo sviluppo software con revenue share?",
    answer:
      "Per progetti con alto potenziale possiamo sviluppare la tua idea senza costi iniziali, in cambio di una percentuale sui ricavi futuri. La quota viene concordata caso per caso in base al rischio e all'investimento richiesto: paghi solo quando il prodotto genera fatturato.",
  },
  {
    question: "La mia idea è protetta? Firmate un NDA?",
    answer:
      "Sì. Trattiamo ogni informazione con la massima riservatezza e firmiamo volentieri un accordo di non divulgazione (NDA) prima di entrare nei dettagli del progetto, così puoi condividere la tua idea in totale sicurezza.",
  },
  {
    question: "Che tipo di software e app sviluppate?",
    answer:
      "Sviluppiamo web app, applicazioni mobile iOS e Android, software gestionali su misura, piattaforme SaaS, sistemi di revenue management, e-commerce, automazioni e integrazioni con API. Se l'idea è digitale, possiamo realizzarla.",
  },
]

const cosaSviluppiamo = [
  {
    icon: Globe,
    title: "Web App e Piattaforme SaaS",
    description: "Applicazioni web scalabili e piattaforme in abbonamento, dalla dashboard gestionale al portale clienti.",
  },
  {
    icon: Smartphone,
    title: "App Mobile iOS e Android",
    description: "App native e cross-platform performanti, pensate per l'esperienza utente e la crescita.",
  },
  {
    icon: Database,
    title: "Software Gestionali su Misura",
    description: "Gestionali e sistemi interni costruiti sui processi reali della tua azienda, non il contrario.",
  },
  {
    icon: LineChart,
    title: "Sistemi di Revenue Management",
    description: "La nostra specialità: motori di pricing dinamico e analisi dati per massimizzare i ricavi.",
  },
  {
    icon: ShoppingCart,
    title: "E-commerce e Marketplace",
    description: "Negozi online e marketplace con pagamenti, logistica e integrazioni con i tuoi strumenti.",
  },
  {
    icon: Lightbulb,
    title: "Automazioni e Integrazioni",
    description: "Bot, automazioni e integrazioni via API che eliminano il lavoro manuale ripetitivo.",
  },
]

const progetti = [
  {
    slug: "santaddeo",
    name: "Santaddeo",
    tagline: "The Human Revenue Manager: revenue management per hotel.",
  },
  {
    slug: "hotel-accelerator",
    name: "Hotel Accelerator",
    tagline: "Il software gestionale completo per hotel e strutture ricettive.",
  },
  {
    slug: "manubot",
    name: "Manubot",
    tagline: "Sistema smart di gestione manutenzioni e housekeeping.",
  },
  {
    slug: "autoexel",
    name: "AutoExel",
    tagline: "Il primo Excel per chi non sa usare Excel.",
  },
  {
    slug: "risparmio-compulsivo",
    name: "Risparmio Compulsivo",
    tagline: "App gamificata che rende il risparmio un gioco.",
  },
]

export const metadata: Metadata = {
  title: "Sviluppo Software e App su Misura | Anche con Revenue Share | 4BID",
  description:
    "Trasformiamo la tua idea in software: web app, app mobile, gestionali e SaaS su misura. Preventivo gratuito in 24 ore e, per i progetti selezionati, sviluppo senza costi iniziali con revenue share.",
  keywords: [
    "sviluppo software su misura",
    "sviluppo app",
    "sviluppo software revenue share",
    "sviluppo app senza costi iniziali",
    "trasformare un'idea in app",
    "preventivo sviluppo software gratuito",
    "agenzia sviluppo software Toscana",
    "sviluppo piattaforme SaaS",
    "sviluppo software gestionale",
    "preventivo sviluppo app",
  ],
  openGraph: {
    title: "Sviluppo Software e App su Misura — Anche con Revenue Share | 4BID",
    description:
      "Hai un'idea digitale? La trasformiamo in software. Preventivo gratuito in 24h con fattibilità, costi e tempi. Per i progetti selezionati sviluppiamo senza costi iniziali (revenue share).",
    type: "website",
    url: PAGE_URL,
    locale: "it_IT",
    siteName: "4BID.IT",
    images: [
      {
        url: "https://www.4bid.it/4bid-colorful-logo.jpg",
        width: 1200,
        height: 630,
        alt: "4BID — Sviluppo Software e App su Misura",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Sviluppo Software e App su Misura — Anche con Revenue Share | 4BID",
    description: "Trasformiamo la tua idea in software. Preventivo gratuito in 24h, anche con revenue share.",
    images: ["https://www.4bid.it/4bid-colorful-logo.jpg"],
  },
  alternates: {
    canonical: PAGE_URL,
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

export default function ProponiIdeaPage() {
  return (
    <>
      <StructuredData
        type="WebPage"
        title="Sviluppo Software e App su Misura — Anche con Revenue Share"
        description="Servizio di valutazione idee e sviluppo software su misura con preventivo in 24 ore. Web app, app mobile, gestionali e SaaS. Revenue share disponibile per i progetti selezionati."
        url={PAGE_URL}
        keywords={[
          "sviluppo software su misura",
          "sviluppo app",
          "sviluppo software revenue share",
          "preventivo sviluppo software gratuito",
        ]}
        faqs={faqs}
        breadcrumbs={[
          { name: "Home", url: "https://www.4bid.it" },
          { name: "Sviluppo Software su Misura", url: PAGE_URL },
        ]}
      />

      <LandingPageTracker slug="proponi-idea" />

      <Header />
      <main className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="pt-32 pb-16 bg-gradient-to-br from-[#5B9BD5]/5 to-[#F4B942]/5">
          <div className="container mx-auto px-6">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6 text-balance">
                Sviluppiamo la Tua Idea in <span className="text-[#5B9BD5]">Software su Misura</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed text-pretty">
                Web app, app mobile, gestionali e piattaforme SaaS costruiti sulle tue esigenze. Descrivici il progetto
                e <strong>in 24 ore</strong> ricevi una valutazione di fattibilità, una stima dei costi e i tempi di
                realizzazione, senza impegno.
              </p>
              <div className="bg-[#F4B942]/10 border-l-4 border-[#F4B942] rounded-lg p-6 text-left">
                <p className="text-lg font-semibold text-foreground mb-2 flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-[#F4B942]" aria-hidden="true" />
                  Sviluppo senza costi iniziali (Revenue Share)
                </p>
                <p className="text-muted-foreground">
                  Per i progetti selezionati con alto potenziale sviluppiamo <strong>senza costi iniziali</strong>, in
                  cambio di una percentuale sui ricavi futuri. Se la tua idea ha potenziale, possiamo investire insieme.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Form Section */}
        <section className="py-16">
          <div className="container mx-auto px-6">
            <div className="max-w-3xl mx-auto">
              <ProjectIdeaForm />
            </div>
          </div>
        </section>

        {/* Cosa Sviluppiamo Section */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-6">
            <div className="max-w-5xl mx-auto">
              <h2 className="text-3xl font-bold text-center text-foreground mb-4 text-balance">
                Cosa Sviluppiamo
              </h2>
              <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto text-pretty">
                Dalla prima riga di codice al lancio: progettiamo e realizziamo software su misura per startup, PMI e
                strutture ricettive.
              </p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {cosaSviluppiamo.map((item) => {
                  const Icon = item.icon
                  return (
                    <div key={item.title} className="bg-card border border-border rounded-lg p-6">
                      <div className="w-12 h-12 rounded-lg bg-[#5B9BD5]/10 flex items-center justify-center mb-4">
                        <Icon className="h-6 w-6 text-[#5B9BD5]" aria-hidden="true" />
                      </div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">{item.title}</h3>
                      <p className="text-muted-foreground text-sm leading-relaxed">{item.description}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Come Funziona Section */}
        <section className="py-16">
          <div className="container mx-auto px-6">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-center text-foreground mb-12 text-balance">Come Funziona</h2>
              <div className="grid md:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="w-16 h-16 bg-[#5B9BD5] text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                    1
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">Compila il Form</h3>
                  <p className="text-muted-foreground">
                    Descrivici la tua idea nel dettaglio: obiettivi, funzionalità desiderate e budget indicativo
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-[#5B9BD5] text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                    2
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">Analisi in 24h</h3>
                  <p className="text-muted-foreground">
                    Il nostro team analizza fattibilità tecnica, tempi di sviluppo e stima dei costi
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-[#5B9BD5] text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                    3
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">Proposta Dettagliata</h3>
                  <p className="text-muted-foreground">
                    Ricevi preventivo completo con roadmap, costi e possibile modello revenue share
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Progetti Realizzati Section */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-6">
            <div className="max-w-5xl mx-auto">
              <h2 className="text-3xl font-bold text-center text-foreground mb-4 text-balance">
                Progetti che Abbiamo Realizzato
              </h2>
              <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto text-pretty">
                Idee diventate prodotti reali, in uso ogni giorno. Anche la tua può entrare in questa lista.
              </p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {progetti.map((p) => (
                  <Link
                    key={p.slug}
                    href={`/progetti/${p.slug}`}
                    className="group bg-card border border-border rounded-lg p-6 transition-colors hover:border-[#5B9BD5]"
                  >
                    <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-[#5B9BD5]">{p.name}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed mb-4">{p.tagline}</p>
                    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-[#5B9BD5]">
                      Scopri il progetto
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16">
          <div className="container mx-auto px-6">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl font-bold text-center text-foreground mb-12 text-balance">Domande Frequenti</h2>
              <div className="space-y-6">
                {faqs.map((faq) => (
                  <div key={faq.question} className="bg-card border border-border rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-foreground mb-2">{faq.question}</h3>
                    <p className="text-muted-foreground">{faq.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
