"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { X, Calendar, MapPin, ArrowRight } from "lucide-react"

export default function EventPopup() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Mostra il popup dopo 2.5 secondi, solo se non già chiuso in questa sessione
    try {
      if (typeof window !== "undefined" && window.sessionStorage?.getItem("eventPopupDismissed")) return
    } catch {
      return
    }
    const t = setTimeout(() => setVisible(true), 2500)
    return () => clearTimeout(t)
  }, [])

  const dismiss = () => {
    try {
      if (typeof window !== "undefined") window.sessionStorage?.setItem("eventPopupDismissed", "1")
    } catch {
      // ignore
    }
    setVisible(false)
  }

  const goToEvent = () => {
    dismiss()
    if (typeof window !== "undefined") window.location.href = "/eventi/santaddeo-launch"
  }

  if (!visible) return null

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Evento Santaddeo Launch"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={dismiss}
        aria-hidden="true"
      />

      {/* Card */}
      <div className="relative z-10 w-full max-w-md animate-in fade-in zoom-in-95 duration-300">
        {/* Chiudi */}
        <button
          onClick={dismiss}
          className="absolute -top-3 -right-3 z-20 w-8 h-8 rounded-full bg-white shadow-lg flex items-center justify-center text-gray-500 hover:text-gray-800 transition-colors"
          aria-label="Chiudi"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header teal */}
        <div className="bg-[#0d9488] rounded-t-2xl px-8 pt-8 pb-6 text-center relative overflow-hidden">
          {/* Cerchi decorativi */}
          <div className="absolute -top-8 -left-8 w-32 h-32 rounded-full bg-white/5" />
          <div className="absolute -bottom-6 -right-6 w-24 h-24 rounded-full bg-white/5" />

          {/* Badge */}
          <span className="inline-block bg-white/15 text-white text-[11px] font-semibold tracking-widest uppercase px-3 py-1 rounded-full mb-4">
            Evento riservato clienti 4BID
          </span>

          {/* Logo Santaddeo */}
          <div className="flex items-center justify-center gap-3 mb-4">
            <Image
              src="/santaddeo-logo.png"
              alt="Santaddeo"
              width={260}
              height={104}
              className="object-contain drop-shadow-md"
            />
          </div>

          <p className="text-[#ccfbf1] text-sm font-medium">The Human Revenue Manager</p>
        </div>

        {/* Body */}
        <div className="bg-white rounded-b-2xl px-8 py-6 shadow-2xl">

          {/* Info data e luogo */}
          <div className="flex flex-col gap-2.5 mb-5">
            <div className="flex items-center gap-2.5 text-sm text-gray-700">
              <div className="w-7 h-7 rounded-full bg-teal-50 flex items-center justify-center shrink-0">
                <Calendar className="h-3.5 w-3.5 text-teal-700" />
              </div>
              <span className="font-semibold">Lunedi' 9 Marzo 2026</span>
            </div>
            <div className="flex items-center gap-2.5 text-sm text-gray-700">
              <div className="w-7 h-7 rounded-full bg-teal-50 flex items-center justify-center shrink-0">
                <MapPin className="h-3.5 w-3.5 text-teal-700" />
              </div>
              <span>Villa I Barronci, San Casciano in Val di Pesa (FI)</span>
            </div>
          </div>

          {/* Testo */}
          <p className="text-sm text-gray-600 leading-relaxed mb-6">
            La prima ufficiale di{" "}
            <strong className="text-gray-900">Santaddeo</strong>, il nuovo modello
            web-based per il pricing dinamico evoluto.{" "}
            <span className="text-teal-700 font-medium">Posti limitati.</span>
          </p>

          {/* CTA */}
          <button
            onClick={goToEvent}
            className="w-full bg-[#0d9488] hover:bg-[#0f766e] text-white font-semibold text-sm py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-md shadow-teal-200"
          >
            Scopri e iscriviti all{"'"}evento
            <ArrowRight className="h-4 w-4" />
          </button>

          {/* Logo 4BID in fondo */}
          <div className="flex items-center justify-center gap-2 mt-4">
            <Image
              src="/logo.png"
              alt="4BID"
              width={32}
              height={32}
              className="object-contain"
            />
            <span className="text-[11px] text-gray-400">by 4BID.IT</span>
          </div>
        </div>
      </div>
    </div>
  )
}
