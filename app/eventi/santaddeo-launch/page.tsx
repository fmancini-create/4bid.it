import Link from "next/link"
import { Calendar, MapPin, Clock, Users, CheckCircle2, Star, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { LandingPageTracker } from "@/components/landing-page-tracker"
import { StructuredData } from "@/components/seo-structured-data"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "SANTADDEO Launch Event | Presentazione Ufficiale | 4BID.IT",
  description:
    "Partecipa all'evento esclusivo di lancio di SANTADDEO, il primo Revenue Management System intelligente e umano. Demo live, networking e aperitivo.",
  keywords: "santaddeo launch, evento revenue management, RMS presentazione, demo santaddeo, evento hotel",
  openGraph: {
    title: "SANTADDEO Launch Event | Presentazione Ufficiale",
    description: "Evento esclusivo di lancio del primo RMS intelligente e umano",
    type: "website",
    url: "https://www.4bid.it/eventi/santaddeo-launch",
    locale: "it_IT",
    siteName: "4BID.IT",
  },
  alternates: {
    canonical: "https://www.4bid.it/eventi/santaddeo-launch",
  },
}

export default function SantaddeoLaunchPage() {
  return (
    <div className="min-h-screen bg-background">
      <StructuredData
        type="Service"
        title="SANTADDEO Launch Event"
        description="Evento di lancio del primo Revenue Management System intelligente e umano"
        url="https://www.4bid.it/eventi/santaddeo-launch"
      />

      <LandingPageTracker slug="eventi/santaddeo-launch" />

      <Header />

      {/* Hero Section */}
      <section className="pt-32 pb-16 bg-gradient-to-br from-teal-50 via-cyan-50 to-background">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-teal-100 text-teal-800 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Star className="h-4 w-4" />
              Evento Esclusivo
            </div>
            
            <h1 className="text-5xl font-bold text-foreground mb-6 text-balance">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-cyan-600">SANTADDEO</span>
              <br />Launch Event
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed mb-8 text-pretty">
              Partecipa alla presentazione ufficiale del primo Revenue Management System intelligente e umano. 
              Demo live, networking con operatori del settore e aperitivo finale.
            </p>

            <div className="flex flex-wrap justify-center gap-6 mb-10">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-5 w-5 text-teal-600" />
                <span>Data da definire</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-5 w-5 text-teal-600" />
                <span>17:00 - 20:00</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-5 w-5 text-teal-600" />
                <span>Firenze, Toscana</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="h-5 w-5 text-teal-600" />
                <span>Posti limitati</span>
              </div>
            </div>

            <div className="flex gap-4 justify-center flex-wrap">
              <Link href="/#contact">
                <Button size="lg" className="bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700">
                  Richiedi Invito
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/progetti/santaddeo">
                <Button size="lg" variant="outline">
                  Scopri SANTADDEO
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Programma */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center text-foreground mb-12">Programma dell'Evento</h2>
          <div className="max-w-3xl mx-auto space-y-6">
            {[
              {
                time: "17:00",
                title: "Registrazione e Welcome Coffee",
                description: "Accoglienza partecipanti e networking iniziale",
              },
              {
                time: "17:30",
                title: "Presentazione SANTADDEO",
                description: "La visione, il problema che risolviamo e l'approccio 'Human Revenue Manager'",
              },
              {
                time: "18:00",
                title: "Demo Live del Sistema",
                description: "Dimostrazione pratica delle funzionalita' core: pricing intelligente, explainable AI, dashboard",
              },
              {
                time: "18:45",
                title: "Q&A e Discussione",
                description: "Domande dal pubblico e confronto con il team di sviluppo",
              },
              {
                time: "19:15",
                title: "Aperitivo e Networking",
                description: "Momento conviviale per conoscersi e discutere opportunita' di collaborazione",
              },
            ].map((item, index) => (
              <div key={index} className="flex gap-6 items-start">
                <div className="bg-gradient-to-br from-teal-500 to-cyan-600 text-white px-4 py-2 rounded-lg font-bold min-w-[80px] text-center">
                  {item.time}
                </div>
                <div className="flex-1 bg-card rounded-xl p-6 border border-border">
                  <h3 className="text-xl font-bold text-card-foreground mb-2">{item.title}</h3>
                  <p className="text-muted-foreground">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Per Chi */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center text-foreground mb-12">A Chi e' Rivolto</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                title: "Hotel Manager",
                description: "Direttori e general manager di strutture ricettive interessati a ottimizzare i ricavi",
              },
              {
                title: "Revenue Manager",
                description: "Professionisti del revenue management alla ricerca di strumenti innovativi",
              },
              {
                title: "Proprietari",
                description: "Imprenditori del settore hospitality che vogliono investire in tecnologia",
              },
            ].map((item, index) => (
              <div key={index} className="bg-card rounded-2xl p-8 border border-border shadow-md text-center">
                <CheckCircle2 className="h-12 w-12 text-teal-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-card-foreground mb-3">{item.title}</h3>
                <p className="text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cosa Imparerai */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center text-foreground mb-12">Cosa Scoprirai</h2>
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {[
              "Come funziona un RMS con Explainable AI",
              "Perche' la trasparenza nei prezzi aumenta la fiducia",
              "Il modello a performance: paghi solo sui risultati",
              "Come SANTADDEO si integra con PMS e OTA",
              "Case study e risultati delle prime implementazioni",
              "Roadmap e prossimi sviluppi del prodotto",
            ].map((item, index) => (
              <div key={index} className="flex items-start gap-3 bg-card rounded-xl p-5 border border-border">
                <CheckCircle2 className="h-6 w-6 text-teal-600 flex-shrink-0 mt-0.5" />
                <span className="text-card-foreground">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-br from-teal-500 to-cyan-600 text-white">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold mb-6">Non Perdere l'Evento</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90">
            I posti sono limitati. Richiedi il tuo invito ora per partecipare alla presentazione esclusiva di SANTADDEO.
          </p>
          <Link href="/#contact">
            <Button size="lg" variant="secondary" className="bg-white text-teal-600 hover:bg-gray-100">
              Richiedi Invito
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Info Pratiche */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center text-foreground mb-12">Informazioni Pratiche</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <Calendar className="h-12 w-12 text-teal-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-foreground mb-2">Data</h3>
              <p className="text-muted-foreground">Da definire - Primavera 2026</p>
            </div>
            <div className="text-center">
              <MapPin className="h-12 w-12 text-teal-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-foreground mb-2">Location</h3>
              <p className="text-muted-foreground">Firenze, Toscana<br />Indirizzo comunicato agli iscritti</p>
            </div>
            <div className="text-center">
              <Users className="h-12 w-12 text-teal-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-foreground mb-2">Partecipazione</h3>
              <p className="text-muted-foreground">Gratuita su invito<br />Posti limitati</p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
