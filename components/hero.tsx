"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

const slides = [
  {
    text: "La nostra esperienza al tuo servizio",
    image: "/slide1.jpg",
  },
  {
    text: "Innovazione e tecnologia per il tuo business",
    image: "/slide2.jpg",
  },
  {
    text: "Soluzioni personalizzate per la tua crescita",
    image: "/slide3.jpg",
  },
]

export default function Hero() {
  const [currentSlide, setCurrentSlide] = useState(0)
  // Le slide 2 e 3 sono nel viewport (nascoste solo da opacity-0), quindi
  // loading="lazy" non ha alcun effetto: misurato, il browser le scaricava a
  // 80/81ms insieme alla slide LCP, rubandole banda. Vengono montate solo
  // quando servono davvero, cioe' al primo cambio slide.
  const [caricaAltreSlide, setCaricaAltreSlide] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => {
      setCaricaAltreSlide(true)
      setCurrentSlide((prev) => (prev + 1) % slides.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  const nextSlide = () => {
    setCaricaAltreSlide(true)
    setCurrentSlide((prev) => (prev + 1) % slides.length)
  }

  const prevSlide = () => {
    setCaricaAltreSlide(true)
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)
  }

  return (
    <section id="home" className="relative h-[600px] mt-20 overflow-hidden bg-[#6B9DBD]">
      {slides.map((slide, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            index === currentSlide ? "opacity-100" : "opacity-0"
          }`}
        >
          {(index === 0 || caricaAltreSlide) && (
            <Image
              src={slide.image || "/placeholder.svg"}
              alt={slide.text}
              fill
              sizes="100vw"
              className="object-cover"
              priority={index === 0}
              loading={index === 0 ? "eager" : "lazy"}
            />
          )}

          <div className="absolute inset-0 bg-[#6B9DBD]/40" />
        </div>
      ))}

      <div className="relative z-20 h-full flex flex-col items-center justify-center px-4 text-center">
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-white max-w-4xl text-balance">
          Revenue Management e software per il settore turismo e HORECA
        </h1>
        <p className="mt-4 text-xl md:text-2xl lg:text-3xl font-light text-white/90 max-w-3xl text-pretty">
          {slides[currentSlide].text}
        </p>
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="absolute left-4 top-1/2 -translate-y-1/2 z-30 text-white hover:bg-white/20"
        onClick={prevSlide}
        title="Slide precedente"
        aria-label="Slide precedente"
      >
        <ChevronLeft className="h-8 w-8" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-4 top-1/2 -translate-y-1/2 z-30 text-white hover:bg-white/20"
        onClick={nextSlide}
        title="Slide successiva"
        aria-label="Slide successiva"
      >
        <ChevronRight className="h-8 w-8" />
      </Button>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex gap-2">
        {slides.map((_, index) => (
          <button
            key={index}
            className={`w-3 h-3 rounded-full transition-all ${index === currentSlide ? "bg-white w-8" : "bg-white/50"}`}
            onClick={() => setCurrentSlide(index)}
            title={`Vai alla slide ${index + 1}`}
            aria-label={`Vai alla slide ${index + 1}`}
          />
        ))}
      </div>
    </section>
  )
}
