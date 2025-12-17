import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, Rocket, MessageSquare, BarChart3, Smartphone, Globe, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"

export const metadata = {
  title: "ManuBot: Gestione Manutenzioni Hotel via WhatsApp | Sistema Smart",
  description:
    "ManuBot è il sistema intelligente per gestire manutenzioni hotel e facility via WhatsApp/Telegram. Zero app da installare, dashboard avanzata per manager. Tracciabilità totale.",
  keywords:
    "manubot, gestione manutenzioni hotel, facility management, whatsapp bot, telegram bot, manutenzioni alberghiere",
  openGraph: {
    title: "ManuBot - Gestione Manutenzioni Intelligente via WhatsApp",
    description: "Il sistema universale che trasforma WhatsApp in un potente strumento di facility management.",
    type: "website",
    url: "https://4bid.it/progetti/manubot",
  },
  alternates: {
    canonical: "https://4bid.it/progetti/manubot",
  },
}

export default function ManubotPage() {
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "ManuBot",
    description:
      "Sistema intelligente di gestione manutenzioni hotel che usa WhatsApp e Telegram per operativi, con dashboard avanzata per manager.",
    url: "https://4bid.it/progetti/manubot",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web, iOS, Android",
    offers: {
      "@type": "Offer",
      price: "39.00",
      priceCurrency: "EUR",
    },
    provider: {
      "@type": "Organization",
      name: "4BID.IT",
      url: "https://4bid.it",
    },
  }

  return (
    <div className="min-h-screen bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }} />
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
              <h1 className="text-5xl font-bold text-gray-900 mb-6">
                ManuBot: Gestione Manutenzioni Hotel via WhatsApp
              </h1>
              <p className="text-xl text-gray-600 leading-relaxed mb-8">
                Il primo sistema che trasforma WhatsApp e Telegram in potenti strumenti di facility management per
                hotel, strutture ricettive e condomini. Zero app da installare per gli operativi.
              </p>
              <div className="flex gap-4">
                <Link href="#contact">
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-orange-500 to-amber-600 text-white hover:from-orange-600 hover:to-amber-700"
                  >
                    Richiedi Demo
                  </Button>
                </Link>
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
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Manutenzioni Hotel: Gestione Caotica e Perdita di Tempo
              </h2>
              <p className="text-gray-700 leading-relaxed">
                Nelle strutture ricettive, aziende e condomini, le richieste di manutenzione arrivano via telefono,
                WhatsApp personale, email sparse. Risultato: nessuna tracciabilità, interventi persi, inefficienza
                totale e conflitti tra team.
              </p>
            </div>

            <div className="bg-orange-50 rounded-2xl p-8">
              <Rocket className="h-12 w-12 text-orange-600 mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Sistema Ibrido: WhatsApp per Operativi, Dashboard per Manager
              </h2>
              <p className="text-gray-700 leading-relaxed">
                ManuBot centralizza tutto in un unico sistema. Gli operativi usano solo WhatsApp/Telegram (che già
                conoscono), mentre i responsabili accedono a una dashboard web completa con statistiche avanzate,
                storico interventi e KPI di performance.
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
          <Link href="/#contact">
            <Button
              size="lg"
              className="bg-gradient-to-r from-orange-500 to-amber-600 text-white hover:from-orange-600 hover:to-amber-700"
            >
              Contattaci Ora
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  )
}
