import Link from "next/link"
import { Target, MapPin, Users, CheckCircle2, Euro, Award, BarChart3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import Header from "@/components/header"
import Footer from "@/components/footer"
import { LandingPageTracker } from "@/components/landing-page-tracker"
import { StructuredData } from "@/components/seo-structured-data"

export const metadata = {
  title: "Revenue Manager Hotel Toscana | Consulenza Firenze, Siena, Pisa | 4BID.IT",
  description:
    "Revenue Manager specializzato in hotel in Toscana. Consulenza Revenue Management a Firenze, Siena, Pisa e tutta la Toscana. Aumenta i ricavi del tuo hotel con un esperto locale.",
  keywords:
    "revenue manager toscana, revenue manager firenze, consulenza hotel toscana, revenue management firenze, revenue manager siena, consulente alberghiero toscana",
}

export default function RevenueManagerHotelToscanaPage() {
  return (
    <div className="min-h-screen bg-background">
      <StructuredData
        type="Service"
        title="Revenue Manager Hotel Toscana"
        description="Revenue Manager specializzato in hotel in Toscana. Consulenza Revenue Management a Firenze, Siena, Pisa e tutta la Toscana."
        url="https://www.4bid.it/revenue-manager-hotel-toscana"
      />
      <LandingPageTracker slug="revenue-manager-hotel-toscana" />

      <Header />

      {/* Hero Section */}
      <section className="pt-32 pb-16 bg-gradient-to-br from-primary-blue/10 via-blue-grey/5 to-background">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <MapPin className="h-6 w-6 text-primary-blue" />
              <span className="text-primary-blue font-semibold">Toscana - Firenze - Siena - Pisa</span>
            </div>
            <h1 className="text-5xl font-bold text-foreground mb-6 text-balance">
              Revenue Manager per Hotel in Toscana
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed mb-8 text-pretty">
              Esperto di Revenue Management specializzato nel mercato alberghiero toscano. Conoscenza approfondita del
              territorio, eventi locali e flussi turistici per massimizzare i ricavi del tuo hotel.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link href="/#contact">
                <Button size="lg" className="bg-primary-blue hover:bg-primary-blue/90">
                  Contatta il Revenue Manager
                </Button>
              </Link>
              <Link href="/consulenza-revenue-management-hotel">
                <Button size="lg" variant="outline">
                  Scopri i Servizi
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Expertise Locale */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center text-foreground mb-4">Perché un Revenue Manager Locale?</h2>
          <p className="text-center text-muted-foreground mb-12 max-w-3xl mx-auto">
            La conoscenza del territorio toscano è fondamentale per strategie di pricing efficaci
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-card rounded-xl p-8 shadow-lg border border-border">
              <MapPin className="h-12 w-12 text-primary-blue mb-4" />
              <h3 className="text-2xl font-bold text-card-foreground mb-3">Conoscenza del Mercato</h3>
              <p className="text-muted-foreground mb-4">
                Esperienza diretta sui flussi turistici di Firenze, Chianti, Val d'Orcia, Versilia e tutte le zone
                turistiche toscane.
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary-blue mt-0.5 flex-shrink-0" />
                  <span>Peak season e bassa stagione per zona</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary-blue mt-0.5 flex-shrink-0" />
                  <span>Segmenti turistici prevalenti</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary-blue mt-0.5 flex-shrink-0" />
                  <span>Tendenze mercato locale</span>
                </li>
              </ul>
            </div>

            <div className="bg-card rounded-xl p-8 shadow-lg border border-border">
              <Target className="h-12 w-12 text-primary-blue mb-4" />
              <h3 className="text-2xl font-bold text-card-foreground mb-3">Eventi e Manifestazioni</h3>
              <p className="text-muted-foreground mb-4">
                Calendario completo di tutti gli eventi che impattano la domanda alberghiera in Toscana.
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary-blue mt-0.5 flex-shrink-0" />
                  <span>Fiere e congressi (Pitti, Vinitaly)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary-blue mt-0.5 flex-shrink-0" />
                  <span>Eventi culturali (Palio, Festival)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary-blue mt-0.5 flex-shrink-0" />
                  <span>Eventi sportivi e manifestazioni</span>
                </li>
              </ul>
            </div>

            <div className="bg-card rounded-xl p-8 shadow-lg border border-border">
              <Users className="h-12 w-12 text-primary-blue mb-4" />
              <h3 className="text-2xl font-bold text-card-foreground mb-3">Network Professionale</h3>
              <p className="text-muted-foreground mb-4">
                Relazioni consolidate con associazioni di categoria e operatori turistici della Toscana.
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary-blue mt-0.5 flex-shrink-0" />
                  <span>Federalberghi Toscana</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary-blue mt-0.5 flex-shrink-0" />
                  <span>Convention Bureau locali</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary-blue mt-0.5 flex-shrink-0" />
                  <span>Tour operator specializzati</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Zone di Intervento */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center text-foreground mb-12">Zone di Intervento in Toscana</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              { citta: "Firenze", descrizione: "Città d'arte, business travel, fiere" },
              { citta: "Siena", descrizione: "Turismo culturale, Palio, eventi" },
              { citta: "Pisa", descrizione: "Turismo internazionale, aeroporto" },
              { citta: "Chianti", descrizione: "Agriturismi, wine tourism, relais" },
              { citta: "Val d'Orcia", descrizione: "Turismo di lusso, resort, spa" },
              { citta: "Versilia", descrizione: "Turismo balneare, stagionalità estiva" },
              { citta: "Lucca", descrizione: "Eventi culturali, turismo d'arte" },
              { citta: "Arezzo", descrizione: "Business, turismo culturale" },
              { citta: "San Gimignano", descrizione: "UNESCO, turismo internazionale" },
            ].map((zona, index) => (
              <div key={index} className="bg-card rounded-lg p-6 shadow-md border border-border">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-primary-blue mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-bold text-card-foreground mb-1">{zona.citta}</h3>
                    <p className="text-sm text-muted-foreground">{zona.descrizione}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Servizi Specializzati */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center text-foreground mb-4">Servizi Specializzati per la Toscana</h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Strategie di Revenue Management calibrate sulle specificità del mercato alberghiero toscano
          </p>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-gradient-to-br from-primary-blue/10 to-blue-grey/10 rounded-xl p-8 border border-primary-blue/20">
              <BarChart3 className="h-10 w-10 text-primary-blue mb-4" />
              <h3 className="text-xl font-bold text-foreground mb-4">Event-Based Pricing</h3>
              <p className="text-muted-foreground mb-4">
                Strategie di pricing dinamico sincronizzate con gli eventi locali che impattano la domanda.
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary-blue mt-0.5 flex-shrink-0" />
                  <span>Pitti Uomo e Pitti Bimbo (Firenze)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary-blue mt-0.5 flex-shrink-0" />
                  <span>Palio di Siena (Luglio e Agosto)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary-blue mt-0.5 flex-shrink-0" />
                  <span>Lucca Comics & Games</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary-blue mt-0.5 flex-shrink-0" />
                  <span>Festival e manifestazioni culturali</span>
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-yellow/10 to-yellow/5 rounded-xl p-8 border border-yellow/20">
              <Target className="h-10 w-10 text-yellow mb-4" />
              <h3 className="text-xl font-bold text-foreground mb-4">Analisi Competitiva Locale</h3>
              <p className="text-muted-foreground mb-4">
                Monitoraggio continuo dei competitor nella tua zona geografica con benchmark di mercato.
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-yellow mt-0.5 flex-shrink-0" />
                  <span>Competitive set personalizzato</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-yellow mt-0.5 flex-shrink-0" />
                  <span>Rate shopping quotidiano</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-yellow mt-0.5 flex-shrink-0" />
                  <span>Analisi posizionamento OTA</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-yellow mt-0.5 flex-shrink-0" />
                  <span>Report mensili con KPI</span>
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-primary-blue/10 to-blue-grey/10 rounded-xl p-8 border border-primary-blue/20">
              <Euro className="h-10 w-10 text-primary-blue mb-4" />
              <h3 className="text-xl font-bold text-foreground mb-4">Gestione Stagionalità</h3>
              <p className="text-muted-foreground mb-4">
                Ottimizzazione delle tariffe per gestire l'alta stagionalità tipica del turismo toscano.
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary-blue mt-0.5 flex-shrink-0" />
                  <span>Peak season: Primavera e Autunno</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary-blue mt-0.5 flex-shrink-0" />
                  <span>Strategie per bassa stagione</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary-blue mt-0.5 flex-shrink-0" />
                  <span>Shoulder season optimization</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary-blue mt-0.5 flex-shrink-0" />
                  <span>Length of Stay strategies</span>
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-yellow/10 to-yellow/5 rounded-xl p-8 border border-yellow/20">
              <Award className="h-10 w-10 text-yellow mb-4" />
              <h3 className="text-xl font-bold text-foreground mb-4">Distribuzione Online</h3>
              <p className="text-muted-foreground mb-4">
                Ottimizzazione della presenza online sui canali più rilevanti per il mercato toscano.
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-yellow mt-0.5 flex-shrink-0" />
                  <span>Booking.com e Expedia optimization</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-yellow mt-0.5 flex-shrink-0" />
                  <span>Direct booking strategies</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-yellow mt-0.5 flex-shrink-0" />
                  <span>Google Hotel Ads setup</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-yellow mt-0.5 flex-shrink-0" />
                  <span>Riduzione commissioni OTA</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Case Study Toscana */}
      <section className="py-20 bg-gradient-to-br from-primary-blue to-blue-grey text-white">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-12">Case Study: Boutique Hotel Chianti</h2>
          <div className="max-w-4xl mx-auto">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8">
              <p className="text-lg mb-8">
                Boutique hotel 15 camere nel cuore del Chianti. Obiettivo: aumentare ADR e RevPAR mantenendo alto il
                tasso di occupazione durante tutto l'anno.
              </p>
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white/10 rounded-xl p-6 text-center">
                  <p className="text-4xl font-bold mb-2">+43%</p>
                  <p className="text-sm">RevPAR in 12 mesi</p>
                </div>
                <div className="bg-white/10 rounded-xl p-6 text-center">
                  <p className="text-4xl font-bold mb-2">+35%</p>
                  <p className="text-sm">ADR medio annuale</p>
                </div>
                <div className="bg-white/10 rounded-xl p-6 text-center">
                  <p className="text-4xl font-bold mb-2">88%</p>
                  <p className="text-sm">Occupazione media</p>
                </div>
              </div>
              <div className="border-t border-white/20 pt-6">
                <h4 className="font-bold mb-4">Strategie Implementate:</h4>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 mt-0.5 flex-shrink-0" />
                    <span>Dynamic pricing basato su eventi vinicoli e sagre locali</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 mt-0.5 flex-shrink-0" />
                    <span>Pacchetti esperienziali (degustazioni, cooking class)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 mt-0.5 flex-shrink-0" />
                    <span>Ottimizzazione distribuzione: -28% commissioni OTA</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 mt-0.5 flex-shrink-0" />
                    <span>Strategie per bassa stagione: +25% occupazione inverno</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Finale */}
      <section className="py-20">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold text-foreground mb-6">Cerchi un Revenue Manager che Conosce la Toscana?</h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Contattaci per una consulenza gratuita. Analizzeremo il tuo hotel e il mercato locale per proporti strategie
            su misura.
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
      </section>

      <Footer />
    </div>
  )
}
