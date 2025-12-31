import Link from "next/link"
import type { Metadata } from "next"
import { BookOpen, CheckCircle2, AlertTriangle, ExternalLink } from "lucide-react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { LandingPageTracker } from "@/components/landing-page-tracker"
import { StructuredData } from "@/components/seo-structured-data"
import { ContactButton } from "@/components/contact-button"

export const metadata: Metadata = {
  title: "Guida alle Prenotazioni Dirette Hotel | 4BID.IT",
  description:
    "Guida completa per aumentare le prenotazioni dirette: strategie, checklist operativa, errori comuni e glossario. Riduci la dipendenza dalle OTA.",
  keywords:
    "guida prenotazioni dirette hotel, come aumentare prenotazioni dirette, ridurre commissioni OTA, direct booking hotel",
  alternates: {
    canonical: "https://www.4bid.it/guida-prenotazioni-dirette-hotel",
  },
  openGraph: {
    title: "Guida alle Prenotazioni Dirette Hotel | 4BID.IT",
    description:
      "Guida completa per aumentare le prenotazioni dirette: strategie, checklist operativa, errori comuni e glossario.",
    url: "https://www.4bid.it/guida-prenotazioni-dirette-hotel",
    siteName: "4BID.IT",
    locale: "it_IT",
    type: "article",
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function GuidaPrenotazioniDirettePage() {
  return (
    <div className="min-h-screen bg-background">
      <StructuredData
        type="Article"
        title="Guida alle Prenotazioni Dirette Hotel"
        description="Guida completa per aumentare le prenotazioni dirette: strategie, checklist operativa, errori comuni e glossario."
        url="https://www.4bid.it/guida-prenotazioni-dirette-hotel"
        keywords={["prenotazioni dirette", "direct booking", "hotel", "OTA", "commissioni"]}
      />

      <LandingPageTracker slug="guida-prenotazioni-dirette-hotel" />

      <Header />

      {/* Hero Section */}
      <section className="pt-32 pb-16 bg-gradient-to-br from-primary-blue/10 via-blue-grey/5 to-background">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-2 text-primary-blue mb-4">
              <BookOpen className="h-5 w-5" />
              <span className="text-sm font-medium">Guida Completa</span>
            </div>
            <h1 className="text-5xl font-bold text-foreground mb-6 text-balance">
              Guida alle Prenotazioni Dirette per Hotel
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed mb-8 text-pretty">
              Come aumentare le prenotazioni dirette e ridurre la dipendenza dalle OTA: strategie concrete, strumenti e
              best practice per ogni tipo di struttura.
            </p>

            {/* In sintesi box */}
            <div className="bg-card/50 backdrop-blur-sm rounded-xl p-6 border border-border/50">
              <p className="text-sm font-semibold text-primary-blue mb-3">In sintesi:</p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary-blue mt-0.5">•</span>
                  <span>
                    Le prenotazioni dirette eliminano le commissioni OTA e permettono di costruire un database clienti
                    proprietario
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary-blue mt-0.5">•</span>
                  <span>
                    Richiedono investimento in sito web, booking engine, marketing e gestione della relazione con
                    l'ospite
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary-blue mt-0.5">•</span>
                  <span>
                    L'obiettivo è un mix equilibrato tra canali diretti e intermediati in base al proprio mercato
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Cos'è */}
      <section className="py-16">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-foreground mb-6">Cosa Sono le Prenotazioni Dirette</h2>
            <div className="prose prose-lg max-w-none text-muted-foreground">
              <p>
                Le prenotazioni dirette sono quelle che avvengono senza intermediari tra l'hotel e l'ospite: attraverso
                il sito web della struttura, via telefono, email o walk-in. A differenza delle prenotazioni tramite OTA
                (Online Travel Agencies), non prevedono commissioni a terzi.
              </p>
              <p>
                Il vantaggio economico immediato è l'assenza di commissioni, ma i benefici vanno oltre: relazione
                diretta con l'ospite, possibilità di upselling, raccolta dati per marketing futuro e maggiore controllo
                sull'esperienza di prenotazione.
              </p>
              <p>
                Aumentare le prenotazioni dirette richiede però investimenti in tecnologia, marketing e gestione della
                relazione. L'obiettivo non è eliminare le OTA, ma trovare il giusto equilibrio che massimizzi i ricavi
                netti.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Per chi è */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-foreground mb-6">Per Chi è Questa Guida</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {[
                {
                  title: "Hotel con alta dipendenza OTA",
                  desc: "Strutture che pagano commissioni elevate e vogliono ridurre il costo di acquisizione",
                },
                {
                  title: "Boutique hotel e B&B",
                  desc: "Realtà che puntano sulla relazione personale e possono differenziarsi dalle OTA",
                },
                {
                  title: "Hotel in destinazioni leisure",
                  desc: "Strutture dove i clienti pianificano in anticipo e cercano informazioni online",
                },
                {
                  title: "Catene con brand recognition",
                  desc: "Gruppi che possono sfruttare la notorietà del marchio per attrarre prenotazioni",
                },
                {
                  title: "Hotel con clientela repeater",
                  desc: "Strutture con alto tasso di ritorno che possono fidelizzare attraverso canali diretti",
                },
                {
                  title: "Nuove aperture",
                  desc: "Hotel che vogliono impostare da subito una strategia di distribuzione equilibrata",
                },
              ].map((item, index) => (
                <div key={index} className="bg-card rounded-lg p-5 border border-border">
                  <h3 className="font-semibold text-foreground mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Come funziona */}
      <section className="py-16">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-foreground mb-6">Come Funziona: 5 Step</h2>
            <div className="space-y-6">
              {[
                {
                  step: 1,
                  title: "Analisi del channel mix attuale",
                  desc: "Mappatura di tutti i canali di prenotazione con volumi, commissioni e ricavo netto per canale.",
                },
                {
                  step: 2,
                  title: "Ottimizzazione del sito web",
                  desc: "Miglioramento di UX, velocità, SEO e mobile experience per convertire i visitatori in prenotanti.",
                },
                {
                  step: 3,
                  title: "Implementazione booking engine",
                  desc: "Scelta e configurazione di un motore di prenotazione integrato, veloce e ottimizzato per conversioni.",
                },
                {
                  step: 4,
                  title: "Strategia di marketing diretto",
                  desc: "Attivazione di Google Hotel Ads, metasearch, remarketing, email marketing e programmi loyalty.",
                },
                {
                  step: 5,
                  title: "Misurazione e ottimizzazione",
                  desc: "Tracking delle conversioni, analisi del funnel, A/B testing e miglioramento continuo.",
                },
              ].map((item) => (
                <div key={item.step} className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary-blue text-white flex items-center justify-center font-bold">
                    {item.step}
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">{item.title}</h3>
                    <p className="text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Checklist operativa */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-foreground mb-6">Checklist Operativa</h2>
            <div className="bg-card rounded-xl p-6 border border-border">
              <ul className="space-y-3">
                {[
                  "Verificare che il sito sia mobile-responsive e veloce (sotto 3 secondi)",
                  "Implementare un booking engine con meno di 3 click per completare la prenotazione",
                  "Offrire la miglior tariffa disponibile sul sito (Best Rate Guarantee)",
                  "Aggiungere benefit esclusivi per chi prenota direttamente",
                  "Configurare Google Hotel Ads e profilo Google Business",
                  "Attivare campagne remarketing per chi visita il sito senza prenotare",
                  "Creare una strategia email per clienti passati e lead",
                  "Implementare un programma fedeltà anche semplice",
                  "Formare lo staff a suggerire la prenotazione diretta al telefono",
                  "Monitorare mensilmente il rapporto tra canali diretti e intermediati",
                ].map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary-blue flex-shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Errori comuni */}
      <section className="py-16">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-foreground mb-6">Errori Comuni da Evitare</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                {
                  error: "Sito web non ottimizzato",
                  desc: "Un sito lento o difficile da navigare fa abbandonare i visitatori verso le OTA.",
                },
                {
                  error: "Nessun vantaggio per chi prenota diretto",
                  desc: "Senza incentivi concreti, l'ospite preferisce la comodità delle piattaforme che già conosce.",
                },
                {
                  error: "Booking engine complicato",
                  desc: "Ogni click in più nel processo riduce drasticamente le conversioni.",
                },
                {
                  error: "Non investire in marketing",
                  desc: "Le prenotazioni dirette non arrivano da sole: servono visibilità e remarketing.",
                },
                {
                  error: "Ignorare i metasearch",
                  desc: "Google Hotel Ads e Trivago sono canali a performance che portano traffico qualificato.",
                },
                {
                  error: "Non misurare il costo reale",
                  desc: "Il costo di acquisizione diretto (marketing, tecnologia) va confrontato con le commissioni OTA.",
                },
              ].map((item, index) => (
                <div key={index} className="bg-destructive/5 rounded-lg p-4 border border-destructive/20">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">{item.error}</h3>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Glossario */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-foreground mb-6">Glossario Minimo</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                { term: "OTA", def: "Online Travel Agency - piattaforme come Booking.com, Expedia, etc." },
                { term: "Booking Engine", def: "Software che permette prenotazioni dirette dal sito web dell'hotel" },
                {
                  term: "Metasearch",
                  def: "Motori di comparazione prezzi (Google Hotel Ads, Trivago, Kayak)",
                },
                { term: "Channel Mix", def: "Distribuzione delle prenotazioni tra i diversi canali" },
                { term: "BRG", def: "Best Rate Guarantee - garanzia di miglior tariffa sul sito diretto" },
                { term: "CAC", def: "Customer Acquisition Cost - costo per acquisire un nuovo cliente" },
                { term: "Remarketing", def: "Pubblicità mirata a chi ha già visitato il sito senza prenotare" },
                { term: "CRM", def: "Customer Relationship Management - gestione della relazione col cliente" },
              ].map((item, index) => (
                <div key={index} className="bg-card rounded-lg p-4 border border-border">
                  <span className="font-mono text-primary-blue font-semibold">{item.term}</span>
                  <p className="text-sm text-muted-foreground mt-1">{item.def}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Risorse correlate */}
      <section className="py-16">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-foreground mb-6">Risorse Correlate</h2>
            <div className="space-y-3">
              {[
                { title: "Prenotazioni Dirette Hotel", url: "/prenotazioni-dirette-hotel" },
                { title: "Strategie Prenotazioni Dirette", url: "/strategie-prenotazioni-dirette-hotel" },
                { title: "Gestione Canali Distribuzione Hotel", url: "/gestione-canali-distribuzione-hotel" },
                { title: "Ottimizzazione OTA Hotel", url: "/ottimizzazione-ota-hotel" },
                { title: "Webmarketing Hotel e Prenotazioni", url: "/webmarketing-hotel-prenotazioni" },
              ].map((link, index) => (
                <Link key={index} href={link.url} className="flex items-center gap-2 text-primary-blue hover:underline">
                  <ExternalLink className="h-4 w-4" />
                  {link.title}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-foreground mb-4">Vuoi Approfondire?</h2>
          <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
            Se hai domande sulle prenotazioni dirette o vuoi capire come migliorare il channel mix della tua struttura,
            contattaci per una consulenza.
          </p>
          <ContactButton size="lg" className="bg-primary-blue hover:bg-primary-blue/90">
            Richiedi Informazioni
          </ContactButton>
        </div>
      </section>

      <Footer />
    </div>
  )
}
