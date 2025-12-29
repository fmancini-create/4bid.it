import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, TrendingUp, Target, Zap, Globe, BarChart3, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ContactButton } from "@/components/contact-button"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { LandingPageTracker } from "@/components/landing-page-tracker"
import { StructuredData } from "@/components/seo-structured-data"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "SANTADDEO - The Human Revenue Manager | 4BID.IT",
  description:
    "SANTADDEO: il primo sistema di Revenue Management Intelligente e Umano che spiega le proprie decisioni e si adatta ad ogni struttura nel mondo.",
  keywords: "santaddeo, revenue management, AI hotel, pricing intelligente, RMS, gestione ricavi hotel",
  openGraph: {
    title: "SANTADDEO - The Human Revenue Manager",
    description: "Il primo sistema di Revenue Management Intelligente e Umano",
    type: "website",
    url: "https://4bid.it/progetti/santaddeo",
    locale: "it_IT",
    siteName: "4BID.IT",
  },
  alternates: {
    canonical: "https://4bid.it/progetti/santaddeo",
  },
}

export default function SantaddeoPage() {
  return (
    <div className="min-h-screen bg-white">
      <StructuredData
        type="Service"
        title="SANTADDEO - The Human Revenue Manager"
        description="Il primo sistema di Revenue Management Intelligente e Umano che spiega le proprie decisioni"
        url="https://4bid.it/progetti/santaddeo"
        image="https://4bid.it/santaddeo-logo.png"
      />

      <LandingPageTracker slug="progetti/santaddeo" />

      <Header />

      {/* Hero Section */}
      <section className="pt-32 pb-16 bg-gradient-to-br from-teal-50 via-cyan-50 to-white">
        <div className="container mx-auto px-6">
          <Link href="/#projects">
            <Button variant="ghost" className="mb-8">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Torna ai Progetti
            </Button>
          </Link>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Image
                src="/santaddeo-logo.png"
                alt="SANTADDEO Logo"
                width={600}
                height={200}
                className="mb-8 max-w-md"
              />
              <h1 className="text-5xl font-bold text-gray-900 mb-6">The Human Revenue Manager</h1>
              <p className="text-xl text-gray-600 leading-relaxed mb-8">
                Il primo sistema di Revenue Management Intelligente e Umano, che spiega le proprie decisioni e si adatta
                ad ogni struttura nel mondo.
              </p>
              <div className="flex gap-4">
                <ContactButton
                  size="lg"
                  className="bg-gradient-to-r from-teal-500 to-cyan-600 text-white hover:from-teal-600 hover:to-cyan-700"
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
                    <span className="text-sm font-bold text-teal-600">75%</span>
                  </div>
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-teal-500 to-cyan-600 w-3/4" />
                  </div>
                </div>
                <div className="pt-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-teal-600" />
                    <span className="text-gray-700">Architettura definita</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-teal-600" />
                    <span className="text-gray-700">Logica di pricing completata</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-teal-600" />
                    <span className="text-gray-700">Dashboard AI in sviluppo avanzato</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
                    <span className="text-gray-500">Integrazione PMS/OTA</span>
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
              <Target className="h-12 w-12 text-red-600 mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Il Problema</h3>
              <p className="text-gray-700 leading-relaxed">
                Gli albergatori non capiscono come i sistemi RMS determinano i prezzi e non possono personalizzarli
                secondo la propria realtà.
              </p>
            </div>

            <div className="bg-teal-50 rounded-2xl p-8">
              <Zap className="h-12 w-12 text-teal-600 mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-4">La Soluzione</h3>
              <p className="text-gray-700 leading-relaxed">
                Un algoritmo trasparente e configurabile che combina AI + logica umana, permettendo di regolare i pesi
                delle variabili (meteo, domanda, eventi, trend, OTA, ecc.) e comprendere ogni scelta di prezzo.
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
                title: "Explainable AI",
                description: "Ogni prezzo ha una spiegazione chiara e comprensibile",
              },
              {
                title: "Personalizzazione Totale",
                description: "Configurabile per stagione, canale e mercato specifico",
              },
              {
                title: "Modello a Performance",
                description: "Paghi solo per i risultati ottenuti, unico nel settore",
              },
              {
                title: "Integrazione Globale",
                description: "Compatibile con PMS, OTA e CRM internazionali",
              },
            ].map((feature, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-lg">
                <CheckCircle2 className="h-8 w-8 text-teal-600 mb-4" />
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
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-2xl p-8 border-2 border-teal-200">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Formula SaaS</h3>
              <p className="text-gray-700 mb-4">Abbonamento mensile con moduli extra personalizzabili</p>
              <div className="space-y-2">
                <p className="text-3xl font-bold text-teal-600">€99 - €499</p>
                <p className="text-sm text-gray-600">al mese</p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-8 border-2 border-amber-200">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Consulenza Integrata</h3>
              <p className="text-gray-700 mb-4">Nessun costo fisso, percentuale sugli incrementi di fatturato</p>
              <div className="space-y-2">
                <p className="text-3xl font-bold text-amber-600">% sui Risultati</p>
                <p className="text-sm text-gray-600">Zero rischio, massima resa</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Market Potential */}
      <section className="py-20 bg-gradient-to-br from-teal-500 to-cyan-600 text-white">
        <div className="container mx-auto px-6 text-center">
          <Globe className="h-16 w-16 mx-auto mb-6 opacity-90" />
          <h2 className="text-4xl font-bold mb-6">Mercato Potenziale</h2>
          <p className="text-xl mb-8 max-w-3xl mx-auto opacity-90">
            Mercato mondiale del Revenue Management Software: oltre 10 miliardi $ entro il 2030, con tasso di crescita
            medio annuo del 15%
          </p>
          <div className="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto mt-12">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <BarChart3 className="h-12 w-12 mx-auto mb-4" />
              <p className="text-4xl font-bold mb-2">5.000</p>
              <p className="text-sm">Strutture target 3 anni</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <TrendingUp className="h-12 w-12 mx-auto mb-4" />
              <p className="text-4xl font-bold mb-2">5 M€</p>
              <p className="text-sm">Ricavi stimati anno 3</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">Interessato al progetto?</h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Contattaci per investire, collaborare o ricevere una demo appena disponibile
          </p>
          <ContactButton
            size="lg"
            className="bg-gradient-to-r from-teal-500 to-cyan-600 text-white hover:from-teal-600 hover:to-cyan-700"
          >
            Contattaci Ora
          </ContactButton>
        </div>
      </section>

      <Footer />
    </div>
  )
}
