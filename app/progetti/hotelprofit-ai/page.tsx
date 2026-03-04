import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, TrendingUp, BarChart3, LineChart, PieChart, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { LandingPageTracker } from "@/components/landing-page-tracker"
import { ContactButton } from "@/components/contact-button"
import { StructuredData } from "@/components/seo-structured-data"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "HotelProfitAI - Controllo di Gestione Intelligente per Hotel | 4BID.IT",
  description:
    "HotelProfitAI: massimizza i profitti del tuo hotel con team di commercialisti specializzati supportati dall'AI. Analisi real-time, forecasting e consigli personalizzati.",
  keywords:
    "hotel profit, controllo gestione hotel, ai hotel, revenue management, profit optimization, hospitality, business intelligence",
  openGraph: {
    title: "HotelProfitAI - Controllo di Gestione Intelligente",
    description: "Massimizza i profitti del tuo hotel con intelligenza artificiale e competenza umana",
    type: "website",
    url: "https://4bid.it/progetti/hotelprofit-ai",
    locale: "it_IT",
    siteName: "4BID.IT",
    images: [
      {
        url: "https://4bid.it/hotelprofit-ai-logo.png",
        width: 1200,
        height: 630,
        alt: "HotelProfitAI Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "HotelProfitAI - Controllo di Gestione Intelligente",
    description: "Analisi real-time e forecasting per massimizzare i profitti",
    images: ["https://4bid.it/hotelprofit-ai-logo.png"],
  },
  alternates: {
    canonical: "https://4bid.it/progetti/hotelprofit-ai",
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function HotelProfitAiPage() {
  return (
    <div className="min-h-screen bg-white">
      <StructuredData
        type="Service"
        title="HotelProfitAI - Controllo di Gestione Intelligente"
        description="Piattaforma di controllo di gestione per hotel con AI e team di commercialisti specializzati"
        url="https://4bid.it/progetti/hotelprofit-ai"
        image="https://4bid.it/hotelprofit-ai-logo.png"
      />

      <LandingPageTracker slug="progetti/hotelprofit-ai" />

      <Header />

      {/* Hero Section */}
      <section className="pt-32 pb-16 bg-gradient-to-br from-blue-50 via-green-50 to-white">
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
                src="/hotelprofit-ai-logo.png"
                alt="HotelProfitAI Logo"
                width={400}
                height={300}
                className="mb-8 max-w-md"
              />
              <h1 className="text-5xl font-bold text-gray-900 mb-6">Controllo di Gestione Intelligente</h1>
              <p className="text-xl text-gray-600 leading-relaxed mb-8">
                Massimizza i profitti del tuo hotel con un team di commercialisti specializzati supportati dall'AI.
                Analisi real-time, forecasting e consigli personalizzati per ogni aspetto della tua struttura.
              </p>
              <div className="flex gap-4">
                <ContactButton
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 to-green-600 text-white hover:from-blue-700 hover:to-green-700"
                >
                  Richiedi Demo
                </ContactButton>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h3 className="text-2xl font-bold mb-6 text-gray-900">Stato del Progetto</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-700 font-semibold">Avanzamento</span>
                    <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-green-600">
                      100% testing
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div className="bg-gradient-to-r from-blue-600 to-green-600 h-3 rounded-full" style={{ width: "100%" }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Caratteristiche */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-16 text-gray-900">Le Nostre Caratteristiche</h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <div className="bg-white rounded-xl p-8 shadow-lg">
              <BarChart3 className="h-12 w-12 text-blue-600 mb-4" />
              <h3 className="text-2xl font-bold mb-3 text-gray-900">Analisi Real-Time</h3>
              <p className="text-gray-600">Monitora ogni metrica importante della tua struttura con dashboard interattive e alert automatici.</p>
            </div>
            <div className="bg-white rounded-xl p-8 shadow-lg">
              <LineChart className="h-12 w-12 text-green-600 mb-4" />
              <h3 className="text-2xl font-bold mb-3 text-gray-900">Forecasting Intelligente</h3>
              <p className="text-gray-600">Predizioni accurate sui ricavi futuri grazie a modelli AI addestrati sui dati del settore hospitality.</p>
            </div>
            <div className="bg-white rounded-xl p-8 shadow-lg">
              <PieChart className="h-12 w-12 text-purple-600 mb-4" />
              <h3 className="text-2xl font-bold mb-3 text-gray-900">Consigli Personalizzati</h3>
              <p className="text-gray-600">Raccomandazioni specifiche per ottimizzare prezzi, costi e strategie commerciali in base ai tuoi dati.</p>
            </div>
            <div className="bg-white rounded-xl p-8 shadow-lg">
              <TrendingUp className="h-12 w-12 text-orange-600 mb-4" />
              <h3 className="text-2xl font-bold mb-3 text-gray-900">Team di Esperti</h3>
              <p className="text-gray-600">Commercialisti specializzati nel settore hospitality a supporto dell'intelligenza artificiale per consulenze dirette.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefici */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-16 text-gray-900">Vantaggi per il Tuo Hotel</h2>
          <div className="max-w-3xl mx-auto space-y-4">
            {[
              "Aumenta i profitti operativi fino al 25%",
              "Riduci i costi eliminando inefficienze",
              "Ottimizza i prezzi con AI in tempo reale",
              "Accesso a team di commercialisti specializzati",
              "Reportistica completa e insight predittivi",
              "Integrazione con i tuoi sistemi esistenti",
            ].map((benefit, index) => (
              <div key={index} className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0" />
                <span className="text-lg text-gray-700">{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-green-600">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold text-white mb-8">Pronto a Massimizzare i Tuoi Profitti?</h2>
          <p className="text-xl text-blue-50 mb-12 max-w-3xl mx-auto">
            Scopri come HotelProfitAI può trasformare la gestione del tuo hotel con intelligenza artificiale e competenza umana.
          </p>
          <ContactButton
            size="lg"
            className="bg-white text-blue-600 hover:bg-gray-50 font-semibold"
          >
            Richiedi una Consulenza
          </ContactButton>
        </div>
      </section>

      <Footer />
    </div>
  )
}
