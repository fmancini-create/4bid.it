import Link from "next/link"
import { Sparkles, Clock, Euro, Shield, CheckCircle2, Lightbulb, Users, Rocket } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { LandingPageTracker } from "@/components/landing-page-tracker"
import { StructuredData } from "@/components/seo-structured-data"

export const metadata = {
  title: "Preventivi Progetti Personalizzati Hotel | Soluzioni Su Misura | 4BID.IT",
  description:
    "Richiedi preventivo per progetti personalizzati hotel: software revenue management, gestione manutenzioni, app mobile. Risposta in 24h con fattibilità, costi e tempi.",
  keywords:
    "preventivo software hotel, progetti personalizzati hotel, sviluppo software alberghiero, app hotel su misura, consulenza IT hotel",
}

export default function PreventiviProgettiPersonalizzatiHotelPage() {
  return (
    <div className="min-h-screen bg-background">
      <StructuredData
        type="Service"
        title="Preventivi Progetti Personalizzati Hotel"
        description="Richiedi preventivo per progetti software personalizzati hotel: revenue management, app mobile, gestione manutenzioni. Risposta in 24h."
        url="https://www.4bid.it/preventivi-progetti-personalizzati-hotel"
      />
      <LandingPageTracker slug="preventivi-progetti-personalizzati-hotel" />

      <Header />

      {/* Hero Section */}
      <section className="pt-32 pb-16 bg-gradient-to-br from-primary-blue/10 via-blue-grey/5 to-background">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <Sparkles className="h-16 w-16 mx-auto text-primary-blue mb-6" />
            <h1 className="text-5xl font-bold text-foreground mb-6 text-balance">
              Trasforma la Tua Idea in Realtà per il Tuo Hotel
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed mb-8 text-pretty">
              Descrivi il tuo progetto e in 24 ore ricevi un preventivo dettagliato con fattibilità tecnica, stima costi
              e tempi di sviluppo. Soluzioni software personalizzate per hotel, resort e strutture ricettive.
            </p>
            <div className="bg-card/50 backdrop-blur-sm rounded-xl p-6 mb-8 max-w-2xl mx-auto border border-border/50 text-left">
              <p className="text-sm font-semibold text-primary-blue mb-3">In sintesi:</p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary-blue mt-0.5">•</span>
                  <span>Preventivo gratuito in 24h con fattibilità, costi e timeline dettagliata</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary-blue mt-0.5">•</span>
                  <span>Due modelli: costo fisso (budget certo) o revenue share (zero costo iniziale)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary-blue mt-0.5">•</span>
                  <span>Software custom: RMS, app mobile, gestione manutenzioni, booking engine</span>
                </li>
              </ul>
            </div>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link href="/#contact">
                <Button size="lg" className="bg-primary-blue hover:bg-primary-blue/90">
                  Richiedi Preventivo Gratuito
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Come Funziona */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center text-foreground mb-12">Come Funziona</h2>
          <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-primary-blue/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary-blue">1</span>
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">Descrivi il Progetto</h3>
              <p className="text-muted-foreground">
                Compila il form con la tua idea: problema da risolvere, funzionalità desiderate, obiettivi di business.
                Più dettagli = preventivo più preciso.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-primary-blue/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary-blue">2</span>
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">Ricevi Risposta in 24h</h3>
              <p className="text-muted-foreground">
                Il nostro team analizza la fattibilità tecnica, stima tempi e costi, propone eventuali alternative o
                miglioramenti. Report completo via email.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-primary-blue/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary-blue">3</span>
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">Inizia lo Sviluppo</h3>
              <p className="text-muted-foreground">
                Se il preventivo ti convince, firmiamo il contratto e iniziamo subito. Comunicazione costante, milestone
                settimanali, preview continue.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Modelli di Collaborazione */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center text-foreground mb-4">Modelli di Collaborazione Flessibili</h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Scegliamo insieme il modello che meglio si adatta al tuo progetto e budget
          </p>
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <div className="bg-card rounded-2xl p-8 shadow-lg border border-border">
              <Euro className="h-12 w-12 text-primary-blue mb-4" />
              <h3 className="text-2xl font-bold text-card-foreground mb-3">Progetto a Costo Fisso</h3>
              <p className="text-muted-foreground mb-6">
                Ideale per progetti ben definiti. Preventivo all-inclusive con specifiche dettagliate, milestone e tempi
                certi. Pagamento a step completati.
              </p>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary-blue mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-muted-foreground">Budget definito e garantito</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary-blue mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-muted-foreground">Tempi di consegna certi</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary-blue mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-muted-foreground">Pagamento graduale su milestone</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary-blue mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-muted-foreground">Garanzia 12 mesi inclusa</span>
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-primary-blue to-blue-grey text-white rounded-2xl p-8 shadow-xl">
              <Shield className="h-12 w-12 mb-4 opacity-90" />
              <h3 className="text-2xl font-bold mb-3">Revenue Share Partnership</h3>
              <p className="mb-6 opacity-90">
                Per progetti innovativi con grande potenziale. Sviluppiamo il software con investimento ridotto o zero
                da parte tua, in cambio di una percentuale sui ricavi futuri.
              </p>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-white mt-0.5 flex-shrink-0" />
                  <span className="text-sm opacity-90">Costo iniziale minimo o zero</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-white mt-0.5 flex-shrink-0" />
                  <span className="text-sm opacity-90">Condividiamo rischi e successi</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-white mt-0.5 flex-shrink-0" />
                  <span className="text-sm opacity-90">Supporto tecnico long-term incluso</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-white mt-0.5 flex-shrink-0" />
                  <span className="text-sm opacity-90">Partnership strategica duratura</span>
                </li>
              </ul>
            </div>
          </div>
          <p className="text-center text-muted-foreground mt-8 max-w-2xl mx-auto">
            Valutiamo insieme quale modello si adatta meglio al tuo progetto. In alcuni casi proponiamo soluzioni ibride
            per ottimizzare investimento e risultati.
          </p>
        </div>
      </section>

      {/* Cosa Includiamo */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center text-foreground mb-12">Cosa Include il Nostro Preventivo</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              {
                icon: Lightbulb,
                title: "Analisi Fattibilità",
                description: "Studio tecnico completo per verificare se e come possiamo realizzare il tuo progetto",
              },
              {
                icon: Clock,
                title: "Timeline Dettagliata",
                description: "Tempi stimati per ogni fase: design, sviluppo, test, deploy e formazione team",
              },
              {
                icon: Euro,
                title: "Breakdown Costi",
                description: "Suddivisione costi per fase, risorse, tecnologie e eventuali servizi esterni",
              },
              {
                icon: Users,
                title: "Team Dedicato",
                description: "Chi lavorerà al progetto: developer, designer, project manager, revenue manager",
              },
              {
                icon: Rocket,
                title: "Tecnologie Proposte",
                description: "Stack tecnologico consigliato e motivazioni delle scelte architetturali",
              },
              {
                icon: Shield,
                title: "Garanzie e Supporto",
                description: "Periodo di garanzia, SLA supporto post-lancio e piani di manutenzione",
              },
            ].map((item, index) => (
              <div
                key={index}
                className="bg-card rounded-xl p-6 shadow-md border border-border hover:shadow-lg transition-shadow"
              >
                <item.icon className="h-10 w-10 text-primary-blue mb-4" />
                <h3 className="text-lg font-bold text-card-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Progetti di Esempio */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center text-foreground mb-12">Progetti che Realizziamo</h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {[
              {
                title: "Software Revenue Management Custom",
                description:
                  "RMS personalizzato per la tua catena alberghiera con integrazioni PMS esistente, pricing dinamico, forecasting AI e dashboard real-time.",
                examples: [
                  "SANTADDEO per 15+ hotel",
                  "RMS cloud-based per resort",
                  "Pricing engine per boutique hotel",
                ],
              },
              {
                title: "App Mobile per Ospiti",
                description:
                  "App branded per iOS/Android con check-in digitale, room service, concierge virtuale, esperienze personalizzate e loyalty program integrato.",
                examples: ["App 5* per resort Toscana", "Mobile concierge multilingua", "Gamification loyalty program"],
              },
              {
                title: "Gestione Manutenzioni e Facility",
                description:
                  "Piattaforma per gestire interventi, preventive maintenance, inventario, fornitori esterni con chatbot WhatsApp per richieste staff.",
                examples: [
                  "Manubot per 200+ camere",
                  "Sistema preventive maintenance",
                  "Integration con ERP esistente",
                ],
              },
              {
                title: "Portali Web e Booking Engine",
                description:
                  "Siti responsive ottimizzati SEO con booking engine commission-free, gestione disponibilità real-time, upselling automatico e payment gateway.",
                examples: ["Booking engine 0% commissioni", "Sito multilingua 12 lingue", "CMS per gestione contenuti"],
              },
            ].map((project, index) => (
              <div
                key={index}
                className="bg-card rounded-xl p-8 shadow-lg border border-border hover:shadow-xl transition-all"
              >
                <h3 className="text-2xl font-bold text-card-foreground mb-3">{project.title}</h3>
                <p className="text-muted-foreground mb-6">{project.description}</p>
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-foreground">Esempi Realizzati:</p>
                  {project.examples.map((example, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary-blue flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">{example}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-br from-primary-blue to-blue-grey text-white">
        <div className="container mx-auto px-6 text-center">
          <Sparkles className="h-16 w-16 mx-auto mb-6 opacity-90" />
          <h2 className="text-4xl font-bold mb-6">Trasforma la Tua Idea in un Progetto Concreto</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90">
            Descrivi il tuo progetto compilando il form contatti. Riceverai un preventivo dettagliato entro 24 ore con
            fattibilità, costi, tempi e modalità di collaborazione.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/#contact">
              <Button size="lg" variant="secondary" className="bg-white text-primary-blue hover:bg-white/90">
                Richiedi Preventivo Gratuito
              </Button>
            </Link>
          </div>
          <p className="text-sm mt-6 opacity-75">
            Zero impegno • Risposta garantita in 24h • Consulenza iniziale gratuita
          </p>
        </div>
      </section>

      <Footer />
    </div>
  )
}
