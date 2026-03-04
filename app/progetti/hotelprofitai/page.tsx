import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, BarChart3, Target, Zap, Globe, TrendingUp, CheckCircle2, Users, ShieldCheck, FileBarChart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ContactButton } from "@/components/contact-button"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { LandingPageTracker } from "@/components/landing-page-tracker"
import { StructuredData } from "@/components/seo-structured-data"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "HOTELPROFITAI - Controllo di Gestione per Hotel | 4BID.IT",
  description:
    "HotelProfitAI: software SaaS di controllo di gestione con team di commercialisti specializzati Ho.Re.Ca. Monitora, analizza e ottimizza i profitti del tuo hotel.",
  keywords: "hotelprofitai, controllo gestione hotel, EBITDA hotel, commercialista hotel, Ho.Re.Ca, software gestionale hotel",
  openGraph: {
    title: "HOTELPROFITAI - Controllo di Gestione per Hotel",
    description: "Software SaaS + commercialisti specializzati Ho.Re.Ca per massimizzare i profitti del tuo hotel",
    type: "website",
    url: "https://4bid.it/progetti/hotelprofitai",
    locale: "it_IT",
    siteName: "4BID.IT",
    images: [{ url: "https://4bid.it/hotelprofitai-logo.jpg", width: 1200, height: 630, alt: "HotelProfitAI by 4BID" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "HOTELPROFITAI - Controllo di Gestione per Hotel",
    description: "Software SaaS + commercialisti specializzati Ho.Re.Ca per massimizzare i profitti del tuo hotel",
    images: ["https://4bid.it/hotelprofitai-logo.jpg"],
  },
  alternates: {
    canonical: "https://4bid.it/progetti/hotelprofitai",
  },
}

export default function HotelProfitAiPage() {
  return (
    <div className="min-h-screen bg-white">
      <StructuredData
        type="Service"
        title="HOTELPROFITAI - Controllo di Gestione per Hotel"
        description="Software SaaS di controllo di gestione con team di commercialisti specializzati Ho.Re.Ca"
        url="https://4bid.it/progetti/hotelprofitai"
        image="https://4bid.it/hotelprofitai-logo.jpg"
      />

      <LandingPageTracker slug="progetti/hotelprofitai" />

      <Header />

      {/* Hero Section */}
      <section className="pt-32 pb-16 bg-gradient-to-br from-blue-50 via-indigo-50 to-white">
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
                src="/hotelprofitai-logo.jpg"
                alt="HOTELPROFITAI Logo"
                width={600}
                height={200}
                className="mb-8 max-w-md rounded-xl"
              />
              <h1 className="text-5xl font-bold text-gray-900 mb-6">Massimizza i Profitti del Tuo Hotel</h1>
              <p className="text-xl text-gray-600 leading-relaxed mb-8">
                Software SaaS di controllo di gestione con team di commercialisti specializzati nel settore Ho.Re.Ca. Monitora, analizza e ottimizza ogni aspetto della tua struttura.
              </p>
              <div className="flex gap-4">
                <ContactButton
                  size="lg"
                  className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white hover:from-blue-800 hover:to-indigo-900"
                >
                  Richiedi Demo Gratuita
                </ContactButton>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h3 className="text-2xl font-bold mb-6 text-gray-900">Stato del Progetto</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Avanzamento</span>
                    <span className="text-sm font-bold text-blue-700">75%</span>
                  </div>
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-blue-700 to-indigo-800 w-3/4" />
                  </div>
                </div>
                <div className="pt-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-blue-700" />
                    <span className="text-gray-700">Architettura piattaforma definita</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-blue-700" />
                    <span className="text-gray-700">Dashboard KPI e report completati</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-blue-700" />
                    <span className="text-gray-700">Analisi EBITDA e redditivita</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
                    <span className="text-gray-500">Integrazione team commercialisti</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Key Stats */}
      <section className="py-12 bg-white border-b">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-3 gap-8 max-w-3xl mx-auto text-center">
            <div>
              <p className="text-4xl font-bold text-blue-700">+28%</p>
              <p className="text-sm text-gray-600 mt-1">Incremento medio EBITDA</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-blue-700">150+</p>
              <p className="text-sm text-gray-600 mt-1">Hotel target anno 1</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-blue-700">24/7</p>
              <p className="text-sm text-gray-600 mt-1">Supporto specializzato</p>
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
                La maggior parte degli hotel non ha un controllo di gestione strutturato. Mancano KPI chiari, report tempestivi e supporto fiscale specializzato nel settore. Questo porta a decisioni basate sull{"'"}intuito anziche sui dati.
              </p>
            </div>

            <div className="bg-blue-50 rounded-2xl p-8">
              <Zap className="h-12 w-12 text-blue-700 mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-4">La Soluzione</h3>
              <p className="text-gray-700 leading-relaxed">
                Una piattaforma SaaS che combina dashboard in tempo reale con KPI alberghieri specifici e un team di commercialisti specializzati Ho.Re.Ca che analizza i dati e fornisce raccomandazioni strategiche mensili.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-4">Tutto Quello che Ti Serve per Crescere</h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">Strumenti professionali e supporto esperto per decisioni strategiche basate su dati reali</p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: BarChart3,
                title: "Controllo di Gestione Avanzato",
                description: "Dashboard in tempo reale con KPI personalizzati per il settore alberghiero. Monitora ricavi, costi e margini.",
              },
              {
                icon: Users,
                title: "Team Commercialisti Ho.Re.Ca",
                description: "Supporto dedicato da professionisti specializzati nel settore alberghiero e della ristorazione.",
              },
              {
                icon: TrendingUp,
                title: "Analisi EBITDA e Redditivita",
                description: "Analisi approfondite per identificare opportunita di crescita e ottimizzazione dei margini.",
              },
              {
                icon: FileBarChart,
                title: "Report Personalizzati",
                description: "Report mensili dettagliati con insights strategici e raccomandazioni operative immediate.",
              },
              {
                icon: Target,
                title: "Budget e Previsioni",
                description: "Strumenti avanzati per pianificazione finanziaria, budget annuali e previsioni stagionali accurate.",
              },
              {
                icon: ShieldCheck,
                title: "Conformita e Sicurezza",
                description: "Conformita normativa garantita e sicurezza dei dati certificata per la tua tranquillita.",
              },
            ].map((feature, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-lg">
                <feature.icon className="h-8 w-8 text-blue-700 mb-4" />
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
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">Modelli di Pricing Flessibili</h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 border-2 border-blue-200">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Canone Mensile</h3>
              <p className="text-gray-700 mb-6">Piano con canone fisso mensile che include piattaforma software completa e supporto del team di commercialisti.</p>
              <div className="space-y-2 mb-6">
                {["Aggiornamenti continui", "Report mensili personalizzati", "Supporto commercialisti dedicato", "Accesso illimitato alla piattaforma"].map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-blue-700 shrink-0" />
                    <span className="text-sm text-gray-700">{item}</span>
                  </div>
                ))}
              </div>
              <ContactButton variant="outline" className="w-full border-blue-700 text-blue-700 hover:bg-blue-50">
                Scopri i Piani
              </ContactButton>
            </div>

            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-8 border-2 border-amber-200 relative">
              <span className="absolute -top-3 right-6 bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded-full">Performance-Based</span>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Fee su Incremento EBITDA</h3>
              <p className="text-gray-700 mb-6">Paghi una percentuale solo sull{"'"}incremento effettivo dell{"'"}EBITDA generato, dopo analisi specialistica iniziale.</p>
              <div className="space-y-2 mb-6">
                {["Incentivo reciproco al successo", "Partnership a lungo termine", "Paghi solo sui risultati", "Analisi iniziale gratuita"].map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-amber-600 shrink-0" />
                    <span className="text-sm text-gray-700">{item}</span>
                  </div>
                ))}
              </div>
              <ContactButton className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600">
                Richiedi Analisi
              </ContactButton>
            </div>
          </div>
        </div>
      </section>

      {/* Market Potential */}
      <section className="py-20 bg-gradient-to-br from-blue-700 to-indigo-800 text-white">
        <div className="container mx-auto px-6 text-center">
          <Globe className="h-16 w-16 mx-auto mb-6 opacity-90" />
          <h2 className="text-4xl font-bold mb-6">Mercato Potenziale</h2>
          <p className="text-xl mb-8 max-w-3xl mx-auto opacity-90">
            Il mercato del controllo di gestione alberghiero e in forte crescita, con oltre 33.000 strutture alberghiere solo in Italia che necessitano di strumenti professionali.
          </p>
          <div className="grid md:grid-cols-3 gap-8 max-w-3xl mx-auto mt-12">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <BarChart3 className="h-12 w-12 mx-auto mb-4" />
              <p className="text-4xl font-bold mb-2">33k+</p>
              <p className="text-sm">Hotel in Italia</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <TrendingUp className="h-12 w-12 mx-auto mb-4" />
              <p className="text-4xl font-bold mb-2">+28%</p>
              <p className="text-sm">EBITDA medio clienti</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <Users className="h-12 w-12 mx-auto mb-4" />
              <p className="text-4xl font-bold mb-2">150+</p>
              <p className="text-sm">Hotel target anno 1</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">Pronto a Massimizzare i Profitti?</h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Richiedi una demo gratuita e scopri come HotelProfitAI puo trasformare la gestione della tua struttura
          </p>
          <ContactButton
            size="lg"
            className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white hover:from-blue-800 hover:to-indigo-900"
          >
            Richiedi Demo Gratuita
          </ContactButton>
        </div>
      </section>

      <Footer />
    </div>
  )
}
