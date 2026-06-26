"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

const HeroSlider = () => {
  const [currentSlide, setCurrentSlide] = useState(0)

  const slides = [
    {
      text: "La Tua Struttura al Massimo Potenziale",
      image: "/slide1.jpg",
    },
    {
      text: "Revenue Management & Strategie Commerciali",
      image: "/slide2.jpg",
    },
    {
      text: "Crescita Sostenibile e Redditività Garantita",
      image: "/slide3.jpg",
    },
  ]

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  return (
    <section id="home" className="relative h-screen w-full overflow-hidden bg-gradient-to-r from-blue-600 to-blue-700">
      {slides.map((slide, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            index === currentSlide ? "opacity-100" : "opacity-0"
          }`}
        >
          <Image
            src={slide.image || "/placeholder.svg"}
            alt={slide.text}
            fill
            className="object-cover"
            priority={index === 0}
          />
          <div className="absolute inset-0 bg-black/40" />
        </div>
      ))}

      <div className="relative z-20 h-full flex flex-col items-center justify-center px-4 text-center">
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 drop-shadow-lg">
          {slides[currentSlide].text}
        </h1>
        <p className="text-xl md:text-2xl text-white/90 max-w-2xl drop-shadow-md mb-8">
          Consulenza specializzata in Revenue Management per Hospitality
        </p>
        <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50 font-bold text-lg px-8">
          Scopri di Più
        </Button>
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="absolute left-4 top-1/2 -translate-y-1/2 z-30 text-white hover:bg-white/20 rounded-full"
        onClick={() => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)}
      >
        <ChevronLeft className="h-8 w-8" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-4 top-1/2 -translate-y-1/2 z-30 text-white hover:bg-white/20 rounded-full"
        onClick={() => setCurrentSlide((prev) => (prev + 1) % slides.length)}
      >
        <ChevronRight className="h-8 w-8" />
      </Button>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex gap-3">
        {slides.map((_, index) => (
          <button
            key={index}
            className={`h-3 rounded-full transition-all ${
              index === currentSlide ? "bg-white w-8" : "bg-white/50 w-3 hover:bg-white/70"
            }`}
            onClick={() => setCurrentSlide(index)}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </section>
  )
}

const Services = () => {
  const services = [
    {
      icon: "📊",
      title: "Revenue Management",
      description: "Ottimizzazione dei prezzi e massimizzazione dei ricavi per la tua struttura ricettiva",
    },
    {
      icon: "🎯",
      title: "Strategie Commerciali",
      description: "Ampliamento della base commerciale e gestione efficace dei canali distributivi",
    },
    {
      icon: "📈",
      title: "Incremento Fatturato",
      description: "Aumento medio del fatturato del 45% grazie alle nostre consulenze specializzate",
    },
    {
      icon: "👥",
      title: "Gestione del Personale",
      description: "Head hunting e staff recruitment con le più moderne tecniche di selezione",
    },
    {
      icon: "💡",
      title: "Software Personalizzati",
      description: "Soluzioni tecnologiche su misura per automatizzare e ottimizzare i tuoi processi",
    },
    {
      icon: "🚀",
      title: "Accelerazione Aziendale",
      description: "Start-up e riorganizzazione aziendale con metodologie collaudate",
    },
  ]

  return (
    <section id="services" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-4xl font-bold text-center mb-4 text-gray-800">I Nostri Servizi</h2>
        <p className="text-center text-gray-600 mb-16 text-lg">Soluzioni complete per la crescita della tua struttura</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <div key={index} className="p-6 bg-gray-50 rounded-lg hover:shadow-lg transition-shadow border border-gray-200">
              <div className="text-5xl mb-4">{service.icon}</div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">{service.title}</h3>
              <p className="text-gray-600">{service.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

const Portfolio = () => {
  const projects = [
    {
      name: "Resort 4 Stelle",
      location: "Chianti",
      rooms: 21,
      before: "€550k",
      after: "€930k",
      growth: "+75%",
    },
    {
      name: "Agriturismo",
      location: "Chianti",
      rooms: 18,
      before: "€200k",
      after: "€420k",
      growth: "+83%",
    },
    {
      name: "Dimora Storica",
      location: "Firenze",
      rooms: 6,
      before: "€50k",
      after: "€180k",
      growth: "+260%",
    },
  ]

  return (
    <section id="portfolio" className="py-20 bg-gray-100">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-4xl font-bold text-center mb-4 text-gray-800">Portfolio di Successi</h2>
        <p className="text-center text-gray-600 mb-16 text-lg">Risultati verificati di strutture trasformate</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {projects.map((project, index) => (
            <div key={index} className="bg-white p-8 rounded-lg shadow-lg hover:shadow-xl transition-shadow">
              <h3 className="text-2xl font-bold text-gray-800 mb-2">{project.name}</h3>
              <p className="text-gray-600 mb-4">
                {project.location} • {project.rooms} camere
              </p>
              <div className="space-y-3 border-t pt-4">
                <div>
                  <p className="text-sm text-gray-600">Ricavi Prima</p>
                  <p className="text-lg font-semibold text-gray-800">{project.before}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Ricavi Dopo</p>
                  <p className="text-lg font-semibold text-green-600">{project.after}</p>
                </div>
                <div className="bg-blue-50 p-3 rounded">
                  <p className="text-sm text-gray-600">Crescita</p>
                  <p className="text-2xl font-bold text-blue-600">{project.growth}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

const About = () => {
  return (
    <section id="about" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-4xl font-bold mb-6 text-gray-800">Chi Siamo</h2>
            <p className="text-gray-700 mb-4 text-lg">
              4BID SRL è un team di consulenti specializzati in Revenue Management e sviluppo software per il settore
              hospitality. Con anni di esperienza nel campo, aiutiamo strutture ricettive a massimizzare i ricavi e
              ottimizzare i processi.
            </p>
            <p className="text-gray-700 mb-4 text-lg">
              La nostra approccio combina esperienza nel turismo con innovazione tecnologica, offrendo soluzioni su
              misura per ogni esigenza.
            </p>
            <Button className="bg-blue-600 hover:bg-blue-700">Contattaci Oggi</Button>
          </div>
          <div className="relative h-96 rounded-lg overflow-hidden shadow-lg">
            <Image
              src="/business-consultation-blue-background.jpg"
              alt="Team 4BID"
              fill
              className="object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  )
}

const CTA = () => {
  return (
    <section className="py-20 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
      <div className="max-w-4xl mx-auto px-4 text-center">
        <h2 className="text-4xl font-bold mb-6">Pronto a Trasformare la Tua Struttura?</h2>
        <p className="text-xl mb-8 text-blue-100">
          Scopri come le nostre soluzioni possono aumentare i tuoi ricavi fino al 45%
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50 font-bold text-lg">
            Richiedi Consulenza Gratuita
          </Button>
          <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 font-bold text-lg">
            Scopri i Nostri Prodotti
          </Button>
        </div>
      </div>
    </section>
  )
}

export default function Home() {
  return (
    <main className="overflow-hidden">
      <HeroSlider />
      <Services />
      <Portfolio />
      <About />
      <CTA />
    </main>
  )
}
