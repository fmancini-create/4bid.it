import Image from "next/image"
import Link from "next/link"
import { MapPin, Calendar, Clock, Laptop, Wine, Presentation, Coffee, Users, ExternalLink } from "lucide-react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { EventRegistrationForm } from "@/components/event-registration-form"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Evento Lancio Santaddeo - Villa I Barronci | 4BID",
  description:
    "Presentazione ufficiale di Santaddeo, il nuovo sistema web-based di Revenue Management dinamico. Villa I Barronci, San Casciano in Val di Pesa. Evento riservato ai clienti 4Bid.",
  keywords: "santaddeo, evento, lancio, revenue management, villa barronci, 4bid",
  openGraph: {
    title: "Evento Lancio Santaddeo - Villa I Barronci",
    description: "Presentazione riservata del nuovo modello web-based per il pricing dinamico",
    type: "website",
    url: "https://4bid.it/eventi/santaddeo-launch",
    locale: "it_IT",
    siteName: "4BID.IT",
    images: [{ url: "https://4bid.it/4bid-colorful-logo.jpg", width: 1200, height: 630, alt: "Evento Santaddeo - 4BID" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Evento Lancio Santaddeo - Villa I Barronci",
    description: "Presentazione riservata del nuovo modello web-based per il pricing dinamico",
    images: ["https://4bid.it/4bid-colorful-logo.jpg"],
  },
  alternates: {
    canonical: "https://4bid.it/eventi/santaddeo-launch",
  },
}

const schedule = [
  {
    time: "14:30 - 16:30",
    title: "Presentazione ufficiale",
    description: "Presentazione completa di Santaddeo: il nuovo modello web-based per il pricing dinamico evoluto.",
    icon: Presentation,
    accent: "bg-teal-100 text-teal-700",
  },
  {
    time: "16:30 - 17:00",
    title: "Pausa",
    description: "Un momento di relax e networking tra colleghi del settore.",
    icon: Coffee,
    accent: "bg-amber-100 text-amber-700",
  },
  {
    time: "17:00 - 19:00",
    title: "Sessione pratica",
    description: "Configurazione della tua struttura direttamente sulla piattaforma. Porta con te PC o tablet.",
    icon: Laptop,
    accent: "bg-cyan-100 text-cyan-700",
  },
  {
    time: "19:00",
    title: "Aperitivo",
    description: "Aperitivo informale per augurarci insieme una splendida stagione turistica.",
    icon: Wine,
    accent: "bg-rose-100 text-rose-700",
  },
]

export default function SantaddeoLaunchPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero */}
      <section className="relative pt-24 pb-0 overflow-hidden bg-foreground">
        <div className="relative py-20 md:py-28">
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }} />
          <div className="container mx-auto px-6 text-center relative z-10">
            <p className="text-sm uppercase tracking-[0.25em] text-white/60 font-medium mb-6">
              Invito riservato
            </p>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-5 text-balance leading-tight">
              La prima ufficiale di<br />
              <span className="text-teal-400">Santaddeo</span>
            </h1>
            <p className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto leading-relaxed">
              Il nuovo modello web-based per il pricing dinamico evoluto
            </p>
            <div className="mt-10 flex items-center justify-center gap-6">
              <Image
                src="/santaddeo-logo.png"
                alt="Santaddeo"
                width={480}
                height={192}
                className="object-contain drop-shadow-lg"
              />
              <span className="text-white/30 text-2xl font-thin">×</span>
              <Image
                src="/logo.png"
                alt="4BID"
                width={64}
                height={64}
                className="object-contain drop-shadow-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Event Details Bar */}
      <section className="bg-foreground text-background">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-12 py-5 text-sm">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-teal-400" />
              <span>Villa I Barronci, San Casciano in Val di Pesa</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-teal-400" />
              <span>Lunedi' 9 Marzo 2026</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-teal-400" />
              <span>14:30 - 19:00+</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-teal-400" />
              <span>Posti limitati</span>
            </div>
          </div>
        </div>
      </section>

      {/* Intro */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-6 max-w-3xl text-center">
          <p className="text-muted-foreground text-lg md:text-xl leading-relaxed">
            Dopo 24 anni nel settore dell&apos;hotellerie e quasi 20 anni di sviluppo di formule su Google
            ed Excel, tutta l&apos;esperienza maturata sul campo e' stata trasformata in una piattaforma
            strutturata, evoluta e finalmente <strong className="text-foreground">web-based</strong>.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 text-sm">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-teal-50 text-teal-800 border border-teal-200">
              <span className="font-semibold">Pricing consapevole e strategico</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-50 text-cyan-800 border border-cyan-200">
              <span className="font-semibold">Lavoro operativo semplificato</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
              <span className="font-semibold">Innovazione concreta e misurabile</span>
            </div>
          </div>
        </div>
      </section>

      {/* Important Notice */}
      <section className="py-12 bg-amber-50/60 border-y border-amber-200/50">
        <div className="container mx-auto px-6 max-w-3xl text-center">
          <p className="text-sm uppercase tracking-widest text-amber-700 font-medium mb-3">Comunicazione importante</p>
          <p className="text-foreground text-lg leading-relaxed">
            Entro il 31 Maggio, i fogli Google utilizzati fino ad oggi verranno progressivamente dismessi.
            Chi desidera continuare con la logica di pricing dinamico evoluto dovra' passare al
            nuovo modello web-based: <strong>Santaddeo</strong>.
          </p>
          <p className="text-muted-foreground mt-3 text-base italic">
            Non e' un cambiamento tecnico. E' un salto di livello.
          </p>
        </div>
      </section>

      {/* Schedule + Registration Form */}
      <section id="registrazione" className="py-16 md:py-24">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 max-w-6xl mx-auto">
            {/* Left: Schedule */}
            <div>
              <p className="text-sm uppercase tracking-widest text-teal-700 font-medium mb-3">Programma</p>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-8 text-balance">
                Una giornata dedicata al futuro del Revenue Management
              </h2>

              <div className="space-y-0">
                {schedule.map((item, i) => (
                  <div key={i} className="flex gap-4">
                    {/* Timeline line */}
                    <div className="flex flex-col items-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${item.accent}`}>
                        <item.icon className="h-4 w-4" />
                      </div>
                      {i < schedule.length - 1 && (
                        <div className="w-px h-full bg-border my-1" />
                      )}
                    </div>
                    {/* Content */}
                    <div className="pb-8">
                      <p className="text-xs font-medium text-muted-foreground tracking-wide">{item.time}</p>
                      <h3 className="text-lg font-semibold text-foreground mt-0.5">{item.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Venue info */}
              <a
                href="https://maps.google.com/?q=Villa+I+Barronci+Via+Sorripa+10+San+Casciano+in+Val+di+Pesa"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 flex items-start gap-4 p-5 rounded-xl bg-teal-50/60 border border-teal-200 hover:bg-teal-50 transition-colors group"
              >
                <div className="w-10 h-10 rounded-full bg-teal-600 flex items-center justify-center shrink-0">
                  <MapPin className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-foreground group-hover:text-teal-800 transition-colors">Villa I Barronci</p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Via Sorripa, 10 - 50026 San Casciano in Val di Pesa (FI)
                  </p>
                  <span className="text-sm text-teal-700 group-hover:text-teal-800 underline underline-offset-2 mt-2 inline-flex items-center gap-1">
                    Apri in Google Maps
                    <ExternalLink className="h-3.5 w-3.5" />
                  </span>
                </div>
              </a>
            </div>

            {/* Right: Registration Form */}
            <div>
              <div className="sticky top-28">
                <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">
                  <div className="mb-6">
                    <div className="flex items-center gap-3 mb-2">
                      <Image
                        src="/santaddeo-logo.png"
                        alt="Santaddeo"
                        width={36}
                        height={36}
                        className="rounded-lg"
                      />
                      <p className="text-sm uppercase tracking-widest text-teal-700 font-medium">Conferma presenza</p>
                    </div>
                    <h2 className="text-2xl font-bold text-foreground">
                      Registrati all&apos;evento
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Compila il form per confermare la tua partecipazione.
                    </p>
                  </div>
                  <EventRegistrationForm />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA bottom */}
      <section className="py-16 bg-gradient-to-br from-teal-900 via-teal-800 to-cyan-900 text-white">
        <div className="container mx-auto px-6 text-center max-w-2xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-balance">
            Mi farebbe davvero piacere averti con noi
          </h2>
          <p className="text-teal-100 text-lg leading-relaxed mb-8">
            E' un passaggio importante. Non solo per Santaddeo, ma per il modo in cui lavoriamo insieme
            da anni. Ti aspetto.
          </p>
          <p className="text-teal-200 text-sm">
            - Filippo
          </p>
        </div>
      </section>

      <Footer />
    </div>
  )
}
