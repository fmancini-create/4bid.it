import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, MapPin, Users, CheckCircle, ArrowRight, Coffee, Presentation, Monitor, MessageSquare, Wine, Zap } from "lucide-react"
import Header from "@/components/header"
import Footer from "@/components/footer"
import LandingPageTracker from "@/components/landing-page-tracker"
import SeoStructuredData from "@/components/seo-structured-data"

export const metadata = {
  title: "SANTADDEO Launch Event | Presentazione Ufficiale | 4BID.IT",
  description: "Partecipa alla presentazione ufficiale di SANTADDEO, il primo Revenue Management System intelligente e umano. Demo live, networking e aperitivo.",
  openGraph: {
    title: "SANTADDEO Launch Event | 4BID.IT",
    description: "Partecipa alla presentazione ufficiale di SANTADDEO, il primo Revenue Management System intelligente e umano.",
    type: "website",
  },
}

export default function SantaddeoLaunchPage() {
  const programma = [
    {
      orario: "17:00",
      titolo: "Registrazione e Welcome Coffee",
      descrizione: "Accoglienza partecipanti e networking iniziale",
      icon: Coffee,
    },
    {
      orario: "17:30",
      titolo: "Presentazione SANTADDEO",
      descrizione: "La visione, il problema che risolviamo e l'approccio 'Human Revenue Manager'",
      icon: Presentation,
    },
    {
      orario: "18:00",
      titolo: "Demo Live del Sistema",
      descrizione: "Dimostrazione pratica delle funzionalita' core: pricing intelligente, explainable AI, dashboard",
      icon: Monitor,
    },
    {
      orario: "18:45",
      titolo: "Q&A e Discussione",
      descrizione: "Domande dal pubblico e confronto con il team di sviluppo",
      icon: MessageSquare,
    },
    {
      orario: "19:15",
      titolo: "Aperitivo e Networking",
      descrizione: "Momento conviviale per conoscersi e discutere opportunita' di collaborazione",
      icon: Wine,
    },
  ]

  const target = [
    {
      titolo: "Hotel Manager",
      descrizione: "Direttori e general manager di strutture ricettive interessati a ottimizzare i ricavi",
    },
    {
      titolo: "Revenue Manager",
      descrizione: "Professionisti del revenue management alla ricerca di strumenti innovativi",
    },
    {
      titolo: "Proprietari",
      descrizione: "Imprenditori del settore hospitality che vogliono investire in tecnologia",
    },
  ]

  const cosaScroprirai = [
    "Come funziona un RMS con Explainable AI",
    "Perche' la trasparenza nei prezzi aumenta la fiducia",
    "Il modello a performance: paghi solo sui risultati",
    "Come SANTADDEO si integra con PMS e OTA",
    "Case study e risultati delle prime implementazioni",
    "Roadmap e prossimi sviluppi del prodotto",
  ]

  const progetti = [
    {
      nome: "SANTADDEO",
      stato: "In Testing",
      descrizione: "Revenue Management System intelligente e umano",
      link: "/progetti/santaddeo",
    },
    {
      nome: "Hotel Accelerator",
      stato: "80%",
      descrizione: "Programma di accelerazione per strutture ricettive innovative",
      link: "/progetti/hotel-accelerator",
    },
    {
      nome: "HotelProfitAI",
      stato: "In Development",
      descrizione: "Controllo di gestione con team di commercialisti specializzati",
      link: "https://www.hotelprofitai.com",
      external: true,
    },
  ]

  return (
    <>
      <SeoStructuredData
        type="Event"
        data={{
          name: "SANTADDEO Launch Event",
          description: "Presentazione ufficiale del primo Revenue Management System intelligente e umano",
          startDate: "2026-04-15T17:00:00+02:00",
          endDate: "2026-04-15T20:00:00+02:00",
          location: {
            name: "Firenze, Toscana",
            address: "Indirizzo comunicato agli iscritti",
          },
          organizer: {
            name: "4BID SRL",
            url: "https://www.4bid.it",
          },
          eventStatus: "EventScheduled",
          eventAttendanceMode: "OfflineEventAttendanceMode",
        }}
      />
      <LandingPageTracker slug="santaddeo-launch" />
      <Header />
      <main className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="relative py-24 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-teal-500/10 via-background to-cyan-500/10" />
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              <Badge variant="secondary" className="mb-6">Evento Esclusivo</Badge>
              
              <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6 text-balance">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-cyan-600">SANTADDEO</span>
                <br />Launch Event
              </h1>
              
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto text-pretty">
                Partecipa alla presentazione ufficiale del primo Revenue Management System intelligente e umano. 
                Demo live, networking con operatori del settore e aperitivo finale.
              </p>

              <div className="flex flex-wrap justify-center gap-4 mb-10">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-5 w-5 text-primary" />
                  <span>Data da definire</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-5 w-5 text-primary" />
                  <span>17:00 - 20:00</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-5 w-5 text-primary" />
                  <span>Firenze, Toscana</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="h-5 w-5 text-primary" />
                  <span>Posti limitati</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" asChild>
                  <Link href="/contatti?event=santaddeo-launch">
                    Richiedi Invito
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/progetti/santaddeo">
                    Scopri SANTADDEO
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Programma Section */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Programma dell'Evento</h2>
            <div className="max-w-3xl mx-auto space-y-6">
              {programma.map((item, index) => (
                <Card key={index} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="flex items-start gap-4 p-6">
                      <div className="flex-shrink-0 w-20 text-center">
                        <span className="text-2xl font-bold text-primary">{item.orario}</span>
                      </div>
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <item.icon className="h-6 w-6 text-primary" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold mb-2">{item.titolo}</h3>
                        <p className="text-muted-foreground">{item.descrizione}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Target Section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">A Chi e' Rivolto</h2>
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {target.map((item, index) => (
                <Card key={index} className="text-center">
                  <CardContent className="p-8">
                    <h3 className="text-xl font-semibold mb-4">{item.titolo}</h3>
                    <p className="text-muted-foreground">{item.descrizione}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Cosa Scoprirai Section */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Cosa Scoprirai</h2>
            <div className="grid md:grid-cols-2 gap-4 max-w-3xl mx-auto">
              {cosaScroprirai.map((item, index) => (
                <div key={index} className="flex items-center gap-3 p-4 bg-background rounded-lg">
                  <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Progetti Section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">I Nostri Progetti nel Settore Hospitality</h2>
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {progetti.map((progetto, index) => (
                <Link key={index} href={progetto.link} target={progetto.external ? "_blank" : undefined} rel={progetto.external ? "noopener noreferrer" : undefined}>
                  <Card className="h-full hover:shadow-lg hover:border-primary/50 transition-all cursor-pointer">
                    <CardContent className="p-8">
                      <div className="flex items-start justify-between mb-4">
                        <h3 className="text-xl font-semibold">{progetto.nome}</h3>
                        <Badge variant="outline" className="ml-2 whitespace-nowrap">
                          <Zap className="h-3 w-3 mr-1" />
                          {progetto.stato}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground">{progetto.descrizione}</p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <Card className="max-w-3xl mx-auto bg-gradient-to-r from-teal-500/10 to-cyan-500/10 border-primary/20">
              <CardContent className="p-12 text-center">
                <h2 className="text-3xl font-bold mb-4">Non Perdere l'Evento</h2>
                <p className="text-muted-foreground mb-8 text-lg">
                  I posti sono limitati. Richiedi il tuo invito ora per partecipare alla presentazione esclusiva di SANTADDEO.
                </p>
                <Button size="lg" asChild>
                  <Link href="/contatti?event=santaddeo-launch">
                    Richiedi Invito
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Info Section */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Informazioni Pratiche</h2>
            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <Card>
                <CardContent className="p-6 text-center">
                  <Calendar className="h-8 w-8 text-primary mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">Data</h3>
                  <p className="text-muted-foreground">Da definire - Primavera 2026</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <MapPin className="h-8 w-8 text-primary mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">Location</h3>
                  <p className="text-muted-foreground">Firenze, Toscana<br />Indirizzo comunicato agli iscritti</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <Users className="h-8 w-8 text-primary mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">Partecipazione</h3>
                  <p className="text-muted-foreground">Gratuita su invito<br />Posti limitati</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
