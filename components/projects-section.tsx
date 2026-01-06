"use client"

import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Rocket, PiggyBank, TrendingUp, CheckCircle, Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import InvestorInquiryModal from "@/components/investor-inquiry-modal"

export default function ProjectsSection() {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const projects = [
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
      id: "santaddeo",
      name: "SANTADDEO",
      tagline: "The Human Revenue Manager",
      description:
        "Il primo sistema di Revenue Management Intelligente e Umano, che spiega le proprie decisioni e si adatta ad ogni struttura nel mondo.",
      logo: "/santaddeo-logo.png",
      icon: TrendingUp,
      color: "from-teal-500 to-cyan-600",
      progress: "75%",
      href: "/progetti/santaddeo",
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
      progress: "90%",
      href: "/progetti/manubot",
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
      progress: "70%",
      href: "/progetti/hotel-accelerator",
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
    },
  ]

  return (
    <section id="projects" className="py-20 bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Le Nostre Idee</h2>
          <div className="w-24 h-1 bg-[#F4B942] mx-auto mb-6"></div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Progetti innovativi in fase di sviluppo che rivoluzioneranno il modo di lavorare nel settore hospitality e
            oltre
          </p>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {projects.map((project) => {
            const IconComponent = project.icon
            return (
              <Link
                key={project.id}
                href={project.href}
                className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100"
              >
                {/* Progress Bar */}
                <div className="h-2 bg-gray-100 relative overflow-hidden">
                  <div
                    className={`h-full bg-gradient-to-r ${project.color} transition-all duration-500`}
                    style={{ width: project.isLive ? "100%" : project.progress }}
                  />
                </div>

                {/* Card Content */}
                <div className="p-8">
                  {/* Logo */}
                  <div className="flex items-center justify-center mb-6 h-32 relative bg-gray-50 rounded-xl p-4">
                    <Image
                      src={project.logo || "/placeholder.svg"}
                      alt={`${project.name} Logo`}
                      width={200}
                      height={120}
                      className="object-contain max-h-full w-auto"
                    />
                  </div>

                  {/* Icon Badge */}
                  <div
                    className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${project.color} mb-4`}
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
                  <div className="flex items-center justify-between mb-6">
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

                  {/* CTA Button */}
                  <Button variant="ghost" className="w-full group-hover:bg-gray-50 transition-colors justify-between">
                    <span>Scopri di più</span>
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </Link>
            )
          })}
        </div>

        {/* Bottom CTA */}
        <div className="text-center">
          <p className="text-gray-600 mb-4">Interessato a investire o collaborare?</p>
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
