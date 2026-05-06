"use client"

import Image from "next/image"
import Link from "next/link"
import { ArrowRight, ExternalLink, Rocket, PiggyBank, TrendingUp, CheckCircle, Heart, Bike } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import InvestorInquiryModal from "@/components/investor-inquiry-modal"

type Project = {
  id: string
  name: string
  tagline: string
  description: string
  logo: string
  icon: typeof Rocket
  color: string
  progress: string
  href: string
  isLive?: boolean
  externalUrl?: string
  blendLogo?: boolean
}

export default function ProjectsSection() {
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Suite dedicata al settore turismo / HORECA: cuore strategico di 4BID come holding
  const horecaSuite: Project[] = [
    {
      id: "santaddeo",
      name: "SANTADDEO",
      tagline: "The Human Revenue Manager",
      description:
        "Il primo sistema di Revenue Management Intelligente e Umano, che spiega le proprie decisioni e si adatta ad ogni struttura nel mondo.",
      logo: "/santaddeo-logo.png",
      icon: TrendingUp,
      color: "from-teal-500 to-cyan-600",
      progress: "On line",
      href: "/progetti/santaddeo",
      isLive: true,
      externalUrl: "https://santaddeo.com",
    },
    {
      id: "hotelprofit-ai",
      name: "HOTELPROFIT AI",
      tagline: "Controllo di gestione intelligente",
      description:
        "Massimizza i profitti del tuo hotel con un team di commercialisti specializzati supportati dall'AI. Analisi real-time, forecasting e consigli personalizzati.",
      logo: "/hotelprofit-ai-logo.png",
      icon: TrendingUp,
      color: "from-blue-600 to-green-500",
      progress: "On line",
      href: "/progetti/hotelprofit-ai",
      isLive: true,
      externalUrl: "https://hotelprofitai.com",
      blendLogo: true,
    },
    {
      id: "manubot",
      name: "MANUBOT",
      tagline: "The Smart Maintenance Assistant",
      description:
        "Il sistema universale di gestione e automazione delle manutenzioni che parla la lingua di tutti: WhatsApp e Telegram.",
      logo: "/manubot-logo.jpg",
      icon: Rocket,
      color: "from-orange-500 to-amber-600",
      progress: "On line",
      href: "/progetti/manubot",
      isLive: true,
      externalUrl: "https://www.manubot.it",
    },
    {
      id: "hotel-accelerator",
      name: "HOTEL ACCELERATOR",
      tagline: "Il software gestionale completo per hotel",
      description:
        "CMS, CRM, Email Marketing, Inbox Omnicanale e AI in un'unica soluzione. Aumenta le prenotazioni dirette fino al 35% e riduci le commissioni OTA.",
      logo: "/hotel-accelerator-logo.jpg",
      icon: TrendingUp,
      color: "from-blue-500 to-indigo-600",
      progress: "80%",
      href: "/progetti/hotel-accelerator",
      blendLogo: true,
    },
    {
      id: "ecomobility",
      name: "4BID ECOMOBILITY",
      tagline: "Più usi, meno paghi",
      description:
        "La piattaforma per il noleggio di mobilità elettrica nelle strutture turistiche. E-bike, scooter e monopattini con tariffe decrescenti.",
      logo: "/ecomobility-logo.png",
      icon: Bike,
      color: "from-orange-500 to-amber-500",
      progress: "85%",
      href: "/ecomobility/noleggio-mobilita-elettrica-hotel",
    },
  ]

  // Progetti verticali extra-turismo della holding 4BID
  const otherProjects: Project[] = [
    {
      id: "autoexel",
      name: "AUTOEXEL",
      tagline: "Il primo Excel per chi non sa usare Excel",
      description:
        "Carica un file Excel o CSV per ottenere analisi automatiche, KPI e grafici. Oppure crea fogli intelligenti usando comandi in linguaggio naturale — senza formule.",
      logo: "/autoexel-logo.png",
      icon: CheckCircle,
      color: "from-green-500 to-emerald-600",
      progress: "On line",
      href: "/progetti/autoexel",
      isLive: true,
    },
    {
      id: "mypetsenseai",
      name: "MYPETSENSEAI",
      tagline: "Your dog's health, always under control",
      description:
        "Analizza foto, monitora la salute quotidiana e ricevi consigli personalizzati dall'intelligenza artificiale per il benessere del tuo amico a quattro zampe.",
      logo: "/mypetsenseai-logo.png",
      icon: Heart,
      color: "from-purple-500 to-pink-600",
      progress: "On line",
      href: "/progetti/mypetsenseai",
      isLive: true,
    },
    {
      id: "risparmio-compulsivo",
      name: "RISPARMIO COMPULSIVO",
      tagline: "Save. Play. Win.",
      description: "L'app che trasforma il risparmio personale in un gioco globale, motivante e automatico.",
      logo: "/risparmio-compulsivo-logo.png",
      icon: PiggyBank,
      color: "from-green-600 to-emerald-700",
      progress: "70%",
      href: "/progetti/risparmio-compulsivo",
      blendLogo: true,
    },
  ]

  // JSON-LD: ItemList per Suite HORECA + Altri progetti, ottimo per Google e per il branding "holding"
  const allProjects = [...horecaSuite, ...otherProjects]
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ItemList",
        "@id": "https://www.4bid.it/#suite-horeca",
        name: "Suite HORECA 4BID",
        description:
          "Suite di software e tool 4BID dedicati al settore turismo, hotellerie e ristorazione.",
        itemListElement: horecaSuite.map((p, i) => ({
          "@type": "ListItem",
          position: i + 1,
          item: {
            "@type": "SoftwareApplication",
            name: p.name,
            url: p.externalUrl || `https://www.4bid.it${p.href}`,
            applicationCategory: "BusinessApplication",
            operatingSystem: "Web",
            description: p.description,
            brand: { "@type": "Brand", name: "4BID SRL" },
          },
        })),
      },
      {
        "@type": "ItemList",
        "@id": "https://www.4bid.it/#altri-progetti",
        name: "Altri progetti 4BID",
        description: "Progetti verticali extra-turismo della holding 4BID.",
        itemListElement: otherProjects.map((p, i) => ({
          "@type": "ListItem",
          position: i + 1,
          item: {
            "@type": "SoftwareApplication",
            name: p.name,
            url: p.externalUrl || `https://www.4bid.it${p.href}`,
            applicationCategory: "BusinessApplication",
            operatingSystem: "Web",
            description: p.description,
            brand: { "@type": "Brand", name: "4BID SRL" },
          },
        })),
      },
    ],
  }

  const renderCard = (project: Project) => {
    const IconComponent = project.icon
    return (
      <article
        key={project.id}
        className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 flex flex-col"
        itemScope
        itemType="https://schema.org/SoftwareApplication"
      >
        <meta itemProp="name" content={project.name} />
        <meta itemProp="description" content={project.description} />
        <meta itemProp="applicationCategory" content="BusinessApplication" />

        {/* Progress Bar */}
        <div className="h-2 bg-gray-100 relative overflow-hidden">
          <div
            className={`h-full bg-gradient-to-r ${project.color} transition-all duration-500`}
            style={{ width: project.isLive ? "100%" : project.progress }}
          />
        </div>

        {/* Card Content */}
        <div className="p-8 flex flex-col flex-1">
          {/* Logo */}
          <div className="flex items-center justify-center mb-6 h-32 relative bg-gray-50 rounded-xl p-4">
                <Image
                  src={project.logo || "/placeholder.svg"}
                  alt={`${project.name} Logo`}
                  width={200}
                  height={120}
                  className={`object-contain max-h-full w-auto ${project.blendLogo ? "mix-blend-multiply" : ""}`}
                />
          </div>

          {/* Icon Badge */}
          <div
            className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${project.color} mb-4`}
            aria-hidden="true"
          >
            <IconComponent className="h-6 w-6 text-white" />
          </div>

          {/* Name */}
          <h3 className="text-2xl font-bold text-gray-900 mb-2">{project.name}</h3>

          {/* Tagline */}
          <p className="text-sm font-semibold text-gray-500 mb-4 uppercase tracking-wide">{project.tagline}</p>

          {/* Description */}
          <p className="text-gray-600 leading-relaxed mb-6 text-balance">{project.description}</p>

          {/* Progress Indicator */}
          <div className="flex items-center justify-between mb-6 mt-auto">
            <span className="text-sm text-gray-500">{project.isLive ? "Stato" : "Avanzamento"}</span>
            <span
              className={`text-sm font-bold ${
                project.isLive
                  ? "bg-green-100 text-green-700 px-3 py-1 rounded-full"
                  : `bg-gradient-to-r ${project.color} bg-clip-text text-transparent`
              }`}
            >
              {project.progress}
            </span>
          </div>

          {/* CTAs */}
          <div className="flex flex-col gap-2">
            <Button asChild variant="ghost" className="w-full justify-between hover:bg-gray-50">
              <Link href={project.href} aria-label={`Scopri di più su ${project.name}`}>
                <span>Scopri di più</span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>

            {project.isLive && project.externalUrl && (
              <Button
                asChild
                className={`w-full justify-between bg-gradient-to-r ${project.color} text-white hover:opacity-90`}
              >
                <a
                  href={project.externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Visita il sito di ${project.name} (si apre in una nuova scheda)`}
                  itemProp="url"
                >
                  <span>Visita il sito</span>
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            )}
          </div>
        </div>
      </article>
    )
  }

  return (
    <section
      id="projects"
      aria-labelledby="ecosystem-heading"
      className="py-20 bg-gradient-to-b from-gray-50 to-white"
    >
      {/* JSON-LD per indicizzazione SEO della suite e dei singoli prodotti */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <div className="container mx-auto px-6">
        {/* Header principale: holding + suite */}
        <div className="text-center mb-16">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#F4B942] mb-4">4BID SRL · Holding</p>
          <h2 id="ecosystem-heading" className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 text-balance">
            L&apos;ecosistema 4BID
          </h2>
          <div className="w-24 h-1 bg-[#F4B942] mx-auto mb-6"></div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed text-pretty">
            Una suite di software, app e piattaforme dedicate al mondo del turismo, affiancata da progetti verticali in
            altri settori. Tutto sotto un unico brand: 4BID.
          </p>
        </div>

        {/* === Suite HORECA === */}
        <div className="mb-20" aria-labelledby="horeca-heading">
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-3">
              <span className="inline-flex items-center gap-2 bg-[#5B9BD5]/10 text-[#3A7AB2] text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full">
                <span className="h-2 w-2 rounded-full bg-[#5B9BD5]" />
                Suite turismo
              </span>
            </div>
            <h3 id="horeca-heading" className="text-3xl md:text-4xl font-bold text-gray-900 mb-3 text-balance">
              Software e tool per HORECA
            </h3>
            <p className="text-lg text-gray-600 max-w-3xl leading-relaxed text-pretty">
              I prodotti 4BID pensati per hotel, ristoranti e strutture ricettive: dal revenue management al controllo
              di gestione, dalla manutenzione automatizzata alla mobilità elettrica.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {horecaSuite.map(renderCard)}
          </div>
        </div>

        {/* === Altri progetti === */}
        <div aria-labelledby="other-heading">
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-3">
              <span className="inline-flex items-center gap-2 bg-gray-200 text-gray-700 text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full">
                <span className="h-2 w-2 rounded-full bg-gray-500" />
                Verticali 4BID
              </span>
            </div>
            <h3 id="other-heading" className="text-3xl md:text-4xl font-bold text-gray-900 mb-3 text-balance">
              Altri progetti
            </h3>
            <p className="text-lg text-gray-600 max-w-3xl leading-relaxed text-pretty">
              Le altre creazioni della holding 4BID, in settori diversi dal turismo: produttività, salute degli animali
              e finanza personale.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {otherProjects.map(renderCard)}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center">
          <p className="text-gray-600 mb-4">Interessato a investire o collaborare con la holding 4BID?</p>
          <Button
            size="lg"
            onClick={() => setIsModalOpen(true)}
            className="bg-gradient-to-r from-[#5B9BD5] to-[#4A8BC2] text-white hover:from-[#4A8BC2] hover:to-[#3A7AB2] shadow-lg"
          >
            Contattaci
          </Button>
        </div>
      </div>

      {/* Investor Inquiry Modal */}
      <InvestorInquiryModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </section>
  )
}
