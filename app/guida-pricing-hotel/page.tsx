import Link from "next/link"
import type { Metadata } from "next"
import { BookOpen, CheckCircle2, AlertTriangle, ExternalLink } from "lucide-react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { LandingPageTracker } from "@/components/landing-page-tracker"
import { StructuredData } from "@/components/seo-structured-data"
import { ContactButton } from "@/components/contact-button"

export const metadata: Metadata = {
  title: "Guida Completa al Pricing Hotel | 4BID.IT",
  description:
    "Guida completa alle strategie di pricing per hotel: tariffe dinamiche, BAR, restrizioni, segmentazione. Checklist operativa e glossario.",
  keywords: "guida pricing hotel, strategie tariffarie hotel, dynamic pricing hotel, come definire prezzi hotel",
  alternates: {
    canonical: "https://www.4bid.it/guida-pricing-hotel",
  },
  openGraph: {
    title: "Guida Completa al Pricing Hotel | 4BID.IT",
    description:
      "Guida completa alle strategie di pricing per hotel: tariffe dinamiche, BAR, restrizioni, segmentazione.",
    url: "https://www.4bid.it/guida-pricing-hotel",
    siteName: "4BID.IT",
    locale: "it_IT",
    type: "article",
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function GuidaPricingHotelPage() {
  return (
    <div className="min-h-screen bg-background">
      <StructuredData
        type="Article"
        title="Guida Completa al Pricing Hotel"
        description="Guida completa alle strategie di pricing per hotel: tariffe dinamiche, BAR, restrizioni, segmentazione."
        url="https://www.4bid.it/guida-pricing-hotel"
        keywords={["pricing hotel", "tariffe hotel", "dynamic pricing", "BAR", "strategie tariffarie"]}
      />

      <LandingPageTracker slug="guida-pricing-hotel" />

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
              Guida alle Strategie di Pricing per Hotel
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed mb-8 text-pretty">
              Come definire, gestire e ottimizzare le tariffe del tuo hotel: dalla tariffa base al pricing dinamico,
              passando per segmentazione e restrizioni.
            </p>

            {/* In sintesi box */}
            <div className="bg-card/50 backdrop-blur-sm rounded-xl p-6 border border-border/50">
              <p className="text-sm font-semibold text-primary-blue mb-3">In sintesi:</p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary-blue mt-0.5">•</span>
                  <span>
                    Il pricing alberghiero bilancia domanda, costi, posizionamento e obiettivi di ricavo della struttura
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary-blue mt-0.5">•</span>
                  <span>
                    Le strategie spaziano dal pricing statico stagionale a quello completamente dinamico e automatizzato
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary-blue mt-0.5">•</span>
                  <span>
                    La scelta della strategia dipende da dimensione, mercato e risorse disponibili per la gestione
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
            <h2 className="text-3xl font-bold text-foreground mb-6">Cos'è il Pricing Alberghiero</h2>
            <div className="prose prose-lg max-w-none text-muted-foreground">
              <p>
                Il pricing alberghiero è l'insieme di strategie e tattiche utilizzate per definire il prezzo delle
                camere e dei servizi di una struttura ricettiva. Non si tratta semplicemente di fissare un numero, ma di
                costruire un sistema che risponda alle variazioni di domanda e massimizzi i ricavi.
              </p>
              <p>
                Una strategia di pricing efficace tiene conto di molteplici fattori: costi operativi, posizionamento sul
                mercato, comportamento della concorrenza, stagionalità, eventi locali e sensibilità al prezzo dei
                diversi segmenti di clientela.
              </p>
              <p>
                L'obiettivo non è vendere al prezzo più alto possibile, ma trovare il prezzo ottimale che massimizza il
                ricavo totale considerando l'elasticità della domanda per ogni periodo e segmento.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Per chi è */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-foreground mb-6">Per Chi Sono le Strategie di Pricing</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {[
                {
                  title: "Hotel con tariffe statiche",
                  desc: "Strutture che vogliono passare a un modello più flessibile e redditizio",
                },
                {
                  title: "Revenue Manager",
                  desc: "Professionisti che cercano framework e best practice per le decisioni tariffarie",
                },
                {
                  title: "Proprietari di B&B",
                  desc: "Gestori che vogliono capire come prezzare senza esperienza specifica",
                },
                {
                  title: "Direttori d'albergo",
                  desc: "Manager che devono supervisionare la strategia commerciale della struttura",
                },
                {
                  title: "Startup hospitality",
                  desc: "Nuove attività che devono definire il posizionamento tariffario iniziale",
                },
                {
                  title: "Catene in espansione",
                  desc: "Gruppi che necessitano di standardizzare le politiche pricing tra proprietà",
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
                  title: "Analisi dei costi",
                  desc: "Calcolo del costo per camera occupata (pulizia, consumabili, utenze) per definire il floor price sotto cui non scendere.",
                },
                {
                  step: 2,
                  title: "Definizione della BAR",
                  desc: "Creazione della Best Available Rate come tariffa di riferimento pubblico, con variazioni per stagione e tipologia camera.",
                },
                {
                  step: 3,
                  title: "Segmentazione tariffaria",
                  desc: "Definizione di tariffe differenziate per canale, segmento clientela e condizioni (non rimborsabile, advance purchase, etc.).",
                },
                {
                  step: 4,
                  title: "Regole di variazione",
                  desc: "Impostazione di trigger automatici o manuali per modificare i prezzi in base a occupazione, lead time e pick-up.",
                },
                {
                  step: 5,
                  title: "Test e ottimizzazione",
                  desc: "Monitoraggio dei risultati, A/B testing su tariffe e condizioni, aggiustamento continuo della strategia.",
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
                  "Calcolare il costo marginale per camera occupata",
                  "Definire il floor price (tariffa minima accettabile)",
                  "Creare almeno 3 livelli tariffari per stagione (bassa, media, alta)",
                  "Impostare tariffe differenziate per tipologia camera",
                  "Definire policy per tariffe non rimborsabili e advance purchase",
                  "Stabilire le regole di parità tariffaria tra canali",
                  "Creare un listino per gruppi e corporate",
                  "Impostare minimum stay per periodi di alta domanda",
                  "Definire i trigger di variazione prezzo (occupazione, lead time)",
                  "Documentare tutte le regole in un pricing manual interno",
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
                  error: "Copiare i prezzi della concorrenza",
                  desc: "Ogni hotel ha costi e posizionamento diversi; copiare senza analisi porta a margini errati.",
                },
                {
                  error: "Non considerare i costi di distribuzione",
                  desc: "Una tariffa netta può essere inferiore ai costi se non si calcolano le commissioni OTA.",
                },
                {
                  error: "Prezzi troppo complessi",
                  desc: "Troppe varianti tariffarie confondono sia lo staff che i clienti e complicano la gestione.",
                },
                {
                  error: "Ignorare la price perception",
                  desc: "Il prezzo comunica posizionamento: tariffe troppo basse possono danneggiare l'immagine.",
                },
                {
                  error: "Non testare le variazioni",
                  desc: "Cambiare prezzi senza misurare l'impatto rende impossibile capire cosa funziona.",
                },
                {
                  error: "Dimenticare i costi nascosti",
                  desc: "OTA fee, payment processing, cancellazioni: tutti costi che erodono il margine reale.",
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
                { term: "BAR", def: "Best Available Rate - tariffa pubblica di riferimento senza restrizioni" },
                {
                  term: "Rack Rate",
                  def: "Tariffa di listino ufficiale, spesso usata come riferimento per sconti",
                },
                { term: "Floor Price", def: "Prezzo minimo sotto cui non si scende per coprire i costi variabili" },
                { term: "Ceiling Price", def: "Prezzo massimo oltre cui la domanda crolla drasticamente" },
                { term: "Price Fencing", def: "Barriere che giustificano prezzi diversi per lo stesso prodotto" },
                { term: "Rate Parity", def: "Parità tariffaria tra i diversi canali di distribuzione" },
                { term: "Advance Purchase", def: "Tariffa scontata per prenotazioni con largo anticipo" },
                { term: "Non-Refundable", def: "Tariffa scontata non rimborsabile in caso di cancellazione" },
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
                { title: "Strategie di Pricing Hotel", url: "/strategie-pricing-hotel" },
                { title: "Dynamic Pricing per Hotel", url: "/dynamic-pricing-hotel" },
                { title: "Ottimizzazione ADR Hotel", url: "/ottimizzazione-adr-hotel" },
                { title: "Guida al Revenue Management Hotel", url: "/guida-revenue-management-hotel" },
                { title: "Software Revenue Management SANTADDEO", url: "/software-revenue-management-santaddeo" },
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
            Se hai domande sulle strategie di pricing o vuoi capire come ottimizzare le tariffe della tua struttura,
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
