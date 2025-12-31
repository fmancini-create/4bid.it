import Link from "next/link"
import { Home, TrendingUp, Users, Euro, CheckCircle2, Target, Award, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import Header from "@/components/header"
import Footer from "@/components/footer"
import { LandingPageTracker } from "@/components/landing-page-tracker"
import { ContactButton } from "@/components/contact-button"
import { StructuredData } from "@/components/seo-structured-data"

export const metadata = {
  title: "Revenue Management Bed & Breakfast: Aumenta Ricavi B&B +40% | 4BID.IT",
  description:
    "Revenue management per bed and breakfast e piccole strutture familiari. Strategie pricing B&B, riduzione commissioni OTA, aumento prenotazioni dirette. Solo performance-based.",
  keywords:
    "revenue management bed and breakfast, revenue b&b, pricing bed and breakfast, ottimizzazione tariffe b&b, consulenza bed breakfast, aumento ricavi b&b piccole strutture",
  alternates: {
    canonical: "https://4bid.it/revenue-management-bed-breakfast",
  },
}

export default function RevenueManagementBBPage() {
  return (
    <div className="min-h-screen bg-background">
      <StructuredData
        type="Service"
        title="Revenue Management Bed & Breakfast"
        description="Revenue management per bed and breakfast e piccole strutture familiari. Strategie pricing B&B, riduzione commissioni OTA, aumento prenotazioni dirette."
        url="https://4bid.it/revenue-management-bed-breakfast"
        breadcrumbs={[
          { name: "Home", url: "https://4bid.it" },
          { name: "Revenue Management B&B", url: "https://4bid.it/revenue-management-bed-breakfast" },
        ]}
      />
      <LandingPageTracker slug="revenue-management-bed-breakfast" />

      <Header />

      {/* Hero Section */}
      <section className="pt-32 pb-16 bg-gradient-to-br from-primary-blue/10 via-blue-grey/5 to-background">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Home className="h-8 w-8 text-primary-blue" />
              <span className="text-primary-blue font-semibold">Specialisti per B&B</span>
            </div>
            <h1 className="text-5xl font-bold text-foreground mb-6 text-balance">
              Revenue Management per Bed & Breakfast
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed mb-8 text-pretty">
              Soluzioni di Revenue Management pensate per B&B e piccole strutture familiari. Aumenta i ricavi senza
              perdere la tua autenticità e il rapporto personale con gli ospiti.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <ContactButton size="lg" className="bg-primary-blue hover:bg-primary-blue/90">
                Richiedi Consulenza Gratuita
              </ContactButton>
              <Link href="/progetti/santaddeo">
                <Button size="lg" variant="outline">
                  Scopri SANTADDEO RMS
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Why B&B Need Revenue Management */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center text-foreground mb-12">
            Perché il Revenue Management per il Tuo B&B
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-card rounded-xl p-8 shadow-lg border border-border">
              <Euro className="h-12 w-12 text-primary-blue mb-4" />
              <h3 className="text-2xl font-bold text-card-foreground mb-3">Massimizza i Ricavi</h3>
              <p className="text-muted-foreground">
                Anche con poche camere puoi aumentare significativamente i ricavi applicando le giuste strategie di
                pricing dinamico.
              </p>
            </div>

            <div className="bg-card rounded-xl p-8 shadow-lg border border-border">
              <Calendar className="h-12 w-12 text-primary-blue mb-4" />
              <h3 className="text-2xl font-bold text-card-foreground mb-3">Riduci i Periodi Vuoti</h3>
              <p className="text-muted-foreground">
                Strategie specifiche per riempire bassa stagione e periodi infrasettimanali aumentando l'occupazione
                annuale.
              </p>
            </div>

            <div className="bg-card rounded-xl p-8 shadow-lg border border-border">
              <Award className="h-12 w-12 text-primary-blue mb-4" />
              <h3 className="text-2xl font-bold text-card-foreground mb-3">Compete con gli Hotel</h3>
              <p className="text-muted-foreground">
                Posizionati strategicamente rispetto alla concorrenza alberghiera locale sfruttando i tuoi punti di
                forza unici.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Challenges & Solutions */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center text-foreground mb-12">Le Sfide del Tuo B&B</h2>
          <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto">
            <div className="bg-destructive/10 rounded-2xl p-8 border border-destructive/20">
              <Target className="h-12 w-12 text-destructive mb-4" />
              <h3 className="text-2xl font-bold text-foreground mb-4">Problemi Comuni</h3>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-destructive mt-1">•</span>
                  <span>Tariffe fisse tutto l'anno che non seguono la domanda di mercato</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-destructive mt-1">•</span>
                  <span>Dipendenza eccessiva da Booking.com con commissioni elevate</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-destructive mt-1">•</span>
                  <span>Difficoltà a competere con hotel più grandi e strutturati</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-destructive mt-1">•</span>
                  <span>Scarsa visibilità online e poche prenotazioni dirette</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-destructive mt-1">•</span>
                  <span>Mancanza di tempo per gestire strategia pricing e distribuzione</span>
                </li>
              </ul>
            </div>

            <div className="bg-primary-blue/10 rounded-2xl p-8 border border-primary-blue/20">
              <TrendingUp className="h-12 w-12 text-primary-blue mb-4" />
              <h3 className="text-2xl font-bold text-foreground mb-4">Le Nostre Soluzioni</h3>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary-blue mt-0.5 flex-shrink-0" />
                  <span>Pricing dinamico semplificato adatto a gestione familiare</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary-blue mt-0.5 flex-shrink-0" />
                  <span>Strategie per aumentare prenotazioni dirette e ridurre commissioni OTA</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary-blue mt-0.5 flex-shrink-0" />
                  <span>Posizionamento strategico che valorizza unicità e accoglienza personale</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary-blue mt-0.5 flex-shrink-0" />
                  <span>Ottimizzazione presenza online e gestione recensioni</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary-blue mt-0.5 flex-shrink-0" />
                  <span>Supporto operativo leggero che non sottrae tempo alla gestione ospiti</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Services for B&B */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center text-foreground mb-4">Servizi Pensati per B&B</h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Soluzioni pratiche e facili da implementare, adatte alle esigenze di piccole strutture familiari
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              {
                title: "Pricing Semplificato",
                description:
                  "Tariffe ottimizzate per stagione, giorno della settimana e eventi locali, senza complessità",
              },
              {
                title: "Direct Booking",
                description: "Strategie per aumentare prenotazioni dirette via sito web, email e telefono",
              },
              {
                title: "OTA Management",
                description:
                  "Gestione efficace di Booking.com e Airbnb ottimizzando visibilità e riducendo commissioni",
              },
              {
                title: "Review Management",
                description: "Supporto nella gestione recensioni e reputation online per migliorare ranking",
              },
              {
                title: "Competitive Analysis",
                description: "Monitoraggio prezzi competitor locali per posizionamento strategico",
              },
              {
                title: "Upselling Colazioni",
                description: "Strategie per valorizzare e vendere meglio colazioni, degustazioni e servizi extra",
              },
            ].map((service, index) => (
              <div
                key={index}
                className="bg-card rounded-xl p-6 shadow-md border border-border hover:shadow-lg transition-shadow"
              >
                <Home className="h-8 w-8 text-primary-blue mb-3" />
                <h3 className="text-lg font-bold text-card-foreground mb-2">{service.title}</h3>
                <p className="text-sm text-muted-foreground">{service.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Case Studies */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center text-foreground mb-12">
            Risultati Ottenuti da B&B Come il Tuo
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-card rounded-xl p-8 shadow-lg border border-border">
              <h3 className="text-xl font-bold text-card-foreground mb-2">B&B Centro Storico</h3>
              <p className="text-sm text-muted-foreground mb-6">5 camere, gestione familiare</p>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">RevPAR</span>
                  <span className="text-2xl font-bold text-primary-blue">+38%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Occupazione</span>
                  <span className="text-2xl font-bold text-primary-blue">+12%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Direct Booking</span>
                  <span className="text-2xl font-bold text-primary-blue">+45%</span>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-xl p-8 shadow-lg border border-border">
              <h3 className="text-xl font-bold text-card-foreground mb-2">B&B di Campagna</h3>
              <p className="text-sm text-muted-foreground mb-6">3 camere, immerso nel verde</p>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">RevPAR</span>
                  <span className="text-2xl font-bold text-primary-blue">+42%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">ADR</span>
                  <span className="text-2xl font-bold text-primary-blue">+35%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Ancillary</span>
                  <span className="text-2xl font-bold text-primary-blue">+60%</span>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-xl p-8 shadow-lg border border-border">
              <h3 className="text-xl font-bold text-card-foreground mb-2">B&B di Mare</h3>
              <p className="text-sm text-muted-foreground mb-6">6 camere, vista panoramica</p>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">RevPAR</span>
                  <span className="text-2xl font-bold text-primary-blue">+33%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Occupazione</span>
                  <span className="text-2xl font-bold text-primary-blue">+15%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Commissioni OTA</span>
                  <span className="text-2xl font-bold text-primary-blue">-25%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto bg-gradient-to-br from-primary-blue/5 to-blue-grey/5 rounded-2xl p-10 border border-border">
            <Users className="h-12 w-12 text-primary-blue mb-6" />
            <blockquote className="text-xl text-foreground mb-6 italic">
              "Non pensavo che anche un piccolo B&B come il mio potesse beneficiare del Revenue Management. In 6 mesi ho
              aumentato i ricavi del 40% mantenendo lo stesso livello di accoglienza personale. Il supporto è stato
              fondamentale per capire come valorizzare ciò che rende unico il mio B&B."
            </blockquote>
            <p className="font-semibold text-foreground">Laura Bianchi</p>
            <p className="text-sm text-muted-foreground">Proprietaria B&B Il Giardino Segreto, Firenze</p>
          </div>
        </div>
      </section>

      {/* Pricing Model */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center text-foreground mb-12">Investimento Sostenibile per B&B</h2>
          <div className="max-w-3xl mx-auto bg-gradient-to-br from-primary-blue/10 to-blue-grey/10 rounded-2xl p-10 border-2 border-primary-blue/20">
            <div className="flex items-center gap-3 mb-6">
              <Euro className="h-12 w-12 text-primary-blue" />
              <h3 className="text-2xl font-bold text-foreground">Solo Performance Based</h3>
            </div>
            <p className="text-lg text-muted-foreground mb-6">
              Per i B&B offriamo esclusivamente il modello performance-based: paghi solo una piccola percentuale
              sull'incremento di fatturato, senza costi fissi mensili.
            </p>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary-blue" />
                <span>Zero costi iniziali o canoni fissi mensili</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary-blue" />
                <span>Percentuale contenuta adatta a piccole strutture</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary-blue" />
                <span>Massima trasparenza con reporting mensile semplificato</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary-blue" />
                <span>Contratto flessibile con possibilità di uscita semplificata</span>
              </li>
            </ul>
            <div className="bg-primary-blue/20 rounded-xl p-6 mb-6">
              <p className="text-sm font-semibold text-foreground mb-2">Esempio Concreto</p>
              <p className="text-sm text-muted-foreground">
                B&B con 5 camere, fatturato iniziale €80.000/anno. Dopo 12 mesi: +€24.000 di incremento. Tu paghi solo
                una piccola % su questo incremento, mantenendo la maggior parte dei nuovi ricavi.
              </p>
            </div>
            <ContactButton size="lg" className="w-full bg-primary-blue hover:bg-primary-blue/90">
              Richiedi Analisi Gratuita
            </ContactButton>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-br from-primary-blue to-blue-grey text-white">
        <div className="container mx-auto px-6 text-center">
          <Home className="h-16 w-16 mx-auto mb-6 opacity-90" />
          <h2 className="text-4xl font-bold mb-6">Fai Crescere il Tuo B&B</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90">
            Unisciti ai tanti B&B che hanno scelto il Revenue Management per aumentare ricavi e competitività. La prima
            consulenza è sempre gratuita.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <ContactButton size="lg" variant="secondary">
              Richiedi Consulenza Gratuita
            </ContactButton>
            <Link href="/progetti/santaddeo">
              <Button size="lg" variant="outline" className="text-white border-white hover:bg-white/10 bg-transparent">
                Scopri SANTADDEO RMS
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
