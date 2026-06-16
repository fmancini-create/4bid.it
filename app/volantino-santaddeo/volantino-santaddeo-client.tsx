"use client"

import Image from "next/image"
import {
  Printer,
  TrendingUp,
  ShieldCheck,
  BadgeEuro,
  Sparkles,
  RefreshCw,
  Eye,
  Globe,
  Mail,
  Phone,
  CheckCircle2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import "./print.css"

const features = [
  {
    icon: BadgeEuro,
    title: "Formula a Commissione",
    text: "Nessun costo fisso, nessun canone iniziale. Paghi solo una piccola percentuale sui risultati che generiamo.",
  },
  {
    icon: TrendingUp,
    title: "Risultati dal Primo Mese",
    text: "Gia' dopo poche settimane registriamo aumenti concreti dei ricavi camere sulle strutture clienti.",
  },
  {
    icon: Eye,
    title: "100% Trasparente",
    text: "Ogni prezzo proposto e' spiegato in linguaggio semplice. Sai sempre il perche' di ogni scelta.",
  },
  {
    icon: Sparkles,
    title: "AI che si Adatta",
    text: "L'algoritmo impara dalla tua struttura e dal mercato locale, non applica logiche standardizzate.",
  },
  {
    icon: RefreshCw,
    title: "Push Automatico al PMS",
    text: "Connesso ai principali PMS: i prezzi si aggiornano senza alcun intervento manuale.",
  },
  {
    icon: ShieldCheck,
    title: "Guard - Controllo OTA",
    text: "Verifica che le OTA vendano ai prezzi inviati dall'RMS e segnala ogni disallineamento.",
  },
]

function FrontPage() {
  return (
    <div className="volantino-page bg-gray-900 text-white flex flex-col relative overflow-hidden">
      {/* Decorative gradient orbs */}
      <div
        className="absolute top-0 right-0 w-72 h-72 rounded-full opacity-25 blur-3xl"
        style={{ background: "radial-gradient(circle, #14b8a6 0%, transparent 70%)" }}
        aria-hidden="true"
      />
      <div
        className="absolute -bottom-10 -left-10 w-72 h-72 rounded-full opacity-20 blur-3xl"
        style={{ background: "radial-gradient(circle, #F4B942 0%, transparent 70%)" }}
        aria-hidden="true"
      />

      {/* Top color strip */}
      <div className="h-3 w-full shrink-0 bg-gradient-to-r from-teal-500 to-cyan-600" aria-hidden="true" />

      {/* Logo */}
      <div className="px-8 pt-8 pb-2 shrink-0 relative z-10">
        <div className="bg-white rounded-2xl px-5 py-3 inline-flex shadow-lg">
          <div className="relative h-11 w-44">
            <Image
              src="/santaddeo-logo.png"
              alt="Santaddeo logo"
              fill
              className="object-contain object-left"
              sizes="176px"
              priority
            />
          </div>
        </div>
        <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-teal-300">
          The Human Revenue Manager
        </p>
      </div>

      {/* Main claim */}
      <div className="px-8 flex-1 flex flex-col justify-center relative z-10">
        <p className="text-[11px] font-bold uppercase tracking-widest text-[#F4B942] mb-3">Revenue Management Hotel</p>
        <h1 className="text-[2.5rem] font-black leading-[1.04] tracking-tight text-balance">
          Vuoi far crescere
          <br />
          la tua struttura
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-[#F4B942] to-orange-400">
            a costo zero?
          </span>
        </h1>
        <p className="mt-5 text-base leading-relaxed text-gray-300 text-pretty max-w-[92%]">
          Santaddeo e&apos; il Revenue Management System che paghi <span className="text-white font-semibold">solo se
          funziona</span>. Zero costi fissi, zero rischi: guadagniamo solo quando aumentano i tuoi ricavi.
        </p>

        {/* Highlight bullets */}
        <div className="mt-7 space-y-2.5">
          {[
            "Nessun canone fisso, nessun costo di attivazione",
            "Formula a commissione sui risultati",
            "Risultati misurabili gia' dal primo mese",
          ].map((b) => (
            <div key={b} className="flex items-center gap-2.5">
              <CheckCircle2 className="h-5 w-5 text-teal-400 shrink-0" strokeWidth={2.4} />
              <span className="text-sm text-gray-100">{b}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Zero cost badge */}
      <div className="px-8 pb-6 relative z-10 shrink-0">
        <div className="rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-600 px-6 py-4 flex items-center justify-between gap-4 shadow-xl">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-teal-50/80">Inizi a</p>
            <p className="text-4xl font-black tracking-tight leading-none">0 &euro;</p>
            <p className="text-[11px] text-teal-50 mt-1">di costi fissi</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-widest text-teal-50/80">Scopri come</p>
            <p className="text-lg font-black mt-0.5">santaddeo.com</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function BackPage() {
  return (
    <div className="volantino-page bg-white text-gray-900 flex flex-col">
      {/* Top strip */}
      <div className="h-3 w-full shrink-0 bg-gradient-to-r from-teal-500 to-cyan-600" aria-hidden="true" />

      {/* Header */}
      <div className="px-8 pt-7 pb-3 shrink-0">
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Perche&apos; Santaddeo</p>
        <h2 className="text-[1.7rem] font-black tracking-tight leading-tight mt-1.5 text-balance">
          Piu&apos; ricavi, zero rischi
        </h2>
      </div>

      {/* Features grid */}
      <div className="px-8 pb-3 flex-1 min-h-0 overflow-hidden">
        <ul className="grid grid-cols-2 gap-x-4 gap-y-3">
          {features.map((f) => {
            const Icon = f.icon
            return (
              <li key={f.title} className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <div className="bg-teal-50 text-teal-600 h-8 w-8 rounded-lg flex items-center justify-center shrink-0">
                    <Icon className="h-4 w-4" strokeWidth={2.2} />
                  </div>
                  <p className="font-bold text-[12.5px] text-gray-900 leading-tight">{f.title}</p>
                </div>
                <p className="text-[11px] text-gray-600 leading-snug">{f.text}</p>
              </li>
            )
          })}
        </ul>
      </div>

      {/* How it works */}
      <div className="px-8 py-3 shrink-0 bg-gray-50 border-y border-gray-100">
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2.5">Come iniziare</p>
        <div className="grid grid-cols-3 gap-3">
          {[
            { n: "1", title: "Demo gratuita", text: "Ti mostriamo Santaddeo sulla tua struttura" },
            { n: "2", title: "Attivazione", text: "Colleghiamo il tuo PMS, zero costi iniziali" },
            { n: "3", title: "Cresci", text: "Paghi solo sui risultati ottenuti" },
          ].map((s) => (
            <div key={s.n} className="flex flex-col gap-1">
              <div className="h-7 w-7 rounded-full bg-gradient-to-br from-teal-500 to-cyan-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                {s.n}
              </div>
              <p className="font-bold text-[12px] leading-tight">{s.title}</p>
              <p className="text-[10.5px] text-gray-600 leading-snug">{s.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Contact card */}
      <div className="mx-8 my-4 rounded-2xl bg-gradient-to-br from-gray-900 to-gray-800 text-white p-5 shrink-0">
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#F4B942] mb-3">Prenota la tua demo</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
              <Globe className="h-4 w-4 text-teal-300" />
            </div>
            <div className="min-w-0">
              <p className="text-[9px] uppercase tracking-wider text-gray-400">Sito</p>
              <p className="text-[13px] font-semibold truncate">santaddeo.com</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
              <Mail className="h-4 w-4 text-teal-300" />
            </div>
            <div className="min-w-0">
              <p className="text-[9px] uppercase tracking-wider text-gray-400">Email</p>
              <p className="text-[13px] font-semibold truncate">clienti@4bid.it</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
              <Phone className="h-4 w-4 text-teal-300" />
            </div>
            <div className="min-w-0">
              <p className="text-[9px] uppercase tracking-wider text-gray-400">Web</p>
              <p className="text-[13px] font-semibold truncate">www.4bid.it</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
              <BadgeEuro className="h-4 w-4 text-teal-300" />
            </div>
            <div className="min-w-0">
              <p className="text-[9px] uppercase tracking-wider text-gray-400">Costo iniziale</p>
              <p className="text-[13px] font-semibold truncate">0 &euro;</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer holding */}
      <div className="bg-gray-900 text-white px-7 py-3 shrink-0">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative h-11 w-11 rounded-full overflow-hidden bg-white shadow-md ring-2 ring-white/20 shrink-0 flex items-center justify-center">
              <Image
                src="/4bid-borghi-logo.jpeg"
                alt="4BID SRL"
                width={44}
                height={44}
                className="object-contain w-10 h-10"
              />
            </div>
            <div>
              <p className="text-[9px] uppercase tracking-widest text-gray-400">Un prodotto</p>
              <p className="text-base font-black tracking-tight">4BID SRL</p>
            </div>
          </div>
          <p className="text-[9px] uppercase tracking-widest text-gray-400 text-right leading-tight">
            The Human
            <br />
            <span className="text-teal-300 normal-case tracking-normal">Revenue Manager</span>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function VolantinoSantaddeoClient() {
  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Print Toolbar - hidden on print */}
      <div className="no-print sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Volantino Santaddeo</h1>
            <p className="text-sm text-gray-500">Anteprima 2 facciate A5 - fronte e retro</p>
          </div>
          <div className="flex items-center gap-3">
            <p className="hidden md:block text-xs text-gray-500 max-w-xs text-right">
              Premi <span className="font-semibold">Stampa PDF</span> e nel dialog del browser scegli{" "}
              <span className="font-semibold">&quot;Salva come PDF&quot;</span> con formato A5.
            </p>
            <Button onClick={handlePrint} size="lg" className="bg-gray-900 hover:bg-gray-800 text-white">
              <Printer className="h-5 w-5 mr-2" />
              Stampa PDF
            </Button>
          </div>
        </div>
      </div>

      {/* Pages */}
      <div className="py-8 px-4 print:p-0 flex flex-col items-center gap-8 print:gap-0">
        <FrontPage />
        <BackPage />
      </div>
    </div>
  )
}
