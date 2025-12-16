import Link from "next/link"
import { Globe, TrendingUp, Users, Target, CheckCircle2, BarChart3, Search, MousePointer } from "lucide-react"
import { Button } from "@/components/ui/button"
import Header from "@/components/header"
import Footer from "@/components/footer"
import { LandingPageTracker } from "@/components/landing-page-tracker"

export const metadata = {
  title: "Web Marketing Hotel | Aumenta le Prenotazioni Dirette | 4BID.IT",
  description:
    "Servizi di Web Marketing specializzati per hotel. SEO, Google Ads, Meta Ads e strategie digital per aumentare le prenotazioni dirette e ridurre le commissioni OTA.",
  keywords:
    "web marketing hotel, digital marketing alberghiero, SEO hotel, Google Ads hotel, prenotazioni dirette, marketing turistico, advertising hotel",
}

export default function WebMarketingHotelPrenotazioniPage() {
  return (
    <div className="min-h-screen bg-background">
      <LandingPageTracker slug="webmarketing-hotel-prenotazioni" />

      <Header />

      {/* Hero Section */}
      <section className="pt-32 pb-16 bg-gradient-to-br from-primary-blue/10 via-blue-grey/5 to-background">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl font-bold text-foreground mb-6 text-balance">
              Web Marketing per Hotel: Aumenta le Prenotazioni Dirette
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed mb-8 text-pretty">
              Strategie digital integrate per hotel che vogliono ridurre le commissioni OTA e massimizzare le
              prenotazioni dirette dal proprio sito web.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link href="/#contact">
                <Button size="lg" className="bg-primary-blue hover:bg-primary-blue/90">
                  Richiedi Strategia Personalizzata
                </Button>
              </Link>
              <Link href="/prenotazioni-dirette-hotel">
                <Button size="lg" variant="outline">
                  Scopri Direct Booking
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Il Problema */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h2 className="text-4xl font-bold text-foreground mb-6">Il Tuo Hotel Dipende Troppo dalle OTA?</h2>
            <p className="text-lg text-muted-foreground">
              La maggior parte degli hotel riceve oltre il 70% delle prenotazioni da Booking.com ed Expedia, pagando
              commissioni del 15-25% su ogni prenotazione.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-destructive/10 rounded-2xl p-8 border border-destructive/20">
              <h3 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
                <span className="text-3xl">❌</span> Senza Web Marketing
              </h3>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-destructive mt-1">•</span>
                  <span>75% prenotazioni da OTA con commissioni 15-25%</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-destructive mt-1">•</span>
                  <span>Sito web invisibile su Google</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-destructive mt-1">•</span>
                  <span>Zero visibilità sui social media</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-destructive mt-1">•</span>
                  <span>Budget marketing sprecato senza strategia</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-destructive mt-1">•</span>
                  <span>Impossibile misurare il ritorno sull'investimento</span>
                </li>
              </ul>
            </div>

            <div className="bg-primary-blue/10 rounded-2xl p-8 border border-primary-blue/20">
              <h3 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
                <span className="text-3xl">✅</span> Con Web Marketing
              </h3>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary-blue mt-0.5 flex-shrink-0" />
                  <span>45-60% prenotazioni dirette dal tuo sito</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary-blue mt-0.5 flex-shrink-0" />
                  <span>Prima pagina Google per le tue keyword</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary-blue mt-0.5 flex-shrink-0" />
                  <span>Campagne Meta Ads e Google Ads ottimizzate</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary-blue mt-0.5 flex-shrink-0" />
                  <span>ROI tracciato e misurabile su ogni euro speso</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary-blue mt-0.5 flex-shrink-0" />
                  <span>Risparmio commissioni OTA: €20k-50k/anno</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Servizi */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center text-foreground mb-4">I Nostri Servizi di Web Marketing</h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Strategia digital integrata per portare più ospiti direttamente sul tuo sito
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Search,
                title: "SEO Hotel",
                descrizione: "Ottimizzazione per i motori di ricerca: prima pagina Google per 'hotel + città'",
                vantaggi: ["Traffico organico qualificato", "Posizionamento long-term", "Costo per clic zero"],
              },
              {
                icon: MousePointer,
                title: "Google Ads Hotel",
                descrizione: "Campagne Google Ads ad alto ROI per intercettare chi cerca un hotel nella tua zona",
                vantaggi: ["Risultati immediati", "Targeting geografico", "Budget controllato"],
              },
              {
                icon: Globe,
                title: "Meta Ads (FB/IG)",
                descrizione: "Campagne Facebook e Instagram per awareness, retargeting e conversioni dirette",
                vantaggi: ["Audience targeting avanzato", "Visual storytelling", "Retargeting efficace"],
              },
              {
                icon: Target,
                title: "Booking Engine Optimization",
                descrizione: "Ottimizzazione del motore di prenotazione per massimizzare le conversioni",
                vantaggi: ["UX/UI ottimizzata", "Mobile-first", "Conversion rate +35%"],
              },
              {
                icon: BarChart3,
                title: "Analytics & Tracking",
                descrizione: "Setup completo Google Analytics 4, Tag Manager e tracking delle conversioni",
                vantaggi: ["ROI trasparente", "Dati real-time", "Report mensili"],
              },
              {
                icon: Users,
                title: "Content Marketing",
                descrizione: "Creazione contenuti SEO-friendly per blog, guide locali e landing pages",
                vantaggi: ["Authority building", "Long-tail keywords", "Evergreen content"],
              },
            ].map((servizio, index) => {
              const Icon = servizio.icon
              return (
                <div key={index} className="bg-card rounded-xl p-8 shadow-lg border border-border">
                  <Icon className="h-12 w-12 text-primary-blue mb-4" />
                  <h3 className="text-xl font-bold text-card-foreground mb-3">{servizio.title}</h3>
                  <p className="text-muted-foreground mb-4">{servizio.descrizione}</p>
                  <ul className="space-y-2">
                    {servizio.vantaggi.map((vantaggio, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CheckCircle2 className="h-4 w-4 text-primary-blue flex-shrink-0" />
                        <span>{vantaggio}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Case Study */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center text-foreground mb-12">Case Study: Hotel 4 Stelle Firenze</h2>
          <div className="max-w-4xl mx-auto bg-gradient-to-br from-primary-blue/10 to-blue-grey/10 rounded-2xl p-10 border border-primary-blue/20">
            <p className="text-lg text-muted-foreground mb-8">
              Hotel 40 camere a Firenze centro. Obiettivo: ridurre dipendenza da Booking.com e aumentare prenotazioni
              dirette del 200% in 12 mesi.
            </p>
            <div className="grid md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white dark:bg-card rounded-xl p-6 text-center shadow-md">
                <p className="text-4xl font-bold text-primary-blue mb-2">+285%</p>
                <p className="text-sm text-muted-foreground">Prenotazioni dirette</p>
              </div>
              <div className="bg-white dark:bg-card rounded-xl p-6 text-center shadow-md">
                <p className="text-4xl font-bold text-primary-blue mb-2">€42k</p>
                <p className="text-sm text-muted-foreground">Risparmio commissioni</p>
              </div>
              <div className="bg-white dark:bg-card rounded-xl p-6 text-center shadow-md">
                <p className="text-4xl font-bold text-primary-blue mb-2">520%</p>
                <p className="text-sm text-muted-foreground">ROI marketing</p>
              </div>
              <div className="bg-white dark:bg-card rounded-xl p-6 text-center shadow-md">
                <p className="text-4xl font-bold text-primary-blue mb-2">8 mesi</p>
                <p className="text-sm text-muted-foreground">Break-even</p>
              </div>
            </div>
            <div className="border-t border-border pt-8">
              <h4 className="font-bold text-foreground mb-4">Strategie Implementate:</h4>
              <div className="grid md:grid-cols-2 gap-4">
                <ul className="space-y-2">
                  <li className="flex items-start gap-2 text-muted-foreground">
                    <CheckCircle2 className="h-5 w-5 text-primary-blue mt-0.5 flex-shrink-0" />
                    <span>SEO: 1ª pagina per 12 keyword strategiche</span>
                  </li>
                  <li className="flex items-start gap-2 text-muted-foreground">
                    <CheckCircle2 className="h-5 w-5 text-primary-blue mt-0.5 flex-shrink-0" />
                    <span>Google Ads: CPA medio €18 (vs €45 OTA)</span>
                  </li>
                  <li className="flex items-start gap-2 text-muted-foreground">
                    <CheckCircle2 className="h-5 w-5 text-primary-blue mt-0.5 flex-shrink-0" />
                    <span>Meta Ads: Retargeting con ROAS 8.2x</span>
                  </li>
                </ul>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2 text-muted-foreground">
                    <CheckCircle2 className="h-5 w-5 text-primary-blue mt-0.5 flex-shrink-0" />
                    <span>Booking Engine: conversion rate +42%</span>
                  </li>
                  <li className="flex items-start gap-2 text-muted-foreground">
                    <CheckCircle2 className="h-5 w-5 text-primary-blue mt-0.5 flex-shrink-0" />
                    <span>Content: 24 articoli blog con traffico organico</span>
                  </li>
                  <li className="flex items-start gap-2 text-muted-foreground">
                    <CheckCircle2 className="h-5 w-5 text-primary-blue mt-0.5 flex-shrink-0" />
                    <span>Email marketing: tasso apertura 34%</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Risultati Misurabili */}
      <section className="py-20 bg-gradient-to-br from-primary-blue to-blue-grey text-white">
        <div className="container mx-auto px-6 text-center">
          <TrendingUp className="h-16 w-16 mx-auto mb-6 opacity-90" />
          <h2 className="text-4xl font-bold mb-6">Risultati Misurabili e Trasparenti</h2>
          <p className="text-xl mb-12 max-w-3xl mx-auto opacity-90">
            Ogni euro investito in web marketing è tracciato e rendicontato con report mensili dettagliati su traffico,
            conversioni e ROI
          </p>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <p className="text-5xl font-bold mb-2">+150%</p>
              <p className="text-sm">Traffico sito web medio</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <p className="text-5xl font-bold mb-2">+180%</p>
              <p className="text-sm">Prenotazioni dirette</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <p className="text-5xl font-bold mb-2">400%</p>
              <p className="text-sm">ROI medio campagne</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Finale */}
      <section className="py-20">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold text-foreground mb-6">Pronto a Ridurre le Commissioni OTA?</h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Richiedi un'analisi gratuita del tuo sito web e della tua presenza online. Ti mostreremo le opportunità per
            aumentare le prenotazioni dirette.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/#contact">
              <Button size="lg" className="bg-primary-blue hover:bg-primary-blue/90">
                Richiedi Analisi Gratuita
              </Button>
            </Link>
            <Link href="/strategie-vendita-diretta-hotel">
              <Button size="lg" variant="outline">
                Scopri le Strategie
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
