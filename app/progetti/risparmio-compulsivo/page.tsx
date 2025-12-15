import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, PiggyBank, Trophy, Users, Globe, Smartphone, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import Header from "@/components/header"
import Footer from "@/components/footer"

export default function RisparmioCompulsivoPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero Section */}
      <section className="pt-32 pb-16 bg-gradient-to-br from-green-50 via-emerald-50 to-white">
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
                src="/risparmio-compulsivo-logo.png"
                alt="RISPARMIO COMPULSIVO Logo"
                width={500}
                height={200}
                className="mb-8 max-w-md"
              />
              <h1 className="text-5xl font-bold text-gray-900 mb-6">Save. Play. Win.</h1>
              <p className="text-xl text-gray-600 leading-relaxed mb-8">
                L'app che trasforma il risparmio personale in un gioco globale, motivante e automatico.
              </p>
              <div className="flex gap-4">
                <Link href="#contact">
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-green-600 to-emerald-700 text-white hover:from-green-700 hover:to-emerald-800"
                  >
                    Richiedi Accesso Beta
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
                    <span className="text-sm font-bold text-green-600">70%</span>
                  </div>
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-green-600 to-emerald-700 w-[70%]" />
                  </div>
                </div>
                <div className="pt-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span className="text-gray-700">Architettura completa</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span className="text-gray-700">UX e gamification definite</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span className="text-gray-700">Sistema reward pronto</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
                    <span className="text-gray-500">Integrazione API bancarie</span>
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
              <PiggyBank className="h-12 w-12 text-red-600 mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Il Problema</h3>
              <p className="text-gray-700 leading-relaxed">
                Nel mondo, il 70% delle persone non riesce a risparmiare con costanza: mancano disciplina, motivazione e
                gratificazione immediata.
              </p>
            </div>

            <div className="bg-green-50 rounded-2xl p-8">
              <Trophy className="h-12 w-12 text-green-600 mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-4">La Soluzione</h3>
              <p className="text-gray-700 leading-relaxed">
                Un'app che connette il conto dell'utente e crea salvadanai bloccati con risparmio automatico, sfide
                gamificate, premi, classifiche e una community internazionale motivante.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">Funzionalità Principali</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: PiggyBank,
                title: "Risparmio Automatico",
                description: "Accantonamenti progressivi e automatici basati sulle tue abitudini",
              },
              {
                icon: Trophy,
                title: "Sfide Giornaliere",
                description: "Obiettivi e challenge che rendono il risparmio un gioco divertente",
              },
              {
                icon: Users,
                title: "Community Globale",
                description: "Connettiti con risparmiatori di tutto il mondo",
              },
              {
                icon: CheckCircle2,
                title: "Blocco Reale",
                description: "I tuoi risparmi sono bloccati fino al raggiungimento dell'obiettivo",
              },
              {
                icon: Smartphone,
                title: "Design Emozionale",
                description: "Interfaccia coinvolgente che motiva ogni giorno",
              },
              {
                icon: Globe,
                title: "Open Banking",
                description: "Integrazione sicura con le principali banche europee",
              },
            ].map((feature, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-lg">
                <feature.icon className="h-8 w-8 text-green-600 mb-4" />
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
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-8 border-2 border-green-200">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Freemium</h3>
              <p className="text-4xl font-bold text-green-600 mb-2">Gratis</p>
              <p className="text-sm text-gray-600">Funzionalità base</p>
            </div>

            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-8 border-2 border-emerald-300">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Premium</h3>
              <p className="text-4xl font-bold text-emerald-600 mb-2">€2,99</p>
              <p className="text-sm text-gray-600">al mese</p>
            </div>

            <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-2xl p-8 border-2 border-teal-200">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Partnership</h3>
              <p className="text-gray-700 text-sm">Fee su transazioni + API open banking</p>
            </div>
          </div>
        </div>
      </section>

      {/* Market Potential */}
      <section className="py-20 bg-gradient-to-br from-green-600 to-emerald-700 text-white">
        <div className="container mx-auto px-6 text-center">
          <Globe className="h-16 w-16 mx-auto mb-6 opacity-90" />
          <h2 className="text-4xl font-bold mb-6">Mercato Potenziale</h2>
          <p className="text-xl mb-8 max-w-3xl mx-auto opacity-90">
            Mercato globale "digital saving & finance wellness": oltre 25 miliardi $ entro il 2030
          </p>
          <div className="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto mt-12">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <Users className="h-12 w-12 mx-auto mb-4" />
              <p className="text-4xl font-bold mb-2">1M</p>
              <p className="text-sm">Utenti target 3 anni</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <Trophy className="h-12 w-12 mx-auto mb-4" />
              <p className="text-4xl font-bold mb-2">10 M€</p>
              <p className="text-sm">Ricavi stimati anno 3</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">Vuoi essere tra i primi?</h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Iscriviti alla beta o contattaci per investire in questa rivoluzione del risparmio
          </p>
          <Link href="/#contact">
            <Button
              size="lg"
              className="bg-gradient-to-r from-green-600 to-emerald-700 text-white hover:from-green-700 hover:to-emerald-800"
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
