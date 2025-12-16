import Link from "next/link"
import { TrendingUp, Users, CheckCircle2, Zap, ArrowUpRight, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { LandingPageTracker } from "@/components/landing-page-tracker"

export const metadata = {
  title: "Come Aumentare l'ADR Hotel: Guida Completa 2025 | 4BID.IT",
  description:
    "Scopri come aumentare l'ADR (Average Daily Rate) del tuo hotel con strategie pratiche e comprovate. Tecniche concrete per far crescere la tariffa media fino al +40%.",
  keywords:
    "come aumentare ADR hotel, aumentare tariffa media, strategie ADR, crescita revenue hotel, pricing hotel, tariffe hotel più alte",
}

export default function ADRHotelComeAumentarloPage() {
  return (
    <div className="min-h-screen bg-background">
      <LandingPageTracker slug="adr-hotel-come-aumentarlo" />

      <Header />

      {/* Hero Section */}
      <section className="pt-32 pb-16 bg-gradient-to-br from-primary-blue/10 via-blue-grey/5 to-background">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-primary-blue/10 text-primary-blue px-4 py-2 rounded-full mb-6 text-sm font-semibold">
              <ArrowUpRight className="h-4 w-4" />
              Guida Completa 2025
            </div>
            <h1 className="text-5xl font-bold text-foreground mb-6 text-balance">
              Come Aumentare l'ADR del Tuo Hotel: Guida Pratica
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed mb-8 text-pretty">
              Strategie concrete, testati su oltre 150 hotel, per far crescere la tua Average Daily Rate (ADR) fino al
              +40% senza sacrificare l'occupazione. Passo dopo passo.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link href="/#contact">
                <Button size="lg" className="bg-primary-blue hover:bg-primary-blue/90">
                  Richiedi Consulenza Gratuita
                </Button>
              </Link>
              <Link href="/kpi-metriche-hotel">
                <Button size="lg" variant="outline">
                  Calcola il Tuo ADR
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Win */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-br from-yellow/20 to-yellow/5 rounded-2xl p-8 mb-12 border-2 border-yellow/30">
              <Zap className="h-12 w-12 text-yellow mb-4" />
              <h2 className="text-3xl font-bold text-foreground mb-4">Quick Win: Aumenta l'ADR del 10% in 30 Giorni</h2>
              <p className="text-muted-foreground text-lg mb-6">
                La strategia più veloce da implementare che ti garantisce risultati immediati:
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 text-primary-blue mt-1 flex-shrink-0" />
                  <div>
                    <strong className="text-foreground">Step 1:</strong> Identifica le 10 date con occupazione prevista
                    sopra l'80%
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 text-primary-blue mt-1 flex-shrink-0" />
                  <div>
                    <strong className="text-foreground">Step 2:</strong> Aumenta le tariffe del 20% su quelle date
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 text-primary-blue mt-1 flex-shrink-0" />
                  <div>
                    <strong className="text-foreground">Step 3:</strong> Applica minimum stay di 2 notti
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 text-primary-blue mt-1 flex-shrink-0" />
                  <div>
                    <strong className="text-foreground">Step 4:</strong> Crea un pacchetto "Premium" con colazione e
                    late checkout
                  </div>
                </div>
              </div>
              <p className="mt-6 text-foreground font-semibold">
                Risultato medio: +€15-25 di ADR nelle date di alta domanda = +10-12% ADR mensile
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 7 Strategie */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center text-foreground mb-4">
            7 Strategie Comprovate per Aumentare l'ADR
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Ogni strategia include esempi concreti e risultati misurabili
          </p>
          <div className="max-w-5xl mx-auto space-y-6">
            {[
              {
                number: "1",
                title: "Segmentazione Intelligente del Mercato",
                description:
                  "Identifica chi è disposto a pagare di più e crea tariffe differenziate. Business travelers pagano +30% vs leisure, eventi aziendali +45%.",
                action: "Crea 3-4 rate plans differenziati per tipo di cliente",
                impact: "+15-20% ADR",
              },
              {
                number: "2",
                title: "Dynamic Pricing Basato su Domanda",
                description:
                  "Aumenta i prezzi quando la domanda sale. Se hai 40% occupazione a 60 giorni dalla data, aumenta del 10%. A 80% occupazione, +25%.",
                action: "Imposta trigger automatici di prezzo basati su occupazione",
                impact: "+18-25% ADR",
              },
              {
                number: "3",
                title: "Pacchetti e Bundling Strategico",
                description:
                  'Crea pacchetti "irresistibili" che aumentano il valore percepito: camera + colazione + spa + transfer = +€40 ADR con costo reale di €15.',
                action: "Lancia 2-3 pacchetti per ogni target (coppia, famiglia, business)",
                impact: "+12-18% ADR",
              },
              {
                number: "4",
                title: "Ottimizzazione Canali OTA",
                description:
                  "Prezzo diverso per ogni canale. Booking.com tariffa standard, tuo sito -10%, Expedia +5%. Evita il race-to-bottom sul prezzo.",
                action: "Implementa parity rate con eccezioni strategiche",
                impact: "+8-12% ADR",
              },
              {
                number: "5",
                title: "Minimum Stay Restriction",
                description:
                  "Nei weekend e periodi di punta applica 2-3 notti minime. Eviti di vendere il sabato sera a prezzo basso con check-out domenica.",
                action: "Imposta min-stay 2N su 20-30 date chiave all'anno",
                impact: "+20-30% ADR nei peak days",
              },
              {
                number: "6",
                title: "Upgrade e Upselling Sistematico",
                description:
                  "Offri upgrade al check-in online (-24h) per €20-30. Conversione 25% = +€5-7 ADR medio. Al check-in fisico proponi suite per differenza.",
                action: "Automatizza email pre-arrivo con offerta upgrade",
                impact: "+5-10% ADR",
              },
              {
                number: "7",
                title: "Value Communication Efficace",
                description:
                  "Foto professionali +15% conversion, recensioni 4.5+ permettono +€20 ADR, descrizioni dettagliate giustificano prezzi premium.",
                action: "Investi in fotografia professionale e gestione recensioni attiva",
                impact: "+10-15% ADR",
              },
            ].map((strategy) => (
              <div
                key={strategy.number}
                className="bg-card rounded-xl p-8 shadow-lg border border-border hover:shadow-xl transition-shadow"
              >
                <div className="flex items-start gap-6">
                  <div className="bg-primary-blue text-white rounded-full w-12 h-12 flex items-center justify-center text-2xl font-bold flex-shrink-0">
                    {strategy.number}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-card-foreground mb-3">{strategy.title}</h3>
                    <p className="text-muted-foreground mb-4">{strategy.description}</p>
                    <div className="flex items-center justify-between flex-wrap gap-4 bg-muted/50 rounded-lg p-4">
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-foreground mb-1">Azione Pratica:</p>
                        <p className="text-sm text-muted-foreground">{strategy.action}</p>
                      </div>
                      <div className="bg-primary-blue/10 px-4 py-2 rounded-lg">
                        <p className="text-sm text-primary-blue font-bold">{strategy.impact}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center text-foreground mb-12">
            Piano d'Azione: 6 Mesi per Aumentare l'ADR del 35%
          </h2>
          <div className="max-w-3xl mx-auto">
            <div className="space-y-8">
              {[
                {
                  month: "Mese 1-2",
                  title: "Analisi e Setup",
                  tasks: [
                    "Analisi ADR storico e competitive set",
                    "Setup dynamic pricing base",
                    "Creazione rate plans segmentati",
                  ],
                  target: "ADR +5-8%",
                },
                {
                  month: "Mese 3-4",
                  title: "Implementazione Strategia",
                  tasks: ["Lancio pacchetti premium", "Ottimizzazione canali OTA", "Sistema upselling automatizzato"],
                  target: "ADR +15-20%",
                },
                {
                  month: "Mese 5-6",
                  title: "Ottimizzazione e Scale",
                  tasks: ["Fine-tuning pricing algorithms", "Espansione segmentazione", "Training staff su upselling"],
                  target: "ADR +30-35%",
                },
              ].map((phase, index) => (
                <div key={index} className="flex gap-6">
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full bg-primary-blue text-white flex items-center justify-center font-bold">
                      {index + 1}
                    </div>
                    {index < 2 && <div className="w-1 h-full bg-primary-blue/20 mt-2" />}
                  </div>
                  <div className="flex-1 pb-8">
                    <div className="bg-card rounded-xl p-6 shadow-md border border-border">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-xl font-bold text-card-foreground">{phase.title}</h3>
                        <span className="text-sm text-muted-foreground">{phase.month}</span>
                      </div>
                      <ul className="space-y-2 mb-4">
                        {phase.tasks.map((task, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                            <CheckCircle2 className="h-4 w-4 text-primary-blue mt-0.5 flex-shrink-0" />
                            <span>{task}</span>
                          </li>
                        ))}
                      </ul>
                      <div className="bg-primary-blue/10 px-4 py-2 rounded-lg inline-block">
                        <p className="text-sm font-bold text-primary-blue">Target: {phase.target}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Errori da Evitare */}
      <section className="py-20 bg-destructive/5">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center text-foreground mb-12">5 Errori Che Sabotano il Tuo ADR</h2>
          <div className="max-w-4xl mx-auto space-y-6">
            {[
              {
                title: "Abbassare i Prezzi per Paura",
                description:
                  "Vedere l'occupazione al 40% a 45 giorni e farsi prendere dal panico abbassando i prezzi del 30%. Errore: perdi €45 di ADR per riempire camere che probabilmente si sarebbero vendute comunque.",
                fix: "Usa dati storici: se l'anno scorso eri al 42% a 45 giorni e hai chiuso all'82%, stai tranquillo.",
              },
              {
                title: "Stessa Tariffa su Tutti i Canali",
                description:
                  "Dare lo stesso prezzo su Booking, Expedia e sito diretto. Risultato: zero incentivo a prenotare diretto, paghi 15-20% commissione su tutto.",
                fix: "Prezzo migliore del 10% sul sito diretto + benefit esclusivi (upgrade, late checkout).",
              },
              {
                title: "Ignorare la Competizione",
                description:
                  "Non monitorare i prezzi dei competitor e scoprire dopo che tutti hanno alzato del 20% mentre tu sei rimasto fermo. Occasione persa.",
                fix: "Monitora il comp-set almeno 2 volte a settimana, reagisci entro 24h.",
              },
              {
                title: "Vendere Tutto Troppo Presto",
                description:
                  "Accettare prenotazioni a 120 giorni a prezzo basso per la security. Poi a 30 giorni sei sold-out ma avresti potuto vendere al +50%.",
                fix: "Chiudi blocchi di camere per last-minute, rilascia gradualmente.",
              },
              {
                title: "Zero Investimento in Value",
                description:
                  "Pretendere ADR alto senza investire in foto, descrizioni, recensioni, servizi. Il valore percepito giustifica il prezzo.",
                fix: "Budget annuale 2-3% revenue per fotografia, contenuti, guest experience.",
              },
            ].map((error, index) => (
              <div
                key={index}
                className="bg-card rounded-xl p-6 shadow-md border-l-4 border-destructive hover:shadow-lg transition-shadow"
              >
                <h3 className="text-xl font-bold text-card-foreground mb-3">❌ {error.title}</h3>
                <p className="text-muted-foreground mb-4">{error.description}</p>
                <div className="bg-primary-blue/10 rounded-lg p-4">
                  <p className="text-sm font-semibold text-foreground mb-1">✅ Come Fare Invece:</p>
                  <p className="text-sm text-muted-foreground">{error.fix}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tools */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center text-foreground mb-12">Strumenti per Aumentare l'ADR</h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-gradient-to-br from-primary-blue to-blue-grey text-white rounded-2xl p-8 shadow-xl">
              <TrendingUp className="h-12 w-12 mb-4 opacity-90" />
              <h3 className="text-2xl font-bold mb-3">Software SANTADDEO</h3>
              <p className="mb-6 opacity-90">
                RMS che automatizza pricing, forecasting e distribuzione. Calcola ADR ottimale per ogni giorno basandosi
                su 47+ variabili.
              </p>
              <Link href="/progetti/santaddeo">
                <Button variant="secondary" size="lg">
                  Scopri SANTADDEO
                </Button>
              </Link>
            </div>

            <div className="bg-card rounded-2xl p-8 shadow-xl border border-border">
              <Users className="h-12 w-12 text-primary-blue mb-4" />
              <h3 className="text-2xl font-bold text-card-foreground mb-3">Consulenza 1-1</h3>
              <p className="text-muted-foreground mb-6">
                I nostri esperti analizzano il tuo hotel e creano un piano personalizzato per aumentare l'ADR con
                supporto continuo.
              </p>
              <Link href="/#contact">
                <Button variant="outline" size="lg">
                  Richiedi Consulenza
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-br from-primary-blue/10 to-blue-grey/10">
        <div className="container mx-auto px-6 text-center">
          <Calendar className="h-16 w-16 mx-auto text-primary-blue mb-6" />
          <h2 className="text-4xl font-bold text-foreground mb-6">Inizia Oggi ad Aumentare il Tuo ADR</h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Analisi gratuita del tuo potenziale di crescita ADR. Ricevi un report personalizzato con strategie concrete
            per il tuo hotel.
          </p>
          <Link href="/#contact">
            <Button size="lg" className="bg-primary-blue hover:bg-primary-blue/90">
              Richiedi Analisi Gratuita ADR
            </Button>
          </Link>
          <p className="text-sm text-muted-foreground mt-4">
            Risposta entro 24h • Nessun impegno • Report personalizzato
          </p>
        </div>
      </section>

      <Footer />
    </div>
  )
}
