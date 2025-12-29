import Link from "next/link"
import { ArrowLeft, Globe, CheckCircle2, Mail, MessageSquare, BarChart3, Sparkles, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { LandingPageTracker } from "@/components/landing-page-tracker"
import { ContactButton } from "@/components/contact-button"
import { StructuredData } from "@/components/seo-structured-data"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "HOTEL ACCELERATOR - Il Software Gestionale Completo per Hotel | 4BID.IT",
  description:
    "Hotel Accelerator: CMS, CRM, Email Marketing, Inbox Omnicanale e AI in un'unica soluzione. Aumenta le prenotazioni dirette fino al 35% e riduci le commissioni OTA.",
  keywords:
    "hotel accelerator, software gestionale hotel, cms hotel, crm alberghiero, email marketing hotel, inbox omnicanale, ai hotel, prenotazioni dirette",
  openGraph: {
    title: "HOTEL ACCELERATOR - Il Software Gestionale Completo per Hotel",
    description: "CMS, CRM, Email Marketing, Inbox Omnicanale e AI in un'unica soluzione per strutture ricettive",
    type: "website",
    url: "https://4bid.it/progetti/hotel-accelerator",
    locale: "it_IT",
    siteName: "4BID.IT",
    images: [
      {
        url: "https://4bid.it/hotel-accelerator-logo.jpg",
        width: 1200,
        height: 630,
        alt: "Hotel Accelerator Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "HOTEL ACCELERATOR - Il Software Gestionale Completo per Hotel",
    description: "CMS, CRM, Email Marketing, Inbox Omnicanale e AI in un'unica soluzione",
    images: ["https://4bid.it/hotel-accelerator-logo.jpg"],
  },
  alternates: {
    canonical: "https://4bid.it/progetti/hotel-accelerator",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
}

export default function HotelAcceleratorPage() {
  const features = [
    {
      icon: Globe,
      title: "CMS per Hotel",
      description:
        "Sito web professionale con SEO ottimizzato. Multilingua, mobile-first, veloce. Gestisci contenuti senza competenze tecniche.",
      stat: "+300%",
      statLabel: "visibilità organica",
      color: "bg-green-500/10 text-green-500",
    },
    {
      icon: Users,
      title: "CRM Alberghiero",
      description:
        "Gestione contatti centralizzata, segmentazione avanzata, tracking prenotazioni e lead scoring automatico.",
      stat: "+45%",
      statLabel: "retention ospiti",
      color: "bg-blue-500/10 text-blue-500",
    },
    {
      icon: Mail,
      title: "Email Marketing",
      description:
        "Campagne automatizzate pre e post soggiorno, template professionali, A/B testing e analytics dettagliati.",
      stat: "2x",
      statLabel: "engagement rate",
      color: "bg-yellow-500/10 text-yellow-500",
    },
    {
      icon: MessageSquare,
      title: "Inbox Omnicanale",
      description:
        "Email, WhatsApp, Telegram e Chat in un'unica inbox. Rispondi da un solo posto, mai più messaggi persi.",
      stat: "-50%",
      statLabel: "tempo risposta",
      color: "bg-purple-500/10 text-purple-500",
    },
    {
      icon: BarChart3,
      title: "Analytics Avanzati",
      description: "Dashboard in tempo reale, tracking eventi, attribution model e insight per decisioni data-driven.",
      stat: "+25%",
      statLabel: "conversioni",
      color: "bg-cyan-500/10 text-cyan-500",
    },
    {
      icon: Sparkles,
      title: "AI Assistant",
      description: "Risposte automatiche intelligenti 24/7, suggerimenti personalizzati, analisi intento ospiti.",
      stat: "24/7",
      statLabel: "disponibilità",
      color: "bg-pink-500/10 text-pink-500",
    },
  ]

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <StructuredData
        type="Service"
        title="HOTEL ACCELERATOR - Il Software Gestionale Completo per Hotel"
        description="Piattaforma SaaS per strutture ricettive: CMS, CRM, Email Marketing, Inbox Omnicanale e AI in un'unica soluzione"
        url="https://4bid.it/progetti/hotel-accelerator"
        image="https://4bid.it/hotel-accelerator-logo.jpg"
      />

      <LandingPageTracker slug="progetti/hotel-accelerator" />

      <Header />

      {/* Hero Section - Dark theme like hotelaccelerator.com */}
      <section className="pt-32 pb-16 bg-[#0a0a0a]">
        <div className="container mx-auto px-6">
          <Link href="/#projects">
            <Button variant="ghost" className="mb-8 text-gray-400 hover:text-white hover:bg-white/10">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Torna ai Progetti
            </Button>
          </Link>

          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8">
              <Sparkles className="h-4 w-4 text-green-400" />
              <span className="text-sm text-gray-300">Piattaforma SaaS per strutture ricettive</span>
            </div>

            {/* Title */}
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              <span className="text-white">Il software</span>
              <br />
              <span className="text-white">gestionale</span>
              <br />
              <span className="text-yellow-400 italic">completo per hotel</span>
            </h1>

            {/* Subtitle */}
            <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
              <span className="text-white font-semibold">CMS, CRM, Email Marketing, Inbox Omnicanale e AI</span> in
              un'unica soluzione. Aumenta le prenotazioni dirette fino al 35% e riduci le commissioni OTA.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Link href="https://www.hotelaccelerator.com" target="_blank">
                <Button size="lg" className="bg-white text-black hover:bg-gray-200 px-8">
                  Richiedi Demo Gratuita
                  <ArrowLeft className="h-4 w-4 ml-2 rotate-180" />
                </Button>
              </Link>
              <ContactButton size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10">
                Contattaci
              </ContactButton>
            </div>

            {/* Stats - Real data from hotelaccelerator.com */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-8 border-t border-white/10">
              <div className="text-center">
                <p className="text-4xl font-bold text-white mb-1">+35%</p>
                <p className="text-sm text-gray-500">Prenotazioni dirette</p>
              </div>
              <div className="text-center">
                <p className="text-4xl font-bold text-white mb-1">-50%</p>
                <p className="text-sm text-gray-500">Tempo di risposta</p>
              </div>
              <div className="text-center">
                <p className="text-4xl font-bold text-white mb-1">2x</p>
                <p className="text-sm text-gray-500">Engagement email</p>
              </div>
              <div className="text-center">
                <p className="text-4xl font-bold text-white mb-1">150+</p>
                <p className="text-sm text-gray-500">Hotel soddisfatti</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Project Status */}
      <section className="py-12 bg-[#0a0a0a] border-t border-white/10">
        <div className="container mx-auto px-6">
          <div className="max-w-xl mx-auto bg-white/5 rounded-2xl p-8 border border-white/10">
            <h3 className="text-xl font-bold mb-6 text-white">Stato del Progetto 4BID.IT</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium text-gray-400">Avanzamento</span>
                  <span className="text-sm font-bold text-blue-400">70%</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 w-[70%]" />
                </div>
              </div>
              <div className="pt-4 space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <span className="text-gray-300">CMS e CRM operativi</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <span className="text-gray-300">Email Marketing attivo</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <span className="text-gray-300">Inbox Omnicanale funzionante</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-5 w-5 rounded-full border-2 border-gray-600" />
                  <span className="text-gray-500">AI Assistant in sviluppo</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-5 w-5 rounded-full border-2 border-gray-600" />
                  <span className="text-gray-500">Analytics avanzati in beta</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Dark theme */}
      <section className="py-20 bg-[#111111]">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Tutto quello che serve al tuo hotel</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Una suite completa di strumenti progettati specificamente per le strutture ricettive italiane
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white/5 rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-colors"
              >
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl ${feature.color} mb-4`}>
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-gray-400 text-sm mb-4 leading-relaxed">{feature.description}</p>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-lg font-bold ${feature.color.includes("text-") ? feature.color.split(" ")[1] : "text-green-400"}`}
                  >
                    {feature.stat}
                  </span>
                  <span className="text-sm text-gray-500">{feature.statLabel}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-[#0a0a0a]">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">Vuoi saperne di più?</h2>
          <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
            Visita il sito ufficiale o contattaci per informazioni su investimenti e collaborazioni
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="https://www.hotelaccelerator.com" target="_blank">
              <Button size="lg" className="bg-white text-black hover:bg-gray-200">
                Vai a HotelAccelerator.com
              </Button>
            </Link>
            <ContactButton
              size="lg"
              className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700"
            >
              Contattaci per Investire
            </ContactButton>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
