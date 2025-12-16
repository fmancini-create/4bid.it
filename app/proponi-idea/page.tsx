import type { Metadata } from "next"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import ProjectIdeaForm from "@/components/project-idea-form"

export const metadata: Metadata = {
  title: "Proponi il Tuo Progetto Digitale - Risposta in 24h | 4BID.IT",
  description:
    "Hai un'idea per app, web app o software? Inviaci il tuo progetto e ricevi valutazione di fattibilità, preventivo e tempi in 24 ore. Revenue share disponibile per idee selezionate.",
  keywords: [
    "proponi progetto digitale",
    "sviluppo app su commissione",
    "preventivo software",
    "revenue share sviluppo",
    "idea startup",
    "sviluppo mvp",
    "validazione idea business",
  ],
  openGraph: {
    title: "Trasforma la Tua Idea in Realtà - Risposta Entro 24 Ore",
    description:
      "Descrivi il tuo progetto e ricevi analisi di fattibilità completa entro 24h. Sviluppiamo anche con revenue share senza costi iniziali.",
    type: "website",
    url: "https://4bid.it/proponi-idea",
  },
  alternates: {
    canonical: "https://4bid.it/proponi-idea",
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function ProponiIdeaPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="pt-32 pb-16 bg-gradient-to-br from-[#5B9BD5]/5 to-[#F4B942]/5">
          <div className="container mx-auto px-6">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
                Trasforma la Tua Idea Digitale in <span className="text-[#5B9BD5]">Realtà Concreta</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed">
                Descrivici il tuo progetto e <strong>in 24 ore</strong> riceverai una risposta dal nostro team con
                valutazione di fattibilità, stima dei costi e tempi di realizzazione.
              </p>
              <div className="bg-[#F4B942]/10 border-l-4 border-[#F4B942] rounded-lg p-6 text-left">
                <p className="text-lg font-semibold text-foreground mb-2">💡 Revenue Share disponibile</p>
                <p className="text-muted-foreground">
                  In alcuni casi selezionati, sviluppiamo progetti <strong>senza costi iniziali</strong> ma con una fee
                  percentuale sui ricavi futuri. Se la tua idea ha potenziale, possiamo investire insieme!
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

        {/* Come Funziona Section */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-6">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-center text-foreground mb-12">Come Funziona</h2>
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

        {/* FAQ Section */}
        <section className="py-16">
          <div className="container mx-auto px-6">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl font-bold text-center text-foreground mb-12">Domande Frequenti</h2>
              <div className="space-y-6">
                <div className="bg-card border border-border rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-2">Quanto costa proporre un'idea?</h3>
                  <p className="text-muted-foreground">
                    La consulenza iniziale e la valutazione di fattibilità sono completamente gratuite. Pagherai solo se
                    decidi di procedere con lo sviluppo.
                  </p>
                </div>
                <div className="bg-card border border-border rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-2">Come funziona il revenue share?</h3>
                  <p className="text-muted-foreground">
                    Per progetti con alto potenziale, possiamo sviluppare senza costi iniziali in cambio di una
                    percentuale sui ricavi futuri. La percentuale viene concordata caso per caso in base al rischio e
                    all'investimento richiesto.
                  </p>
                </div>
                <div className="bg-card border border-border rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-2">La mia idea è protetta?</h3>
                  <p className="text-muted-foreground">
                    Sì, trattiamo tutte le informazioni con la massima riservatezza. Possiamo firmare un NDA prima di
                    discutere i dettagli del progetto se necessario.
                  </p>
                </div>
                <div className="bg-card border border-border rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-2">Che tipo di progetti sviluppate?</h3>
                  <p className="text-muted-foreground">
                    Web app, mobile app, software gestionali, piattaforme SaaS, sistemi di revenue management,
                    e-commerce e molto altro. Se è digitale, possiamo realizzarlo.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Service",
              name: "Valutazione Progetti Digitali",
              description:
                "Analisi di fattibilità e preventivo per progetti digitali entro 24 ore. Sviluppo con revenue share disponibile.",
              provider: {
                "@type": "Organization",
                name: "4BID.IT",
                url: "https://4bid.it",
              },
              serviceType: "Sviluppo Software Custom",
              url: "https://4bid.it/proponi-idea",
              areaServed: "Worldwide",
            }),
          }}
        />
      </main>
      <Footer />
    </>
  )
}
