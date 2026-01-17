import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, CheckCircle, Heart, Camera, FileText, Bell, Users, Stethoscope } from "lucide-react"
import { Button } from "@/components/ui/button"
import { LandingPageTracker } from "@/components/landing-page-tracker"
import { StructuredData } from "@/components/seo-structured-data"

export const metadata = {
  title: "MyPetSenseAI - AI Health Monitoring for Dogs | 4BID",
  description:
    "Analizza foto, monitora la salute quotidiana e ricevi consigli personalizzati dall'intelligenza artificiale per il benessere del tuo cane.",
  alternates: {
    canonical: "https://4bid.it/progetti/mypetsenseai",
  },
}

export default function MypetSenseAIPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <StructuredData
        type="SoftwareApplication"
        title="MyPetSenseAI - AI Health Monitoring for Dogs"
        description="Analizza foto, monitora la salute quotidiana e ricevi consigli personalizzati dall'intelligenza artificiale per il benessere del tuo cane."
        url="https://4bid.it/progetti/mypetsenseai"
        softwareCategory="HealthApplication"
        operatingSystem="Web"
        breadcrumbs={[
          { name: "Home", url: "https://4bid.it" },
          { name: "Progetti", url: "https://4bid.it/#projects" },
          { name: "MyPetSenseAI", url: "https://4bid.it/progetti/mypetsenseai" },
        ]}
      />
      <LandingPageTracker slug="progetti/mypetsenseai" />

      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-r from-purple-500 to-pink-600 text-white overflow-hidden">
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
              <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">MYPETSENSEAI</h1>
              <p className="text-2xl mb-8 text-white/90">Your dog's health, always under control</p>
              <p className="text-lg leading-relaxed mb-8 text-white/80">
                Analizza foto di corpo, occhi, orecchie, pelle e feci. L'AI analizza e fornisce feedback dettagliato.
                Monitora peso, umore, energia, sintomi e attività quotidiane per il benessere del tuo amico a quattro
                zampe.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button asChild size="lg" className="bg-white text-purple-600 hover:bg-white/90 shadow-lg">
                  <a href="https://mypetsenseai.com" target="_blank" rel="noopener noreferrer">
                    Visita MyPetSenseAI
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
                  src="/mypetsenseai-logo.png"
                  alt="MyPetSenseAI Logo"
                  width={400}
                  height={400}
                  className="object-contain"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-white border-b">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-3 gap-4 md:gap-8 max-w-3xl mx-auto text-center">
            <div className="min-w-0">
              <p className="text-2xl md:text-4xl font-bold text-purple-600">10,000+</p>
              <p className="text-xs md:text-base text-gray-600 text-balance">Analisi completate</p>
            </div>
            <div className="min-w-0">
              <p className="text-2xl md:text-4xl font-bold text-purple-600">4.9/5</p>
              <p className="text-xs md:text-base text-gray-600 text-balance">Valutazione utenti</p>
            </div>
            <div className="min-w-0">
              <p className="text-2xl md:text-4xl font-bold text-purple-600">2,500+</p>
              <p className="text-xs md:text-base text-gray-600 text-balance">Utenti attivi</p>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">Il Problema</h2>
            <div className="w-24 h-1 bg-purple-500 mb-8"></div>
            <p className="text-xl text-gray-700 leading-relaxed">
              I proprietari di cani spesso non riescono a riconoscere i primi segnali di problemi di salute nei loro
              animali. Le visite veterinarie possono essere costose e non sempre è chiaro quando sia necessario
              intervenire. Manca uno strumento semplice per monitorare quotidianamente il benessere del proprio cane e
              comunicare efficacemente con il veterinario.
            </p>
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">La Soluzione</h2>
            <div className="w-24 h-1 bg-purple-500 mb-8"></div>
            <p className="text-xl text-gray-700 leading-relaxed mb-8">
              MyPetSenseAI è una piattaforma AI che analizza foto e dati del tuo cane per monitorare la sua salute,
              fornire consigli personalizzati e creare un ponte digitale con il tuo veterinario di fiducia.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mb-6">
                <Camera className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Analisi AI Avanzata</h3>
              <p className="text-gray-600 leading-relaxed">
                Carica foto di corpo, occhi, orecchie, pelle e feci. L'AI analizza e fornisce feedback dettagliato.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mb-6">
                <Heart className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Diario della Salute</h3>
              <p className="text-gray-600 leading-relaxed">
                Traccia peso, umore, energia, sintomi e attività quotidiane per monitorare il benessere nel tempo.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mb-6">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Piani Dieta Personalizzati</h3>
              <p className="text-gray-600 leading-relaxed">
                L'AI crea piani nutrizionali su misura basati su razza, età, peso e condizioni di salute specifiche.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mb-6">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Report PDF Professionali</h3>
              <p className="text-gray-600 leading-relaxed">
                Genera report completi da condividere con il veterinario per diagnosi più accurate.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mb-6">
                <Bell className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Alert Veterinari</h3>
              <p className="text-gray-600 leading-relaxed">
                Ricevi notifiche immediate quando l'AI rileva potenziali problemi che richiedono attenzione veterinaria.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mb-6">
                <Users className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Multi-Cane</h3>
              <p className="text-gray-600 leading-relaxed">
                Gestisci profili separati per tutti i tuoi cani con dati e analisi indipendenti per ciascuno.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Vet Connection Section */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">Connessione con il Veterinario</h2>
            <div className="w-24 h-1 bg-purple-500 mb-8"></div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-8 rounded-2xl border border-purple-100">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Condividi con il Tuo Veterinario</h3>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Invita il tuo veterinario di fiducia a visualizzare il profilo salute del tuo cane. Condividi report
                  dettagliati, storico analisi AI e diario della salute per visite più produttive.
                </p>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-purple-600" />
                    Report PDF esportabili
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-purple-600" />
                    Storico analisi completo
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-purple-600" />
                    Comunicazione diretta e sicura
                  </li>
                </ul>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-8 rounded-2xl border border-purple-100">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Trova uno Specialista</h3>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Hai bisogno di un secondo parere o di uno specialista? Esplora la nostra rete di veterinari
                  certificati disponibili per consulti online e in presenza.
                </p>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-purple-600" />
                    Veterinari specializzati verificati
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-purple-600" />
                    Video consulti in tempo reale
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-purple-600" />
                    Prenota online in pochi click
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* For Vets Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">Sei un Veterinario?</h2>
            <div className="w-24 h-1 bg-purple-500 mb-8"></div>
            <p className="text-xl text-gray-700 leading-relaxed mb-8">
              MyPetSenseAI offre ai veterinari una piattaforma innovativa per espandere la clientela, offrire consulti
              online e gestire efficientemente le relazioni con i pazienti.
            </p>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                <Stethoscope className="h-8 w-8 text-purple-600 mb-4" />
                <h3 className="text-lg font-bold text-gray-900 mb-2">Video Consulti Integrati</h3>
                <p className="text-gray-600">Offri consulti a distanza con strumenti professionali integrati</p>
              </div>
              <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                <Users className="h-8 w-8 text-purple-600 mb-4" />
                <h3 className="text-lg font-bold text-gray-900 mb-2">Nuovi Clienti Qualificati</h3>
                <p className="text-gray-600">Raggiungi proprietari di animali attenti alla salute</p>
              </div>
              <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                <FileText className="h-8 w-8 text-purple-600 mb-4" />
                <h3 className="text-lg font-bold text-gray-900 mb-2">Dati AI Pre-Analizzati</h3>
                <p className="text-gray-600">Ricevi report AI dettagliati prima delle visite per diagnosi più rapide</p>
              </div>
              <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                <CheckCircle className="h-8 w-8 text-purple-600 mb-4" />
                <h3 className="text-lg font-bold text-gray-900 mb-2">Piattaforma Sicura</h3>
                <p className="text-gray-600">Dati protetti e gestione informazioni professionale</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Business Model Section */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">Business Model</h2>
            <div className="w-24 h-1 bg-purple-500 mb-8"></div>

            <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-8 rounded-2xl border border-purple-100 mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Modello Freemium + Subscription</h3>
              <ul className="space-y-4 text-gray-700">
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 text-purple-600 flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>Piano Free:</strong> Analisi base limitate, diario salute, 1 profilo cane
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 text-purple-600 flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>Piano Premium:</strong> Analisi illimitate, piani dieta AI, report PDF, multi-cane
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 text-purple-600 flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>Per Veterinari:</strong> Abbonamento professionale con strumenti di gestione clienti
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Status Section */}
      <section className="py-20 bg-gradient-to-r from-purple-500 to-pink-600 text-white">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-3 bg-white/20 backdrop-blur-sm px-6 py-3 rounded-full mb-8">
              <CheckCircle className="h-6 w-6" />
              <span className="text-xl font-bold">Progetto On line</span>
            </div>
            <h2 className="text-4xl font-bold mb-6">MyPetSenseAI è disponibile ora!</h2>
            <p className="text-xl mb-8 text-white/90">
              La piattaforma è online con oltre 10,000 analisi completate e 2,500+ utenti attivi.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Button asChild size="lg" className="bg-white text-purple-600 hover:bg-white/90 shadow-lg">
                <a href="https://mypetsenseai.com/pricing" target="_blank" rel="noopener noreferrer">
                  Inizia Gratis
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
              Contattaci per maggiori informazioni su MyPetSenseAI, partnership commerciali o opportunità di
              investimento
            </p>
            <Link href="/#contact">
              <Button
                size="lg"
                className="bg-gradient-to-r from-purple-500 to-pink-600 text-white hover:from-purple-600 hover:to-pink-700 shadow-lg"
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
