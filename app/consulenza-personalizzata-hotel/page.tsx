import Link from "next/link"
import { Target, Users, BarChart3, CheckCircle2, Phone, MessageCircle, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import Header from "@/components/header"
import Footer from "@/components/footer"
import { LandingPageTracker } from "@/components/landing-page-tracker"
import { StructuredData } from "@/components/seo-structured-data"

export const metadata = {
  title: "Consulenza Personalizzata Hotel | Revenue Management su Misura | 4BID.IT",
  description:
    "Consulenza revenue management personalizzata per hotel, B&B e strutture ricettive. Analisi su misura, piano operativo dedicato e supporto continuativo per massimizzare ricavi.",
  keywords:
    "consulenza hotel, revenue management personalizzato, consulenza ricettività, ottimizzazione hotel, strategia revenue",
  openGraph: {
    title: "Consulenza Personalizzata Hotel | Revenue Management su Misura | 4BID.IT",
    description: "Analisi su misura e piano operativo dedicato per massimizzare i ricavi della tua struttura.",
    url: "https://www.4bid.it/consulenza-personalizzata-hotel",
    type: "website",
  },
  alternates: {
    canonical: "https://www.4bid.it/consulenza-personalizzata-hotel",
  },
}

const faqData = [
  {
    question: "Cosa include una consulenza revenue management personalizzata?",
    answer:
      "Include: analisi completa della struttura (audit 360°), sviluppo strategia personalizzata, implementazione guidata con formazione del team, ottimizzazione continuativa con supporto mensile, dashboard KPI e reporting personalizzato.",
  },
  {
    question: "Quanto dura il processo di consulenza?",
    answer:
      "Il processo si sviluppa in 4 fasi: Analisi Completa (settimana 1-2), Strategia Personalizzata (settimana 3), Implementazione Guidata (mese 2-3), Ottimizzazione Continuativa (ongoing con call mensili e supporto via email/telefono).",
  },
  {
    question: "La prima consulenza è gratuita?",
    answer:
      "Sì, la prima consulenza e l'analisi iniziale sono completamente gratuite e senza impegno. Questo permette di valutare le opportunità concrete per la tua struttura prima di iniziare la collaborazione.",
  },
]

export default function ConsulenzaPersonalizzataHotelPage() {
  return (
    <div className="min-h-screen bg-background">
      <StructuredData
        type="Service"
        title="Consulenza Personalizzata Hotel"
        description="Consulenza revenue management personalizzata per hotel e strutture ricettive"
        faq={faqData}
      />
      <LandingPageTracker slug="consulenza-personalizzata-hotel" />

      <Header />

      {/* Hero Section */}
      <section className="pt-32 pb-16 bg-gradient-to-br from-primary-blue/10 via-blue-grey/5 to-background">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl font-bold text-foreground mb-6 text-balance">
              Consulenza Revenue Management Personalizzata
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed mb-8 text-pretty">
              Ogni hotel è unico. Ti offriamo analisi su misura, piano operativo dedicato e affiancamento continuativo
              per massimizzare i ricavi della tua struttura.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link href="/#contact">
                <Button size="lg" className="bg-primary-blue hover:bg-primary-blue/90">
                  Richiedi Consulenza Gratuita
                </Button>
              </Link>
              <Link href="tel:+390558334567">
                <Button size="lg" variant="outline">
                  <Phone className="mr-2 h-5 w-5" />
                  Chiamaci Ora
                </Button>
              </Link>
            </div>
            <p className="text-sm text-muted-foreground mt-4">Prima consulenza e analisi completamente gratuite</p>
          </div>
        </div>
      </section>

      {/* Why Personalized */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center text-foreground mb-4">
            Perché Servono Consulenze Personalizzate?
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Le strategie standard non funzionano. Ogni hotel ha sfide uniche che richiedono soluzioni su misura.
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-card rounded-xl p-8 shadow-md border border-border">
              <Target className="h-12 w-12 text-primary-blue mb-4" />
              <h3 className="text-xl font-bold text-card-foreground mb-3">Contesto Unico</h3>
              <p className="text-muted-foreground">
                Ogni struttura ha posizione, competitor set, stagionalità e clientela target diversi che richiedono
                strategie specifiche.
              </p>
            </div>

            <div className="bg-card rounded-xl p-8 shadow-md border border-border">
              <Users className="h-12 w-12 text-primary-blue mb-4" />
              <h3 className="text-xl font-bold text-card-foreground mb-3">Team Dedicato</h3>
              <p className="text-muted-foreground">
                Affiancamento diretto con il tuo staff per formazione, implementazione e ottimizzazione continuativa
                delle strategie.
              </p>
            </div>

            <div className="bg-card rounded-xl p-8 shadow-md border border-border">
              <BarChart3 className="h-12 w-12 text-primary-blue mb-4" />
              <h3 className="text-xl font-bold text-card-foreground mb-3">Risultati Misurabili</h3>
              <p className="text-muted-foreground">
                KPI chiari, reporting mensile e adjustment strategico basato su dati reali per garantire ROI concreto.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Our Approach */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center text-foreground mb-12">Il Nostro Approccio Personalizzato</h2>
          <div className="max-w-4xl mx-auto space-y-6">
            {[
              {
                phase: "1. Analisi Completa (Settimana 1-2)",
                description:
                  "Audit 360° della tua struttura: posizionamento, pricing storico, competitor set, canali distribuzione, booking mix, KPI performance.",
                deliverable: "Report completo con analisi SWOT, benchmark competitivo e opportunità identificate",
              },
              {
                phase: "2. Strategia Personalizzata (Settimana 3)",
                description:
                  "Sviluppo piano operativo su misura con obiettivi chiari, timeline implementazione e ROI atteso per ciascuna iniziativa.",
                deliverable: "Roadmap strategica 12 mesi con priorità, investimenti e risultati attesi",
              },
              {
                phase: "3. Implementazione Guidata (Mese 2-3)",
                description:
                  "Affiancamento operativo per setup tecnologie, formazione team, lancio campagne e ottimizzazione processi interni.",
                deliverable: "Training staff, setup tool/software, implementazione prime strategie",
              },
              {
                phase: "4. Ottimizzazione Continuativa (Ongoing)",
                description:
                  "Supporto mensile con review KPI, aggiustamenti strategici, seasonal planning e identificazione nuove opportunità.",
                deliverable: "Report mensili, call strategiche, supporto continuativo via email/telefono",
              },
            ].map((step, index) => (
              <div key={index} className="bg-card rounded-xl p-8 border border-border shadow-md">
                <h3 className="text-xl font-bold text-card-foreground mb-3">{step.phase}</h3>
                <p className="text-muted-foreground mb-4">{step.description}</p>
                <div className="bg-primary-blue/10 rounded-lg p-4">
                  <p className="text-sm font-semibold text-foreground mb-1">Deliverable:</p>
                  <p className="text-sm text-muted-foreground">{step.deliverable}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Included */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center text-foreground mb-12">Cosa Include la Consulenza</h2>
          <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {[
              "Analisi competitor set e posizionamento mercato",
              "Ottimizzazione strategia pricing e yield management",
              "Setup e ottimizzazione canali distribuzione (OTA, metasearch, direct)",
              "Implementazione dynamic pricing con SANTADDEO RMS",
              "Strategie aumento prenotazioni dirette e riduzione commissioni OTA",
              "Email marketing automation e remarketing",
              "Campagne SEM e Social Media advertising",
              "Programmi loyalty e corporate agreements",
              "Formazione staff revenue management",
              "Dashboard KPI e reporting mensile personalizzato",
              "Forecast e budgeting annuale",
              "Supporto continuativo via email, telefono e call mensili",
            ].map((service, index) => (
              <div key={index} className="flex items-start gap-3">
                <CheckCircle2 className="h-6 w-6 text-primary-blue flex-shrink-0 mt-0.5" />
                <span className="text-muted-foreground">{service}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Methods */}
      <section className="py-20 bg-gradient-to-br from-primary-blue to-blue-grey text-white">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-4">Come Possiamo Aiutarti</h2>
          <p className="text-center opacity-90 mb-12 max-w-2xl mx-auto">
            Scegli il modo che preferisci per contattarci. Prima consulenza sempre gratuita.
          </p>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 text-center">
              <Phone className="h-12 w-12 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-3">Chiamata Telefonica</h3>
              <p className="text-sm opacity-90 mb-4">Parliamo subito delle tue esigenze</p>
              <Link href="tel:+390558334567">
                <Button variant="secondary" className="w-full">
                  Chiama Ora
                </Button>
              </Link>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 text-center">
              <MessageCircle className="h-12 w-12 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-3">Richiesta Email</h3>
              <p className="text-sm opacity-90 mb-4">Inviaci le tue domande via form</p>
              <Link href="/#contact">
                <Button variant="secondary" className="w-full">
                  Invia Richiesta
                </Button>
              </Link>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 text-center">
              <Calendar className="h-12 w-12 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-3">Video Call</h3>
              <p className="text-sm opacity-90 mb-4">Prenota una call strategica gratuita</p>
              <Link href="/#contact">
                <Button variant="secondary" className="w-full">
                  Prenota Call
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold text-foreground mb-6">Pronto per Iniziare?</h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            La prima consulenza è gratuita. Analizziamo insieme la tua situazione attuale e ti mostriamo le opportunità
            concrete per aumentare i ricavi del tuo hotel.
          </p>
          <Link href="/#contact">
            <Button size="lg" className="bg-primary-blue hover:bg-primary-blue/90">
              Richiedi Consulenza Gratuita
            </Button>
          </Link>
          <p className="text-sm text-muted-foreground mt-4">Nessun impegno. Zero costi nascosti.</p>
        </div>
      </section>

      <Footer />
    </div>
  )
}
