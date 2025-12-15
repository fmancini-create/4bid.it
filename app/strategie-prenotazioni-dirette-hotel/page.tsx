import Link from "next/link"
import { Target, MousePointerClick, BarChart3, CheckCircle2, Euro, Percent, Award } from "lucide-react"
import { Button } from "@/components/ui/button"
import Header from "@/components/header"
import Footer from "@/components/footer"
import { LandingPageTracker } from "@/components/landing-page-tracker"

export const metadata = {
  title: "Strategie Prenotazioni Dirette Hotel | Ridurre Commissioni OTA | 4BID.IT",
  description:
    "Aumenta le prenotazioni dirette del tuo hotel e riduci le commissioni OTA fino al 50%. Strategie di direct booking e disintermediazione per hotel e strutture ricettive.",
  keywords:
    "prenotazioni dirette hotel, direct booking, ridurre commissioni OTA, disintermediazione hotel, strategie prenotazioni, booking engine, revenue management",
}

export default function StrategiePrenotazioniDiretteHotelPage() {
  return (
    <div className="min-h-screen bg-background">
      <LandingPageTracker slug="strategie-prenotazioni-dirette-hotel" />

      <Header />

      {/* Hero Section */}
      <section className="pt-32 pb-16 bg-gradient-to-br from-primary-blue/10 via-blue-grey/5 to-background">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl font-bold text-foreground mb-6 text-balance">
              Aumenta le Prenotazioni Dirette e Riduci le Commissioni OTA
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed mb-8 text-pretty">
              Strategie comprovate di disintermediazione per hotel e strutture ricettive. Trasforma le OTA da canale
              principale a canale accessorio, aumentando margini e controllo sul cliente.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link href="/#contact">
                <Button size="lg" className="bg-primary-blue hover:bg-primary-blue/90">
                  Richiedi Consulenza Gratuita
                </Button>
              </Link>
              <Link href="/progetti/santaddeo">
                <Button size="lg" variant="outline">
                  Scopri SANTADDEO RMS
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Costs */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center text-foreground mb-4">Il Problema delle Commissioni OTA</h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Le OTA offrono visibilità ma erodono pesantemente i tuoi margini di profitto
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-destructive/10 rounded-xl p-8 shadow-lg border border-destructive/30">
              <Percent className="h-12 w-12 text-destructive mb-4" />
              <h3 className="text-3xl font-bold text-destructive mb-3">15-25%</h3>
              <p className="text-muted-foreground">
                Commissioni medie OTA su ogni prenotazione. Su 100€, paghi fino a 25€ alla piattaforma.
              </p>
            </div>

            <div className="bg-destructive/10 rounded-xl p-8 shadow-lg border border-destructive/30">
              <Euro className="h-12 w-12 text-destructive mb-4" />
              <h3 className="text-3xl font-bold text-destructive mb-3">€50K+</h3>
              <p className="text-muted-foreground">
                Costo medio annuo in commissioni per un hotel di 30 camere con occupancy media del 70%.
              </p>
            </div>

            <div className="bg-destructive/10 rounded-xl p-8 shadow-lg border border-destructive/30">
              <Target className="h-12 w-12 text-destructive mb-4" />
              <h3 className="text-3xl font-bold text-destructive mb-3">0%</h3>
              <p className="text-muted-foreground">
                Controllo sui dati del cliente. Le OTA possiedono il rapporto diretto con i tuoi ospiti.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Direct Booking Benefits */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center text-foreground mb-12">
            I Vantaggi delle Prenotazioni Dirette
          </h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <div className="bg-card rounded-2xl p-8 border border-border shadow-md">
              <MousePointerClick className="h-12 w-12 text-primary-blue mb-4" />
              <h3 className="text-2xl font-bold text-card-foreground mb-4">Margini Più Alti</h3>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary-blue mt-0.5 flex-shrink-0" />
                  <span>Zero commissioni: ogni euro incassato va direttamente alla tua struttura</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary-blue mt-0.5 flex-shrink-0" />
                  <span>Possibilità di offrire tariffe scontate mantenendo margini più alti delle OTA</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary-blue mt-0.5 flex-shrink-0" />
                  <span>Flessibilità nel creare pacchetti speciali e offerte last-minute</span>
                </li>
              </ul>
            </div>

            <div className="bg-card rounded-2xl p-8 border border-border shadow-md">
              <Award className="h-12 w-12 text-primary-blue mb-4" />
              <h3 className="text-2xl font-bold text-card-foreground mb-4">Controllo Clienti</h3>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary-blue mt-0.5 flex-shrink-0" />
                  <span>Database clienti proprietario per remarketing e loyalty programs</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary-blue mt-0.5 flex-shrink-0" />
                  <span>Comunicazione diretta pre e post soggiorno per upselling e cross-selling</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary-blue mt-0.5 flex-shrink-0" />
                  <span>Riduzione della dipendenza dalle piattaforme OTA</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Strategies */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center text-foreground mb-4">Le Nostre Strategie di Direct Booking</h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Un piano completo per aumentare le prenotazioni dirette e ridurre la dipendenza dalle OTA
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: "Rate Parity Strategy",
                description:
                  "Best rate guarantee sul sito diretto con vantaggi esclusivi (colazione inclusa, upgrade, late check-out)",
              },
              {
                title: "Metasearch Marketing",
                description: "Presenza su Google Hotel Ads e TripAdvisor con commissioni più basse delle OTA (3-15%)",
              },
              {
                title: "SEO & SEM",
                description: "Ottimizzazione organica e campagne Google Ads per brand e keyword geolocalizzate",
              },
              {
                title: "Booking Engine Optimization",
                description: "UX ottimizzata, process a 2 step, mobile-first, instant confirmation, zero frizioni",
              },
              {
                title: "Email Marketing",
                description:
                  "Automation per pre-arrivo, remarketing carrelli abbandonati, offerte esclusive ai clienti passati",
              },
              {
                title: "Social Media",
                description:
                  "Instagram e Facebook Ads con targeting geolocalizzato e retargeting pixel del booking engine",
              },
              {
                title: "Loyalty Program",
                description:
                  "Programma fedeltà con punti, sconti progressivi e privilegi esclusivi per chi prenota diretto",
              },
              {
                title: "Corporate Agreements",
                description:
                  "Convenzioni dirette con aziende locali e portali B2B per prenotazioni business ricorrenti",
              },
              {
                title: "Content Marketing",
                description: "Blog, guide turistiche locali, eventi e attrazioni per posizionamento organico long-tail",
              },
            ].map((strategy, index) => (
              <div
                key={index}
                className="bg-card rounded-xl p-6 shadow-md border border-border hover:shadow-lg transition-shadow"
              >
                <BarChart3 className="h-8 w-8 text-primary-blue mb-3" />
                <h3 className="text-lg font-bold text-card-foreground mb-2">{strategy.title}</h3>
                <p className="text-sm text-muted-foreground">{strategy.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Results */}
      <section className="py-20 bg-gradient-to-br from-primary-blue to-blue-grey text-white">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-12">Risultati Clienti: Da 20% a 65% Direct Booking</h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-12">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8">
              <p className="text-sm opacity-80 mb-2">Prima della Strategia</p>
              <div className="space-y-4">
                <div>
                  <p className="text-2xl font-bold">20%</p>
                  <p className="text-sm">Prenotazioni Dirette</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">80%</p>
                  <p className="text-sm">Prenotazioni OTA</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">€48K</p>
                  <p className="text-sm">Commissioni annue</p>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8">
              <p className="text-sm opacity-80 mb-2">Dopo 12 Mesi</p>
              <div className="space-y-4">
                <div>
                  <p className="text-2xl font-bold text-accent">65%</p>
                  <p className="text-sm">Prenotazioni Dirette (+45%)</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">35%</p>
                  <p className="text-sm">Prenotazioni OTA (-45%)</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-accent">€17K</p>
                  <p className="text-sm">Commissioni annue (-64%)</p>
                </div>
              </div>
            </div>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">Risparmio Netto: €31.000/anno</p>
            <p className="text-sm opacity-80 mt-2">Hotel 30 camere, 70% occupancy media</p>
          </div>
        </div>
      </section>

      {/* Implementation Plan */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center text-foreground mb-12">Piano di Implementazione</h2>
          <div className="max-w-3xl mx-auto space-y-6">
            {[
              {
                phase: "Mese 1-2: Audit & Setup",
                actions: [
                  "Audit completo booking engine e UX",
                  "Implementazione metasearch (Google Hotel Ads, TripAdvisor)",
                  "Setup tracking analytics e attribution model",
                  "Configurazione email automation e remarketing",
                ],
              },
              {
                phase: "Mese 3-4: Launch Campaigns",
                actions: [
                  "Attivazione campagne SEM brand e geo",
                  "Social media advertising con retargeting pixel",
                  "Best rate guarantee e vantaggi esclusivi sito diretto",
                  "Content marketing e blog SEO",
                ],
              },
              {
                phase: "Mese 5-12: Optimization & Scaling",
                actions: [
                  "A/B testing landing pages e checkout process",
                  "Espansione loyalty program e corporate agreements",
                  "Ottimizzazione bidding metasearch e SEM",
                  "Reporting mensile e strategia evolutiva",
                ],
              },
            ].map((plan, index) => (
              <div key={index} className="bg-card rounded-xl p-8 border border-border shadow-md">
                <h3 className="text-xl font-bold text-card-foreground mb-4">{plan.phase}</h3>
                <ul className="space-y-2">
                  {plan.actions.map((action, i) => (
                    <li key={i} className="flex items-start gap-2 text-muted-foreground">
                      <CheckCircle2 className="h-5 w-5 text-primary-blue mt-0.5 flex-shrink-0" />
                      <span>{action}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold text-foreground mb-6">Vuoi Ridurre le Commissioni OTA del Tuo Hotel?</h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Richiedi una consulenza gratuita. Analizzeremo il tuo booking mix attuale e ti mostreremo quanto puoi
            risparmiare aumentando le prenotazioni dirette.
          </p>
          <Link href="/#contact">
            <Button size="lg" className="bg-primary-blue hover:bg-primary-blue/90">
              Richiedi Consulenza Gratuita
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  )
}
