import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, CheckCircle, TrendingUp, BarChart3, FileSpreadsheet, Zap, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { LandingPageTracker } from "@/components/landing-page-tracker"
import { StructuredData } from "@/components/seo-structured-data"

export const metadata = {
  title: "AutoExel - Il primo Excel per chi non sa usare Excel | 4BID",
  description:
    "Carica un file Excel o CSV per ottenere analisi automatiche, KPI e grafici. Oppure crea fogli intelligenti usando comandi in linguaggio naturale — senza formule.",
  alternates: {
    canonical: "https://4bid.it/progetti/autoexel",
  },
}

export default function AutoExelPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <StructuredData
        type="SoftwareApplication"
        title="AutoExel - Il primo Excel per chi non sa usare Excel"
        description="Carica un file Excel o CSV per ottenere analisi automatiche, KPI e grafici. Oppure crea fogli intelligenti usando comandi in linguaggio naturale."
        url="https://4bid.it/progetti/autoexel"
        softwareCategory="BusinessApplication"
        operatingSystem="Web"
        breadcrumbs={[
          { name: "Home", url: "https://4bid.it" },
          { name: "Progetti", url: "https://4bid.it/#projects" },
          { name: "AutoExel", url: "https://4bid.it/progetti/autoexel" },
        ]}
      />
      <LandingPageTracker slug="progetti/autoexel" />

      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-r from-green-500 to-emerald-600 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="container mx-auto px-6 relative z-10">
          <Link
            href="/#projects"
            className="inline-flex items-center gap-2 text-white/90 hover:text-white mb-8 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Torna ai progetti</span>
          </Link>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
                <CheckCircle className="h-5 w-5" />
                <span className="font-semibold">On line</span>
              </div>
              <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">AUTOEXEL</h1>
              <p className="text-2xl mb-8 text-white/90">Il primo Excel per chi non sa usare Excel</p>
              <p className="text-lg leading-relaxed mb-8 text-white/80">
                Carica un file Excel o CSV per ottenere analisi automatiche, KPI e grafici. Oppure crea da zero un
                foglio intelligente usando comandi in linguaggio naturale — senza formule.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button asChild size="lg" className="bg-white text-green-600 hover:bg-white/90 shadow-lg">
                  <a href="https://www.autoexel.it" target="_blank" rel="noopener noreferrer">
                    Visita AutoExel
                  </a>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-white text-white hover:bg-white/10 bg-transparent"
                >
                  <Link href="/#contact">Contattaci</Link>
                </Button>
              </div>
            </div>

            <div className="flex justify-center">
              <div className="bg-white p-8 rounded-3xl shadow-2xl">
                <Image
                  src="/autoexel-logo.png"
                  alt="AutoExel Logo"
                  width={400}
                  height={400}
                  className="object-contain"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">Il Problema</h2>
            <div className="w-24 h-1 bg-green-500 mb-8"></div>
            <p className="text-xl text-gray-700 leading-relaxed">
              Milioni di persone nel mondo devono analizzare dati ma non conoscono Excel o trovano le formule troppo
              complesse. Le aziende perdono tempo prezioso in analisi manuali, e molti professionisti evitano
              completamente i fogli di calcolo per paura di sbagliare.
            </p>
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">La Soluzione</h2>
            <div className="w-24 h-1 bg-green-500 mb-8"></div>
            <p className="text-xl text-gray-700 leading-relaxed mb-8">
              AutoExel è un sistema intelligente che permette di analizzare dati e creare fogli di calcolo senza
              conoscere formule o funzioni complesse.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mb-6">
                <FileSpreadsheet className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Carica e Analizza</h3>
              <p className="text-gray-600 leading-relaxed">
                Trascina un file Excel/CSV e ottieni automaticamente KPI, grafici e insight in pochi secondi
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mb-6">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">AI senza formule</h3>
              <p className="text-gray-600 leading-relaxed">
                Scrivi comandi naturali tipo "somma questa colonna" o "calcola la media" - l'AI esegue tutto per te
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mb-6">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Grafici dinamici</h3>
              <p className="text-gray-600 leading-relaxed">
                Visualizzazioni chiare e professionali generate automaticamente dai tuoi dati
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mb-6">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">KPI intelligenti</h3>
              <p className="text-gray-600 leading-relaxed">
                Valori chiave estratti automaticamente: totali, medie, trend e confronti
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mb-6">
                <Download className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Report PDF</h3>
              <p className="text-gray-600 leading-relaxed">
                Scarica analisi e grafici in formato PDF professionale da condividere con il team
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mb-6">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Spiegazione umana</h3>
              <p className="text-gray-600 leading-relaxed">
                Risultati spiegati in linguaggio semplice e comprensibile, non in gergo tecnico
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Business Model Section */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">Business Model</h2>
            <div className="w-24 h-1 bg-green-500 mb-8"></div>

            <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-8 rounded-2xl border border-green-100 mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Modello Freemium + Premium</h3>
              <ul className="space-y-4 text-gray-700">
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>Piano Free:</strong> 1 file al mese, 1 analisi, 1 foglio vuoto, 20 operazioni AI
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>Piano Pro (12,90€/mese):</strong> File illimitati, analisi illimitate, AI illimitata, export
                    PDF
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>Piano Business (39€/mese):</strong> 3 utenti, template, cartelle condivise, log attività
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Market Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">Mercato Potenziale</h2>
            <div className="w-24 h-1 bg-green-500 mb-8"></div>
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
              <p className="text-xl text-gray-700 leading-relaxed mb-6">
                Mercato globale dei tool di analisi dati e BI semplificati: oltre <strong>30 miliardi $</strong> entro
                il 2030, con crescita media annua del 12%.
              </p>
              <p className="text-lg text-gray-600">
                Target: piccole imprese, freelancer, professionisti non tecnici, studenti e chiunque lavori con dati ma
                non conosca Excel avanzato.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Competitive Advantages */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">Vantaggi Competitivi</h2>
            <div className="w-24 h-1 bg-green-500 mb-8"></div>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-xl border border-green-100">
                <h3 className="text-lg font-bold text-gray-900 mb-2">Zero competenze richieste</h3>
                <p className="text-gray-700">Utilizzo immediato senza formazione o tutorial</p>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-xl border border-green-100">
                <h3 className="text-lg font-bold text-gray-900 mb-2">Linguaggio naturale</h3>
                <p className="text-gray-700">Comandi in italiano, senza formule da memorizzare</p>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-xl border border-green-100">
                <h3 className="text-lg font-bold text-gray-900 mb-2">Analisi istantanea</h3>
                <p className="text-gray-700">KPI e grafici generati in pochi secondi</p>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-xl border border-green-100">
                <h3 className="text-lg font-bold text-gray-900 mb-2">Spiegazioni chiare</h3>
                <p className="text-gray-700">Risultati in linguaggio semplice, non tecnico</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Status Section */}
      <section className="py-20 bg-gradient-to-r from-green-500 to-emerald-600 text-white">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-3 bg-white/20 backdrop-blur-sm px-6 py-3 rounded-full mb-8">
              <CheckCircle className="h-6 w-6" />
              <span className="text-xl font-bold">Progetto On line</span>
            </div>
            <h2 className="text-4xl font-bold mb-6">AutoExel è disponibile ora!</h2>
            <p className="text-xl mb-8 text-white/90">
              La piattaforma è online e già utilizzata da centinaia di utenti per analizzare dati senza competenze
              tecniche.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Button asChild size="lg" className="bg-white text-green-600 hover:bg-white/90 shadow-lg">
                <a href="https://www.autoexel.it" target="_blank" rel="noopener noreferrer">
                  Prova AutoExel Gratis
                </a>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white/10 bg-transparent"
              >
                <Link href="/#contact">Richiedi una Demo</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">Vuoi saperne di più?</h2>
            <p className="text-xl text-gray-600 mb-8">
              Contattaci per maggiori informazioni su AutoExel, partnership commerciali o opportunità di investimento
            </p>
            <Link href="/#contact">
              <Button
                size="lg"
                className="bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 shadow-lg"
              >
                Contattaci Ora
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
