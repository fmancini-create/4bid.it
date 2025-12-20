import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, Rocket, MessageSquare, BarChart3, Smartphone, Globe, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { LandingPageTracker } from "@/components/landing-page-tracker"
import { ContactButton } from "@/components/contact-button"
import { StructuredData } from "@/components/seo-structured-data"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "MANUBOT - Sistema Smart di Gestione Manutenzioni | 4BID.IT",
  description:
    "MANUBOT: il sistema universale di gestione manutenzioni che usa WhatsApp e Telegram. Dashboard completa, zero app da installare, perfetto per hotel e strutture ricettive.",
  keywords:
    "manubot, gestione manutenzioni hotel, sistema manutenzione, whatsapp business, telegram bot, facility management, gestione interventi",
  openGraph: {
    title: "MANUBOT - Sistema Smart di Gestione Manutenzioni",
    description: "Il sistema di gestione manutenzioni che parla la lingua di tutti: WhatsApp e Telegram",
    type: "website",
    url: "https://4bid.it/progetti/manubot",
    locale: "it_IT",
    siteName: "4BID.IT",
    images: [
      {
        url: "https://4bid.it/manubot-logo.jpg",
        width: 1200,
        height: 630,
        alt: "MANUBOT Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "MANUBOT - Sistema Smart di Gestione Manutenzioni",
    description: "Gestione manutenzioni via WhatsApp e Telegram con dashboard completa",
    images: ["https://4bid.it/manubot-logo.jpg"],
  },
  alternates: {
    canonical: "https://4bid.it/progetti/manubot",
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

export default function ManubotPage() {
  return (
    <div className="min-h-screen bg-white">
      <StructuredData
        type="Service"
        title="MANUBOT - Sistema Gestione Manutenzioni"
        description="Sistema universale di gestione manutenzioni via WhatsApp e Telegram per hotel e strutture ricettive"
        url="https://4bid.it/progetti/manubot"
        image="https://4bid.it/manubot-logo.jpg"
      />

      <LandingPageTracker slug="progetti/manubot" />

      <Header />

      {/* Hero Section */}
      <section className="pt-32 pb-16 bg-gradient-to-br from-orange-50 via-amber-50 to-white">
        <div className="container mx-auto px-6">
          <Link href="/#projects">
            <Button variant="ghost" className="mb-8">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Torna ai Progetti
            </Button>
          </Link>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Image src="/manubot-logo.jpg" alt="MANUBOT Logo" width={500} height={200} className="mb-8 max-w-md" />
              <h1 className="text-5xl font-bold text-gray-900 mb-6">The Smart Maintenance Assistant</h1>
              <p className="text-xl text-gray-600 leading-relaxed mb-8">
                Il sistema universale di gestione e automazione delle manutenzioni che parla la lingua di tutti:
                WhatsApp e Telegram.
              </p>
              <div className="flex gap-4">
                <ContactButton
                  size="lg"
                  className="bg-gradient-to-r from-orange-500 to-amber-600 text-white hover:from-orange-600 hover:to-amber-700"
                >
                  Richiedi Demo
                </ContactButton>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h3 className="text-2xl font-bold mb-6 text-gray-900">Stato del Progetto</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Avanzamento</span>
                    <span className="text-sm font-bold text-orange-600">75%</span>
                  </div>
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-orange-500 to-amber-600 w-3/4" />
                  </div>
                </div>
                <div className="pt-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-orange-600" />
                    <span className="text-gray-700">Bot Telegram/WhatsApp funzionante</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-orange-600" />
                    <span className="text-gray-700">Database operativo</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-orange-600" />
                    <span className="text-gray-700">Sistema ticket completo</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
                    <span className="text-gray-500">Dashboard reportistica avanzata</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem & Solution */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12">
            <div className="bg-red-50 rounded-2xl p-8">
              <MessageSquare className="h-12 w-12 text-red-600 mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Il Problema</h3>
              <p className="text-gray-700 leading-relaxed">
                Nelle strutture ricettive, aziende o condomini, le manutenzioni vengono spesso gestite in modo caotico:
                chiamate, messaggi sparsi, assenza di tracciabilità e nessun controllo sull'avanzamento dei lavori.
              </p>
            </div>

            <div className="bg-orange-50 rounded-2xl p-8">
              <Rocket className="h-12 w-12 text-orange-600 mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-4">La Soluzione</h3>
              <p className="text-gray-700 leading-relaxed">
                Un sistema ibrido e intelligente: gli operativi usano solo WhatsApp/Telegram (semplice e familiare),
                mentre i manager hanno una dashboard completa con statistiche, storico interventi e performance del
                team.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">Vantaggi Competitivi</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: Smartphone,
                title: "Zero App da Installare",
                description: "Gli operativi usano solo WhatsApp o Telegram",
              },
              {
                icon: BarChart3,
                title: "Dashboard Completa",
                description: "Interfaccia manageriale con statistiche avanzate",
              },
              {
                icon: CheckCircle2,
                title: "Totale Tracciabilità",
                description: "Foto, firme digitali e storico completo",
              },
              {
                icon: Globe,
                title: "Moduli Personalizzabili",
                description: "Integrazione futura con IoT e sensori",
              },
            ].map((feature, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-lg">
                <feature.icon className="h-8 w-8 text-orange-600 mb-4" />
                <h3 className="text-lg font-bold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Business Model */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">Business Model</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-8 border-2 border-orange-200">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Abbonamento Base</h3>
              <p className="text-4xl font-bold text-orange-600 mb-2">€39 - €299</p>
              <p className="text-sm text-gray-600">al mese</p>
            </div>

            <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-2xl p-8 border-2 border-amber-200">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Moduli Opzionali</h3>
              <p className="text-gray-700 text-sm mb-2">ReClean per pulizie</p>
              <p className="text-gray-700 text-sm">Planner manutenzioni</p>
            </div>

            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl p-8 border-2 border-yellow-200">
              <h3 className="text-xl font-bold text-gray-900 mb-4">White Label</h3>
              <p className="text-gray-700 text-sm">Licenze personalizzate per gruppi e catene</p>
            </div>
          </div>
        </div>
      </section>

      {/* Market Potential */}
      <section className="py-20 bg-gradient-to-br from-orange-500 to-amber-600 text-white">
        <div className="container mx-auto px-6 text-center">
          <Globe className="h-16 w-16 mx-auto mb-6 opacity-90" />
          <h2 className="text-4xl font-bold mb-6">Mercato Potenziale</h2>
          <p className="text-xl mb-8 max-w-3xl mx-auto opacity-90">
            Mercato globale dei software per manutenzione e facility management: oltre 80 miliardi $ entro il 2030,
            crescita media del 14% annuo
          </p>
          <div className="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto mt-12">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <BarChart3 className="h-12 w-12 mx-auto mb-4" />
              <p className="text-4xl font-bold mb-2">10.000</p>
              <p className="text-sm">Utenti target 3 anni</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <Rocket className="h-12 w-12 mx-auto mb-4" />
              <p className="text-4xl font-bold mb-2">3 M€</p>
              <p className="text-sm">Ricavi stimati anno 3</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">Vuoi provare ManuBot?</h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Contattaci per una demo o per discutere opportunità di investimento e collaborazione
          </p>
          <ContactButton
            size="lg"
            className="bg-gradient-to-r from-orange-500 to-amber-600 text-white hover:from-orange-600 hover:to-amber-700"
          >
            Contattaci Ora
          </ContactButton>
        </div>
      </section>

      <Footer />
    </div>
  )
}
