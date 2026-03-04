"use client"

import { Button } from "@/components/ui/button"
import { Printer, Download } from "lucide-react"
import Image from "next/image"

export function SantaddeoBrochure() {
  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="min-h-screen bg-neutral-100 py-8 print:py-0 print:bg-white">
      {/* Print Controls - Hidden when printing */}
      <div className="max-w-[1200px] mx-auto px-4 mb-6 print:hidden">
        <div className="flex items-center justify-between bg-white rounded-lg p-4 shadow-sm">
          <div>
            <h1 className="text-xl font-semibold text-neutral-900">Santaddeo Brochure</h1>
            <p className="text-sm text-neutral-500">A4 Tri-fold (297mm x 210mm)</p>
          </div>
          <Button onClick={handlePrint} className="bg-neutral-900 hover:bg-neutral-800">
            <Printer className="w-4 h-4 mr-2" />
            Stampa / Salva PDF
          </Button>
        </div>
      </div>

      {/* OUTSIDE PANELS (Front when folded) */}
      <div className="max-w-[1122px] mx-auto bg-white shadow-xl print:shadow-none print:max-w-none mb-8 print:mb-0">
        <div 
          className="grid grid-cols-3 print:w-[297mm] print:h-[210mm]"
          style={{ aspectRatio: "297/210" }}
        >
          {/* Panel 1 - Back Cover (left when unfolded) */}
          <div className="bg-neutral-950 text-white p-8 flex flex-col justify-between relative overflow-hidden">
            {/* Subtle pattern */}
            <div className="absolute inset-0 opacity-5">
              <div className="absolute top-0 left-0 w-full h-full" 
                style={{
                  backgroundImage: `radial-gradient(circle at 1px 1px, rgba(212,175,55,0.3) 1px, transparent 0)`,
                  backgroundSize: '20px 20px'
                }}
              />
            </div>
            
            <div className="relative z-10">
              <div className="w-12 h-0.5 bg-amber-500 mb-6" />
              <h2 className="text-lg font-light text-neutral-400 mb-2">Contatti</h2>
            </div>
            
            <div className="relative z-10 space-y-6">
              <div>
                <p className="text-amber-500 text-sm font-medium mb-1">Website</p>
                <p className="text-white text-lg">www.santaddeo.com</p>
              </div>
              <div>
                <p className="text-amber-500 text-sm font-medium mb-1">Email</p>
                <p className="text-white">info@santaddeo.com</p>
              </div>
              <div>
                <p className="text-amber-500 text-sm font-medium mb-1">Sviluppato da</p>
                <p className="text-white">4BID SRL</p>
                <p className="text-neutral-400 text-sm">www.4bid.it</p>
              </div>
            </div>

            <div className="relative z-10 pt-6 border-t border-neutral-800">
              <p className="text-xs text-neutral-500">
                © 2024 Santaddeo. Tutti i diritti riservati.
              </p>
            </div>
          </div>

          {/* Panel 2 - Inside flap (middle) */}
          <div className="bg-white p-8 flex flex-col justify-center border-x border-neutral-100">
            <div className="space-y-8">
              <div>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-neutral-900 mb-2">Autopilot Mode</h3>
                <p className="text-sm text-neutral-600 leading-relaxed">
                  Lascia che Santaddeo aggiorni automaticamente i prezzi delle tue camere o ricevi semplicemente suggerimenti intelligenti.
                </p>
              </div>

              <div>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-neutral-800 to-neutral-900 flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-neutral-900 mb-2">Data Dashboard</h3>
                <p className="text-sm text-neutral-600 leading-relaxed">
                  Dashboard chiara e potente con analisi di occupazione, revenue e performance.
                </p>
              </div>
            </div>
          </div>

          {/* Panel 3 - Front Cover (right, visible when folded) */}
          <div className="bg-neutral-950 text-white p-8 flex flex-col justify-between relative overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 opacity-10">
              <svg viewBox="0 0 200 200" className="w-full h-full">
                <defs>
                  <linearGradient id="gold-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#D4AF37" />
                    <stop offset="100%" stopColor="#F5E6A3" />
                  </linearGradient>
                </defs>
                <circle cx="100" cy="100" r="80" fill="none" stroke="url(#gold-gradient)" strokeWidth="0.5" />
                <circle cx="100" cy="100" r="60" fill="none" stroke="url(#gold-gradient)" strokeWidth="0.5" />
                <circle cx="100" cy="100" r="40" fill="none" stroke="url(#gold-gradient)" strokeWidth="0.5" />
              </svg>
            </div>
            
            <div className="absolute bottom-0 left-0 w-48 h-48 opacity-5">
              <svg viewBox="0 0 100 100" className="w-full h-full">
                <rect x="10" y="60" width="8" height="30" fill="#D4AF37" />
                <rect x="25" y="40" width="8" height="50" fill="#D4AF37" />
                <rect x="40" y="50" width="8" height="40" fill="#D4AF37" />
                <rect x="55" y="30" width="8" height="60" fill="#D4AF37" />
                <rect x="70" y="45" width="8" height="45" fill="#D4AF37" />
                <rect x="85" y="20" width="8" height="70" fill="#D4AF37" />
              </svg>
            </div>

            <div className="relative z-10">
              {/* Logo */}
              <div className="mb-8">
                <Image
                  src="/santaddeo-logo-white.png"
                  alt="Santaddeo"
                  width={140}
                  height={40}
                  className="h-10 w-auto brightness-0 invert"
                />
              </div>
            </div>

            <div className="relative z-10 flex-1 flex flex-col justify-center">
              <div className="w-16 h-0.5 bg-gradient-to-r from-amber-500 to-amber-300 mb-6" />
              <h1 className="text-4xl font-light tracking-tight mb-3">
                <span className="font-semibold">Santaddeo</span>
              </h1>
              <p className="text-lg text-neutral-300 font-light leading-relaxed">
                Il sistema intelligente di<br />
                <span className="text-amber-500 font-medium">revenue management</span><br />
                per hotel
              </p>
            </div>

            <div className="relative z-10">
              <div className="flex items-center gap-2 text-xs text-neutral-500">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                <span>Powered by AI</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* INSIDE PANELS (Visible when opened) */}
      <div className="max-w-[1122px] mx-auto bg-white shadow-xl print:shadow-none print:max-w-none print:break-before-page">
        <div 
          className="grid grid-cols-3 print:w-[297mm] print:h-[210mm]"
          style={{ aspectRatio: "297/210" }}
        >
          {/* Panel 4 - Inside Left */}
          <div className="bg-white p-8 flex flex-col justify-center border-r border-neutral-100">
            <div className="space-y-6">
              <div>
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 mb-4 shadow-lg shadow-amber-500/20">
                  <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-neutral-900 mb-2">Smart Dynamic Pricing</h3>
                <p className="text-sm text-neutral-600 leading-relaxed">
                  L'AI analizza domanda, occupazione, stagionalità e dati di mercato per suggerire il prezzo ottimale ogni giorno.
                </p>
              </div>

              <div className="pt-4 border-t border-neutral-100">
                <div className="flex items-center gap-3 text-sm">
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-neutral-600">Analisi in tempo reale</span>
                </div>
                <div className="flex items-center gap-3 text-sm mt-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span className="text-neutral-600">Machine Learning avanzato</span>
                </div>
              </div>
            </div>
          </div>

          {/* Panel 5 - Inside Center */}
          <div className="bg-neutral-950 text-white p-8 flex flex-col justify-center relative overflow-hidden">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-10">
              <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                <defs>
                  <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                    <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#D4AF37" strokeWidth="0.2" />
                  </pattern>
                </defs>
                <rect width="100" height="100" fill="url(#grid)" />
              </svg>
            </div>

            <div className="relative z-10 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-amber-500/30">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              
              <h3 className="text-2xl font-semibold mb-3">Revenue Optimization</h3>
              <p className="text-neutral-300 leading-relaxed text-sm">
                Aumenta il revenue con strategie di pricing automatizzate progettate per hotel indipendenti.
              </p>

              <div className="mt-8 grid grid-cols-2 gap-4">
                <div className="bg-white/5 rounded-xl p-4 backdrop-blur">
                  <p className="text-3xl font-bold text-amber-500">+23%</p>
                  <p className="text-xs text-neutral-400 mt-1">Revenue medio</p>
                </div>
                <div className="bg-white/5 rounded-xl p-4 backdrop-blur">
                  <p className="text-3xl font-bold text-amber-500">+15%</p>
                  <p className="text-xs text-neutral-400 mt-1">Occupazione</p>
                </div>
              </div>
            </div>
          </div>

          {/* Panel 6 - Inside Right */}
          <div className="bg-white p-8 flex flex-col justify-center border-l border-neutral-100">
            <div className="space-y-6">
              <div>
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-neutral-800 to-neutral-900 mb-4">
                  <svg className="w-7 h-7 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-neutral-900 mb-2">Easy Integration</h3>
                <p className="text-sm text-neutral-600 leading-relaxed">
                  Collega il tuo PMS e inizia a ricevere suggerimenti di prezzo istantaneamente.
                </p>
              </div>

              <div className="bg-neutral-50 rounded-xl p-4">
                <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-3">Compatibile con</p>
                <div className="flex flex-wrap gap-2">
                  {["Booking.com", "Expedia", "Airbnb", "HotelBeds", "SiteMinder"].map((pms) => (
                    <span key={pms} className="px-3 py-1 bg-white rounded-full text-xs text-neutral-700 border border-neutral-200">
                      {pms}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-4">
                <div className="flex items-center gap-2 text-amber-600 font-medium text-sm">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Setup in 5 minuti
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Print styles */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 landscape;
            margin: 0;
          }
          
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          .print\\:hidden {
            display: none !important;
          }
          
          .print\\:break-before-page {
            break-before: page;
          }
        }
      `}</style>
    </div>
  )
}
