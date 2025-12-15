"use client"

import { useState, useEffect } from "react"
import { X, TrendingUp } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

const landingPages = [
  {
    slug: "consulenza-revenue-management-hotel",
    title: "Consulenza Revenue Management",
    description: "Aumenta i tuoi ricavi fino al 30% con strategie personalizzate",
    emoji: "📈",
  },
  {
    slug: "software-revenue-management-santaddeo",
    title: "Software SANTADDEO",
    description: "L'unico RMS che spiega la logica dietro ogni prezzo",
    emoji: "🚀",
  },
  {
    slug: "ottimizzazione-prezzi-hotel-toscana",
    title: "Ottimizzazione Prezzi Toscana",
    description: "Strategie specifiche per hotel in Toscana",
    emoji: "🏛️",
  },
  {
    slug: "dynamic-pricing-hotel",
    title: "Dynamic Pricing Hotel",
    description: "Prezzi dinamici che massimizzano il fatturato",
    emoji: "💰",
  },
  {
    slug: "yield-management-hotel",
    title: "Yield Management",
    description: "Ottimizza l'occupazione e i ricavi simultaneamente",
    emoji: "📊",
  },
  {
    slug: "formazione-revenue-management-hotel",
    title: "Formazione Revenue Management",
    description: "Corsi professionali per il tuo team",
    emoji: "🎓",
  },
  {
    slug: "revenue-management-bed-breakfast",
    title: "Revenue Management B&B",
    description: "Soluzioni dedicate per Bed & Breakfast",
    emoji: "🏡",
  },
  {
    slug: "revenue-management-agriturismo",
    title: "Revenue Management Agriturismo",
    description: "Strategie per agriturismi e strutture rurali",
    emoji: "🌾",
  },
  {
    slug: "kpi-metriche-hotel",
    title: "KPI e Metriche Hotel",
    description: "Monitora le performance con i giusti indicatori",
    emoji: "📉",
  },
  {
    slug: "ottimizzazione-adr-hotel",
    title: "Ottimizza ADR",
    description: "Aumenta la tariffa media giornaliera",
    emoji: "💵",
  },
]

export function LandingPagePopup() {
  const [isVisible, setIsVisible] = useState(false)
  const [selectedPage, setSelectedPage] = useState<(typeof landingPages)[0] | null>(null)

  useEffect(() => {
    // Check if popup was already shown in this session
    const hasShown = sessionStorage.getItem("landing-popup-shown")
    if (hasShown) return

    // Select random landing page
    const randomPage = landingPages[Math.floor(Math.random() * landingPages.length)]
    setSelectedPage(randomPage)

    // Show popup after 3-5 seconds (random delay)
    const delay = 3000 + Math.random() * 2000
    const timer = setTimeout(() => {
      setIsVisible(true)
      sessionStorage.setItem("landing-popup-shown", "true")
    }, delay)

    return () => clearTimeout(timer)
  }, [])

  const handleClose = () => {
    setIsVisible(false)
  }

  if (!isVisible || !selectedPage) return null

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 w-80 transform transition-all duration-500 ease-out ${
        isVisible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
      }`}
    >
      <div className="relative overflow-hidden rounded-lg border border-border bg-card shadow-2xl">
        {/* Close button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleClose}
          className="absolute right-2 top-2 z-10 h-6 w-6 rounded-full hover:bg-muted"
        >
          <X className="h-4 w-4" />
        </Button>

        {/* Content */}
        <Link href={`/${selectedPage.slug}`} onClick={handleClose} className="block p-5 hover:bg-muted/50 transition">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-2xl">
              {selectedPage.emoji}
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                <span className="text-xs font-medium text-primary uppercase tracking-wide">Scopri</span>
              </div>
              <h3 className="text-sm font-semibold text-foreground leading-tight">{selectedPage.title}</h3>
              <p className="text-xs text-muted-foreground">{selectedPage.description}</p>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Clicca per saperne di più</span>
            <span className="text-primary text-xl">→</span>
          </div>
        </Link>

        {/* Accent bar */}
        <div className="h-1 bg-gradient-to-r from-primary via-primary/60 to-primary" />
      </div>
    </div>
  )
}
