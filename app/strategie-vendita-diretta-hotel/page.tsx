import Link from "next/link"
import { Target, TrendingUp, Users, CheckCircle2, Euro, Zap, Award, ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"
import Header from "@/components/header"
import Footer from "@/components/footer"
import { LandingPageTracker } from "@/components/landing-page-tracker"
import { StructuredData } from "@/components/seo-structured-data"

export const metadata = {
  title: "Strategie Vendita Diretta Hotel | Disintermediazione OTA | 4BID.IT",
  description:
    "Aumenta le vendite dirette del tuo hotel riducendo la dipendenza da OTA. Strategie, strumenti e tecniche di disintermediazione per massimizzare i margini.",
  keywords:
    "vendita diretta hotel, disintermediazione hotel, vendere senza OTA, direct selling hotel, strategie vendita hotel, booking diretto",
}

export default function StrategieVenditaDirettaHotelPage() {
  return (
    <div className="min-h-screen bg-background">
      <StructuredData
        type="Article"
        title="Strategie Vendita Diretta Hotel"
        description="Aumenta le vendite dirette del tuo hotel riducendo la dipendenza da OTA. Strategie, strumenti e tecniche di disintermediazione."
        url="https://www.4bid.it/strategie-vendita-diretta-hotel"
      />
      <LandingPageTracker slug="strategie-vendita-diretta-hotel" />

      <Header />

      {/* Hero Section */}
      <section className="pt-32 pb-16 bg-gradient-to-br from-primary-blue/10 via-blue-grey/5 to-background">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl font-bold text-foreground mb-6 text-balance">
              Strategie di Vendita Diretta per Hotel: Massimizza i Margini
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed mb-8 text-pretty">
              Riduci la dipendenza dalle OTA e aumenta le vendite dirette attraverso strategie comprovate di
              disintermediazione. Più controllo, più margini, più profitti.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link href="/#contact">
                <Button size="lg" className="bg-primary-blue hover:bg-primary-blue/90">
                  Richiedi Piano Personalizzato
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

      {/* Problema Dipendenza OTA */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center text-foreground mb-12">La Trappola delle OTA</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-destructive/10 rounded-xl p-8 shadow-lg border border-destructive/30">
              <Euro className="h-12 w-12 text-destructive mb-4" />
              <h3 className="text-2xl font-bold text-destructive mb-3">18-25%</h3>
              <p className="text-muted-foreground">
                Commissioni medie per prenotazione. Su 100€ di tariffa, paghi fino a 25€ alla piattaforma.
              </p>
            </div>

            <div className="bg-destructive/10 rounded-xl p-8 shadow-lg border border-destructive/30">
              <Users className="h-12 w-12 text-destructive mb-4" />
              <h3 className="text-2xl font-bold text-destructive mb-3">Zero</h3>
              <p className="text-muted-foreground">
                Controllo sui clienti. Le OTA possiedono il database e il rapporto diretto con i tuoi ospiti.
              </p>
            </div>

            <div className="bg-destructive/10 rounded-xl p-8 shadow-lg border border-destructive/30">
              <TrendingUp className="h-12 w-12 text-destructive mb-4" />
              <h3 className="text-2xl font-bold text-destructive mb-3">+8%/anno</h3>
              <p className="text-muted-foreground">
                Le commissioni OTA aumentano costantemente, erodendo i margini sempre di più ogni anno.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Vantaggi Vendita Diretta */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center text-foreground mb-12">
            Perché Investire sulla Vendita Diretta
          </h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <div className="bg-card rounded-2xl p-8 border border-border shadow-md">
              <Target className="h-12 w-12 text-primary-blue mb-4" />
              <h3 className="text-2xl font-bold text-card-foreground mb-4">Margini Più Alti</h3>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary-blue mt-0.5 flex-shrink-0" />
                  <span>Zero commissioni: ogni prenotazione diretta vale 20-25% in più</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary-blue mt-0.5 flex-shrink-0" />
                  <span>Possibilità di investire i risparmi in marketing diretto e miglioramenti</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary-blue mt-0.5 flex-shrink-0" />
                  <span>ROI positivo già dal primo anno di implementazione strategia</span>
                </li>
              </ul>
            </div>

            <div className="bg-card rounded-2xl p-8 border border-border shadow-md">
              <Award className="h-12 w-12 text-primary-blue mb-4" />
              <h3 className="text-2xl font-bold text-card-foreground mb-4">Controllo Totale</h3>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary-blue mt-0.5 flex-shrink-0" />
                  <span>Database clienti proprietario per campagne di fidelizzazione</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary-blue mt-0.5 flex-shrink-0" />
                  <span>Comunicazione diretta pre e post soggiorno senza intermediari</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary-blue mt-0.5 flex-shrink-0" />
                  <span>Upselling e cross-selling di servizi extra direttamente al cliente</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Strategie */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center text-foreground mb-4">Le 8 Strategie Fondamentali</h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Un approccio multi-canale per costruire un sistema di vendita diretta sostenibile
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: ShoppingCart,
                title: "Booking Engine Ottimizzato",
                description: "UX frictionless, mobile-first, instant confirmation, zero passaggi inutili",
              },
              {
                icon: Target,
                title: "Best Rate Guarantee",
                description: "Miglior tariffa garantita + vantaggi esclusivi sul sito diretto",
              },
              {
                icon: Zap,
                title: "Google Hotel Ads",
                description: "Metasearch con commissioni ridotte (3-12%) vs OTA tradizionali",
              },
              {
                icon: TrendingUp,
                title: "SEO & Content",
                description: "Posizionamento organico su keyword geo e long-tail turistiche",
              },
              {
                icon: Users,
                title: "Email Marketing",
                description: "Automation per remarketing, carrelli abbandonati, offerte esclusive",
              },
              {
                icon: Award,
                title: "Loyalty Program",
                description: "Programma fedeltà con punti, sconti e privilegi per clienti diretti",
              },
              {
                icon: Target,
                title: "Social Advertising",
                description: "Facebook e Instagram Ads con retargeting e lookalike audiences",
              },
              {
                icon: CheckCircle2,
                title: "Corporate B2B",
                description: "Convenzioni aziendali e portali corporate per prenotazioni ricorrenti",
              },
            ].map((strategy, index) => (
              <div
                key={index}
                className="bg-card rounded-xl p-6 shadow-md border border-border hover:shadow-lg transition-shadow"
              >
                <strategy.icon className="h-10 w-10 text-primary-blue mb-3" />
                <h3 className="text-lg font-bold text-card-foreground mb-2">{strategy.title}</h3>
                <p className="text-sm text-muted-foreground">{strategy.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Case Study */}
      <section className="py-20 bg-gradient-to-br from-primary-blue to-blue-grey text-white">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-4">Case Study: Hotel Boutique Firenze</h2>
          <p className="text-center opacity-90 mb-12">25 camere, centro storico, clientela leisure internazionale</p>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-12">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8">
              <p className="text-sm opacity-80 mb-4">Situazione Iniziale</p>
              <div className="space-y-4">
                <div>
                  <p className="text-3xl font-bold">15%</p>
                  <p className="text-sm">Vendite Dirette (solo telefono)</p>
                </div>
                <div>
                  <p className="text-3xl font-bold">85%</p>
                  <p className="text-sm">Booking.com + Expedia</p>
                </div>
                <div>
                  <p className="text-3xl font-bold">€42K</p>
                  <p className="text-sm">Commissioni annue pagate</p>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8">
              <p className="text-sm opacity-80 mb-4">Dopo 18 Mesi</p>
              <div className="space-y-4">
                <div>
                  <p className="text-3xl font-bold text-accent">72%</p>
                  <p className="text-sm">Vendite Dirette (+57%)</p>
                </div>
                <div>
                  <p className="text-3xl font-bold">28%</p>
                  <p className="text-sm">Booking.com + Expedia</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-accent">€12K</p>
                  <p className="text-sm">Commissioni annue (-71%)</p>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center bg-white/10 backdrop-blur-sm rounded-xl p-8 max-w-2xl mx-auto">
            <p className="text-2xl font-bold mb-2">Risparmio Netto: €30.000/anno</p>
            <p className="text-sm opacity-80">
              Investimento totale in strategia di vendita diretta: €8.500 • ROI: 352% primo anno
            </p>
          </div>
        </div>
      </section>

      {/* Implementation Roadmap */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center text-foreground mb-12">Roadmap di Implementazione</h2>
          <div className="max-w-3xl mx-auto space-y-6">
            {[
              {
                fase: "Fase 1: Foundation (0-2 mesi)",
                obiettivi: [
                  "Audit booking engine e checkout process",
                  "Setup Google Hotel Ads e TripAdvisor",
                  "Implementazione tracking e analytics",
                  "Attivazione email automation",
                ],
              },
              {
                fase: "Fase 2: Activation (3-6 mesi)",
                obiettivi: [
                  "Launch campagne SEM brand + geo",
                  "Social advertising con retargeting",
                  "Best rate guarantee + vantaggi esclusivi",
                  "SEO on-page e content marketing",
                ],
              },
              {
                fase: "Fase 3: Growth (7-12 mesi)",
                obiettivi: [
                  "Loyalty program e corporate agreements",
                  "Espansione canali advertising",
                  "A/B testing continuo e ottimizzazione",
                  "Scaling budget sui canali più performanti",
                ],
              },
            ].map((roadmap, index) => (
              <div key={index} className="bg-card rounded-xl p-8 border border-border shadow-md">
                <h3 className="text-xl font-bold text-card-foreground mb-4">{roadmap.fase}</h3>
                <ul className="space-y-2">
                  {roadmap.obiettivi.map((obiettivo, i) => (
                    <li key={i} className="flex items-start gap-2 text-muted-foreground">
                      <CheckCircle2 className="h-5 w-5 text-primary-blue mt-0.5 flex-shrink-0" />
                      <span>{obiettivo}</span>
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
          <h2 className="text-4xl font-bold text-foreground mb-6">Pronto a Ridurre le Commissioni OTA?</h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Richiedi un'analisi gratuita del tuo booking mix. Ti mostreremo quanto puoi risparmiare e come costruire un
            sistema di vendita diretta sostenibile.
          </p>
          <Link href="/#contact">
            <Button size="lg" className="bg-primary-blue hover:bg-primary-blue/90">
              Richiedi Analisi Gratuita
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  )
}
