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

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length)
  }

  const prevSlide = () => {
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
          <Image
            src={slide.image || "/placeholder.svg"}
            alt={slide.text}
            fill
            className="object-cover"
            priority={index === 0}
          />

          <div className="absolute inset-0 bg-[#6B9DBD]/40" />
        </div>
      ))}

      <div className="relative z-20 h-full flex items-center justify-center px-4">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-light text-white text-center max-w-4xl">
          {slides[currentSlide].text}
        </h1>
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="absolute left-4 top-1/2 -translate-y-1/2 z-30 text-white hover:bg-white/20"
        onClick={prevSlide}
      >
        <ChevronLeft className="h-8 w-8" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-4 top-1/2 -translate-y-1/2 z-30 text-white hover:bg-white/20"
        onClick={nextSlide}
      >
        <ChevronRight className="h-8 w-8" />
      </Button>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex gap-2">
        {slides.map((_, index) => (
          <button
            key={index}
            className={`w-3 h-3 rounded-full transition-all ${index === currentSlide ? "bg-white w-8" : "bg-white/50"}`}
            onClick={() => setCurrentSlide(index)}
          />
        ))}
      </div>
    </section>
  )
}
