"use client"

import { useRef, useState } from "react"
import Image from "next/image"
import {
  Printer,
  TrendingUp,
  Bot,
  Calculator,
  Hotel,
  Globe,
  Mail,
  ArrowRight,
  Quote,
  Download,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import "./print.css"

type ProductStatus = "online" | "in-sviluppo"

type Product = {
  id: string
  name: string
  tagline: string
  description: string
  pullQuote: string
  logo: string
  url: string
  status: ProductStatus
  productIcon: typeof TrendingUp
  ink: string
  accent: string
  accentSoft: string
  features: { title: string; text: string }[]
}

// Same products as v3 but WITHOUT Ecomobility — 4 products total, 6 panels.
const products: Product[] = [
  {
    id: "santaddeo",
    name: "Santaddeo",
    tagline: "The Human Revenue Manager",
    description:
      "Il primo Revenue Management System Intelligente e Umano. Spiega ogni decisione e si adatta alla tua struttura.",
    pullQuote: "Aumenti dei ricavi camere gia' dopo il primo mese.",
    logo: "/santaddeo-logo.png",
    url: "santaddeo.com",
    status: "online",
    productIcon: TrendingUp,
    ink: "#0c4a3e",
    accent: "#0d9488",
    accentSoft: "#ccfbf1",
    features: [
      { title: "Formula a Commissione", text: "Zero costi fissi. Paghi solo in base ai risultati." },
      { title: "Risultati dal Primo Mese", text: "Aumento ricavi camere gia' dopo 30 giorni." },
      { title: "100% Trasparente", text: "Ogni prezzo proposto e' spiegato in linguaggio semplice." },
      { title: "Guard - Controllo OTA", text: "Verifica che le OTA vendano ai prezzi inviati dall'RMS." },
      { title: "AI che si Adatta", text: "Apprende dalla tua struttura e dal mercato locale." },
      { title: "Multi-PMS", text: "Connesso a Scidoo, Bedzzle, Kross, BookingExpert e altri." },
      { title: "Push Automatico", text: "Prezzi pushati al PMS 24/7 senza intervento manuale." },
      { title: "Per Ogni Struttura", text: "Hotel, B&B, residence, agriturismi: si adatta a tutti." },
    ],
  },
  {
    id: "hotelprofit-ai",
    name: "HotelProfit AI",
    tagline: "Controllo di Gestione Intelligente",
    description:
      "Massimizza i profitti del tuo hotel con un team di commercialisti specializzati supportati dall'AI.",
    pullQuote: "Costi, ricavi e marginalita': finalmente sotto controllo.",
    logo: "/hotelprofit-ai-logo.png",
    url: "hotelprofitai.com",
    status: "online",
    productIcon: Calculator,
    ink: "#1e3a8a",
    accent: "#2563eb",
    accentSoft: "#dbeafe",
    features: [
      { title: "Analisi Real-Time", text: "Costi, ricavi e marginalita' sempre aggiornati." },
      { title: "Forecasting AI", text: "Previsioni su ricavi e cash-flow basate su dati reali." },
      { title: "Team di Esperti", text: "Commercialisti specializzati nel settore hospitality." },
      { title: "Consigli Personalizzati", text: "Suggerimenti operativi basati sui tuoi numeri." },
      { title: "Budget vs Consuntivo", text: "Confronti automatici su tutti i KPI di struttura." },
      { title: "Multi-Property", text: "Tutte le tue strutture in un'unica dashboard." },
      { title: "Adempimenti Fiscali", text: "Integrazione con bilancio e gestione fiscale." },
      { title: "Report Automatici", text: "Settimanali, mensili e annuali generati per te." },
    ],
  },
  {
    id: "manubot",
    name: "Manubot",
    tagline: "The Smart Maintenance Assistant",
    description:
      "Sistema universale di gestione delle manutenzioni che parla la lingua di tutti: WhatsApp e Telegram.",
    pullQuote: "Apri un ticket di manutenzione con un messaggio.",
    logo: "/manubot-logo.jpg",
    url: "manubot.it",
    status: "online",
    productIcon: Bot,
    ink: "#9a3412",
    accent: "#ea580c",
    accentSoft: "#ffedd5",
    features: [
      { title: "WhatsApp & Telegram", text: "Apri ticket di manutenzione con un messaggio." },
      { title: "End-to-End", text: "Smista, assegna e traccia ogni richiesta in autonomia." },
      { title: "Universale", text: "Hotel, residence, aziende, condomini: funziona ovunque." },
      { title: "Storico Completo", text: "Ogni intervento tracciato con tempi e costi." },
      { title: "Zero Training", text: "Basta saper scrivere su WhatsApp. Nessun corso da fare." },
      { title: "Multilingua", text: "Supporta 35+ lingue per staff e ospiti stranieri." },
      { title: "Foto + Posizione", text: "Tutte le info raccolte e collegate automaticamente." },
      { title: "Notifiche Push", text: "Lo staff riceve le richieste in tempo reale." },
    ],
  },
  {
    id: "hotel-accelerator",
    name: "Hotel Accelerator",
    tagline: "Il Software Gestionale Completo",
    description:
      "CMS, CRM, Email Marketing, Inbox Omnicanale e AI in un'unica soluzione. Aumenta le prenotazioni dirette fino al 35%.",
    pullQuote: "+35% di prenotazioni dirette. Meno commissioni OTA.",
    logo: "/hotel-accelerator-logo.jpg",
    url: "hotelaccelerator.com",
    status: "online",
    productIcon: Hotel,
    ink: "#4c1d95",
    accent: "#7c3aed",
    accentSoft: "#ede9fe",
    features: [
      { title: "+35% Dirette", text: "Marketing automation che sposta i booking dalle OTA al sito." },
      { title: "Inbox Omnicanale", text: "Email, chat, WhatsApp e social in un'unica casella." },
      { title: "CRM + Email Marketing", text: "Segmentazione automatica e campagne mirate." },
      { title: "AI Integrata", text: "Risponde alle FAQ, suggerisce upsell, personalizza." },
      { title: "Booking Engine", text: "Motore di prenotazione integrato e senza commissioni." },
      { title: "Sito Web Incluso", text: "Landing page e sito hotel pronti all'uso." },
      { title: "Channel Manager", text: "Sincronizza disponibilita' e prezzi su tutte le OTA." },
      { title: "Social Media Auto", text: "Posta su Facebook, Instagram e LinkedIn in automatico." },
    ],
  },
]

function StatusPill({ status, accent }: { status: ProductStatus; accent: string }) {
  if (status === "online") {
    return (
      <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 border border-emerald-200">
        <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500" />
        <span className="text-[12px] font-bold uppercase tracking-widest text-emerald-700">Online</span>
      </span>
    )
  }
  return (
    <span
      className="inline-flex items-center gap-2 px-3 py-1 rounded-full border"
      style={{ backgroundColor: "#fef3c7", borderColor: "#fcd34d" }}
    >
      <span className="inline-flex h-2 w-2 rounded-full" style={{ backgroundColor: accent }} />
      <span className="text-[12px] font-bold uppercase tracking-widest" style={{ color: "#92400e" }}>
        In Sviluppo
      </span>
    </span>
  )
}

function ProductPage({ product, index, total }: { product: Product; index: number; total: number }) {
  const ProductIcon = product.productIcon
  const pageNum = String(index + 1).padStart(2, "0")
  const totalNum = String(total).padStart(2, "0")

  return (
    <div className="volantino-4-inner-page bg-[#f5f5f4]">
      {/* Giant background number (decorative) */}
      <div
        className="absolute -top-10 -right-8 select-none pointer-events-none font-black leading-none"
        style={{
          fontSize: "16rem",
          color: product.accentSoft,
          letterSpacing: "-0.05em",
          opacity: 0.55,
        }}
        aria-hidden="true"
      >
        {pageNum}
      </div>

      {/* Top color band */}
      <div className="h-3 w-full shrink-0" style={{ backgroundColor: product.accent }} aria-hidden="true" />

      {/* Header */}
      <div className="px-8 pt-7 pb-4 flex items-center justify-between shrink-0 relative z-10">
        <div className="flex items-center gap-3">
          <div
            className="h-12 w-12 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: product.accent }}
          >
            <ProductIcon className="h-6 w-6 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-[13px] font-bold uppercase tracking-[0.2em] text-gray-500">
              Suite 4BID &middot; n. {pageNum}/{totalNum}
            </p>
            <p className="text-[15px] font-semibold mt-1" style={{ color: product.ink }}>
              {product.tagline}
            </p>
          </div>
        </div>
        <StatusPill status={product.status} accent={product.accent} />
      </div>

      {/* Main title block + Logo */}
      <div className="px-8 pt-3 pb-5 shrink-0 relative z-10">
        <div className="flex items-end gap-4">
          <div className="flex-1 min-w-0">
            <h2
              className="text-[3.5rem] font-black tracking-tight leading-[0.95] text-balance"
              style={{ color: product.ink }}
            >
              {product.name}
            </h2>
          </div>
          <ProductLogo product={product} />
        </div>
      </div>

      {/* Pull quote box */}
      <div className="px-8 shrink-0 relative z-10">
        <div
          className="rounded-2xl px-5 py-4 flex items-start gap-3 border-l-[6px]"
          style={{ backgroundColor: product.accentSoft, borderLeftColor: product.accent }}
        >
          <Quote className="h-5 w-5 shrink-0 mt-0.5" style={{ color: product.accent }} strokeWidth={2.5} />
          <p className="text-[18px] font-bold leading-snug text-pretty italic" style={{ color: product.ink }}>
            {product.pullQuote}
          </p>
        </div>
      </div>

      {/* Section label */}
      <div className="px-8 pt-5 pb-3 shrink-0 relative z-10">
        <div className="flex items-center gap-3">
          <span className="text-[13px] font-bold uppercase tracking-[0.25em]" style={{ color: product.accent }}>
            8 Caratteristiche Principali
          </span>
          <div className="flex-1 h-px bg-gray-300" />
        </div>
      </div>

      {/* Features grid 2x4 - larger cards for readability */}
      <div className="px-8 flex-1 min-h-0 relative z-10 pb-5">
        <div className="grid grid-cols-2 grid-rows-4 gap-3 h-full">
          {product.features.map((f, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-sm flex flex-col gap-2.5 overflow-hidden"
            >
              <div className="flex items-center gap-2.5">
                <span
                  className="shrink-0 text-[14px] font-mono font-black w-9 h-9 rounded-lg flex items-center justify-center text-white"
                  style={{ backgroundColor: product.accent }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <p
                  className="text-[16.5px] font-bold leading-tight text-pretty flex-1 min-w-0"
                  style={{ color: product.ink }}
                >
                  {f.title}
                </p>
              </div>
              <p className="text-[13.5px] leading-snug text-gray-700 text-pretty flex-1">{f.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="shrink-0 relative z-10">
        <div
          className="px-8 py-5 flex items-center justify-between"
          style={{ backgroundColor: product.ink }}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <Globe className="h-5 w-5 shrink-0" style={{ color: product.accentSoft }} />
            <p className="text-[17px] font-bold text-white tracking-tight truncate">{product.url}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[12px] uppercase tracking-widest" style={{ color: product.accentSoft }}>
              Scopri di piu&apos;
            </span>
            <ArrowRight className="h-4 w-4" style={{ color: product.accentSoft }} />
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * ProductLogo renders the product logo at the right size/background per product:
 * - Santaddeo: wide ratio, larger horizontal container, transparent (already PNG alpha)
 * - HotelProfit AI: square PNG already transparent, no blend
 * - Manubot: JPG with dark background, embraced inside a dark rounded box that matches
 * - Hotel Accelerator: JPG on white background, larger box with explicit white bg
 */
function ProductLogo({ product }: { product: Product }) {
  // Per-product visual config
  const configs: Record<
    string,
    { containerClass: string; bgClass: string; padding: string; rounded: string }
  > = {
    santaddeo: {
      containerClass: "h-24 w-44",
      bgClass: "bg-transparent",
      padding: "p-0",
      rounded: "",
    },
    "hotelprofit-ai": {
      containerClass: "h-28 w-28",
      bgClass: "bg-transparent",
      padding: "p-0",
      rounded: "",
    },
    manubot: {
      containerClass: "h-28 w-28",
      bgClass: "bg-[#1a1a1a]",
      padding: "p-2",
      rounded: "rounded-2xl",
    },
    "hotel-accelerator": {
      containerClass: "h-32 w-32",
      bgClass: "bg-white",
      padding: "p-2",
      rounded: "rounded-2xl shadow-md ring-1 ring-black/5",
    },
  }
  const cfg = configs[product.id] ?? {
    containerClass: "h-24 w-24",
    bgClass: "bg-transparent",
    padding: "p-0",
    rounded: "",
  }
  return (
    <div
      className={`shrink-0 relative ${cfg.containerClass} ${cfg.bgClass} ${cfg.padding} ${cfg.rounded} flex items-center justify-center`}
    >
      <div className="relative h-full w-full">
        <Image
          src={product.logo || "/placeholder.svg"}
          alt={`${product.name} logo`}
          fill
          className="object-contain"
          sizes="160px"
          priority
        />
      </div>
    </div>
  )
}

function CoverPage() {
  return (
    <div className="volantino-4-inner-page bg-[#f5f5f4]">
      {/* Giant "4" decorative */}
      <div
        className="absolute -bottom-16 -right-10 select-none pointer-events-none font-black leading-none text-orange-100"
        style={{ fontSize: "30rem", letterSpacing: "-0.05em" }}
        aria-hidden="true"
      >
        4
      </div>

      {/* Color band */}
      <div className="h-3 w-full shrink-0 flex" aria-hidden="true">
        <div className="flex-1" style={{ backgroundColor: "#0d9488" }} />
        <div className="flex-1" style={{ backgroundColor: "#2563eb" }} />
        <div className="flex-1" style={{ backgroundColor: "#ea580c" }} />
        <div className="flex-1" style={{ backgroundColor: "#7c3aed" }} />
      </div>

      {/* Header */}
      <div className="px-8 pt-12 pb-5 shrink-0 relative z-10 flex items-center gap-4">
        <div className="h-24 w-24 rounded-2xl bg-white shadow-md overflow-hidden flex items-center justify-center p-2">
          <div className="relative h-full w-full">
            <Image src="/4bid-borghi-logo.jpeg" alt="4BID SRL" fill className="object-contain" sizes="96px" />
          </div>
        </div>
        <div>
          <p className="text-[14px] uppercase tracking-[0.3em] text-gray-500 font-bold">Holding</p>
          <p className="text-[2.6rem] font-black tracking-tight leading-none mt-1 text-gray-900">4BID SRL</p>
        </div>
      </div>

      {/* Issue marker */}
      <div className="px-8 pb-2 shrink-0 relative z-10">
        <div className="flex items-center gap-3">
          <span className="text-[14px] font-bold uppercase tracking-[0.25em] text-orange-600">
            Edizione Speciale
          </span>
          <div className="flex-1 h-px bg-gray-300" />
          <span className="text-[14px] font-mono text-gray-500">2026</span>
        </div>
      </div>

      {/* Big headline */}
      <div className="px-8 pt-8 pb-5 shrink-0 relative z-10">
        <h1
          className="font-black tracking-tight leading-[0.9] text-balance text-gray-900"
          style={{ fontSize: "4.6rem" }}
        >
          La suite
          <br />
          <span className="text-orange-600">completa</span>
          <br />
          per il turismo.
        </h1>
      </div>

      {/* Lead paragraph */}
      <div className="px-8 pb-6 shrink-0 relative z-10">
        <p className="text-[19px] leading-relaxed text-gray-700 text-pretty max-w-[88%]">
          Quattro prodotti pensati, sviluppati e gestiti da chi il settore lo vive ogni giorno. Una sola visione:
          piu&apos; ricavi, piu&apos; controllo, meno fatica.
        </p>
      </div>

      {/* Spacer pushes the index towards the bottom for better vertical balance */}
      <div className="flex-1 min-h-0 relative z-10" aria-hidden="true" />

      {/* Index */}
      <div className="px-8 pb-6 shrink-0 relative z-10">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-[13px] font-bold uppercase tracking-[0.25em] text-gray-500">
            In questo numero
          </span>
          <div className="flex-1 h-px bg-gray-300" />
        </div>
        <div className="space-y-3">
          {products.map((p, i) => {
            const Icon = p.productIcon
            return (
              <div key={p.id} className="flex items-center gap-4">
                <span
                  className="text-[15px] font-mono font-black w-10 shrink-0"
                  style={{ color: p.accent }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div
                  className="h-11 w-11 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: p.accentSoft }}
                >
                  <Icon className="h-5 w-5" style={{ color: p.accent }} strokeWidth={2.5} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[18px] font-bold text-gray-900 leading-tight truncate">{p.name}</p>
                  <p className="text-[13px] text-gray-500 leading-tight mt-0.5">{p.tagline}</p>
                </div>
                <StatusPill status={p.status} accent={p.accent} />
              </div>
            )
          })}
        </div>
      </div>

      {/* Footer with site URL */}
      <div className="shrink-0 relative z-10 bg-gray-900 px-8 py-5 flex items-center justify-between">
        <div>
          <p className="text-[13px] uppercase tracking-[0.25em] text-orange-300 font-bold">
            Scopri tutta la suite
          </p>
          <p className="text-[1.7rem] font-black text-white mt-1">www.4bid.it</p>
        </div>
        <div className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-orange-300" />
          <span className="text-[14px] text-gray-300 font-medium">info@4bid.it</span>
        </div>
      </div>
    </div>
  )
}

function BackCover() {
  return (
    <div className="volantino-4-inner-page bg-[#f5f5f4]">
      {/* Color band */}
      <div className="h-3 w-full shrink-0 flex" aria-hidden="true">
        <div className="flex-1" style={{ backgroundColor: "#0d9488" }} />
        <div className="flex-1" style={{ backgroundColor: "#2563eb" }} />
        <div className="flex-1" style={{ backgroundColor: "#ea580c" }} />
        <div className="flex-1" style={{ backgroundColor: "#7c3aed" }} />
      </div>

      {/* Decorative big arrow */}
      <div
        className="absolute -top-10 -left-14 select-none pointer-events-none font-black leading-none text-orange-100"
        style={{ fontSize: "28rem", letterSpacing: "-0.05em" }}
        aria-hidden="true"
      >
        &rsaquo;
      </div>

      {/* Header */}
      <div className="px-8 pt-12 pb-3 shrink-0 relative z-10">
        <p className="text-[14px] font-bold uppercase tracking-[0.3em] text-orange-600">Inizia oggi</p>
        <h2
          className="font-black tracking-tight leading-[0.95] mt-3 text-balance text-gray-900"
          style={{ fontSize: "3.6rem" }}
        >
          Pronto a far
          <br />
          crescere
          <br />
          <span className="text-orange-600">la tua struttura?</span>
        </h2>
      </div>

      <div className="px-8 pb-6 shrink-0 relative z-10">
        <p className="text-[18px] leading-relaxed text-gray-700 text-pretty max-w-[92%]">
          Contattaci per una demo gratuita di uno qualunque dei prodotti della suite. Senza impegno, senza costi
          nascosti.
        </p>
      </div>

      {/* Steps */}
      <div className="px-8 shrink-0 relative z-10 space-y-4 pb-4">
        {[
          { n: "01", title: "Contattaci", text: "Email o dal sito www.4bid.it" },
          { n: "02", title: "Demo Personalizzata", text: "Ti mostriamo i prodotti adatti alla tua struttura" },
          { n: "03", title: "Start in Pochi Giorni", text: "Setup rapido e supporto dedicato dal primo giorno" },
        ].map((s) => (
          <div
            key={s.n}
            className="bg-white rounded-2xl border border-gray-200/80 px-5 py-4 flex items-start gap-4"
          >
            <span
              className="shrink-0 font-mono font-black w-14 h-14 rounded-xl flex items-center justify-center text-white text-[20px]"
              style={{ backgroundColor: "#ea580c" }}
            >
              {s.n}
            </span>
            <div className="flex-1 min-w-0 pt-1">
              <p className="text-[19px] font-bold leading-tight text-gray-900">{s.title}</p>
              <p className="text-[14px] text-gray-600 leading-snug mt-1.5">{s.text}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex-1 min-h-0" />

      {/* Contact card */}
      <div className="mx-8 mb-6 rounded-2xl bg-gray-900 text-white p-5 shrink-0 relative z-10">
        <p className="text-[13px] font-bold uppercase tracking-[0.25em] text-orange-300 mb-4">Contatti</p>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
              <Globe className="h-5 w-5 text-orange-300" />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-widest text-gray-400">Sito</p>
              <p className="text-[17px] font-bold mt-0.5">www.4bid.it</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
              <Mail className="h-5 w-5 text-orange-300" />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-widest text-gray-400">Email</p>
              <p className="text-[17px] font-bold mt-0.5">info@4bid.it</p>
            </div>
          </div>
        </div>
      </div>

      {/* Holding signature */}
      <div className="bg-gray-900 px-8 py-5 shrink-0 relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-14 w-14 rounded-full bg-white shadow-md overflow-hidden flex items-center justify-center p-1.5">
            <div className="relative h-full w-full">
              <Image src="/4bid-borghi-logo.jpeg" alt="4BID" fill className="object-contain" sizes="56px" />
            </div>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.25em] text-gray-400 font-bold">Holding</p>
            <p className="text-[20px] font-black text-white tracking-tight leading-tight mt-0.5">4BID SRL</p>
          </div>
        </div>
        <p className="text-[11px] uppercase tracking-[0.25em] text-gray-400 text-right leading-tight">
          La suite completa
          <br />
          <span className="text-orange-300 normal-case tracking-normal text-[13px]">per il turismo</span>
        </p>
      </div>
    </div>
  )
}

// Wraps a panel page in the scale container that fits A5 design into 99mm panel.
function PanelSlot({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <div className="volantino-4-panel">
      {/* Print-only safe area marker (hidden via no-print outside print) */}
      <span className="sr-only">{label}</span>
      <div className="volantino-4-scale">{children}</div>
    </div>
  )
}

export default function Volantino4Client() {
  const sheet1Ref = useRef<HTMLDivElement>(null)
  const sheet2Ref = useRef<HTMLDivElement>(null)
  const [downloading, setDownloading] = useState<"idle" | "1" | "2" | "all">("idle")

  const handlePrint = () => {
    window.print()
  }

  const downloadSheet = async (which: "1" | "2") => {
    const node = which === "1" ? sheet1Ref.current : sheet2Ref.current
    if (!node) return
    setDownloading(which)
    try {
      const { toJpeg } = await import("html-to-image")
      // Render at high DPI for print quality: ~300 DPI on a 299mm x 212mm sheet.
      // 299mm = 11.77in -> 11.77 * 300 = 3530px width; we use pixelRatio 3 to keep it manageable.
      const dataUrl = await toJpeg(node, {
        pixelRatio: 3,
        cacheBust: true,
        backgroundColor: "#f5f5f4",
        quality: 0.95,
        skipFonts: false,
      })
      const link = document.createElement("a")
      link.download =
        which === "1" ? "volantino-4bid-fronte-interno.jpg" : "volantino-4bid-retro-esterno.jpg"
      link.href = dataUrl
      link.click()
    } catch (err) {
      console.error("[v0] download error", err)
      alert("Errore nel download. Riprova o usa il pulsante Stampa PDF.")
    } finally {
      setDownloading("idle")
    }
  }

  const downloadBoth = async () => {
    setDownloading("all")
    try {
      const { toJpeg } = await import("html-to-image")
      for (const [ref, name] of [
        [sheet1Ref, "volantino-4bid-fronte-interno.jpg"],
        [sheet2Ref, "volantino-4bid-retro-esterno.jpg"],
      ] as const) {
        if (!ref.current) continue
        const dataUrl = await toJpeg(ref.current, {
          pixelRatio: 3,
          cacheBust: true,
          backgroundColor: "#f5f5f4",
          quality: 0.95,
          skipFonts: false,
        })
        const link = document.createElement("a")
        link.download = name
        link.href = dataUrl
        link.click()
        // Small pause so the browser registers the second download
        await new Promise((r) => setTimeout(r, 400))
      }
    } catch (err) {
      console.error("[v0] download all error", err)
      alert("Errore nel download. Riprova o usa il pulsante Stampa PDF.")
    } finally {
      setDownloading("idle")
    }
  }

  const totalProducts = products.length // 4
  const [santaddeo, hotelProfit, manubot, hotelAccelerator] = products

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Toolbar - hidden on print */}
      <div className="no-print sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              Volantino Prodotti 4BID &mdash; v4 Tri-fold A4 (Pixart 299&times;212mm)
            </h1>
            <p className="text-sm text-gray-500">
              2 fogli A4 orizzontali &middot; 3 pannelli da 99,67mm &middot; pronto per upload su Pixart
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={() => downloadSheet("1")}
              size="sm"
              variant="outline"
              disabled={downloading !== "idle"}
            >
              {downloading === "1" ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Foglio 1 JPG
            </Button>
            <Button
              onClick={() => downloadSheet("2")}
              size="sm"
              variant="outline"
              disabled={downloading !== "idle"}
            >
              {downloading === "2" ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Foglio 2 JPG
            </Button>
            <Button
              onClick={downloadBoth}
              size="sm"
              className="bg-orange-600 hover:bg-orange-700 text-white"
              disabled={downloading !== "idle"}
            >
              {downloading === "all" ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Entrambi JPG
            </Button>
            <Button
              onClick={handlePrint}
              size="sm"
              className="bg-gray-900 hover:bg-gray-800 text-white"
              disabled={downloading !== "idle"}
            >
              <Printer className="h-4 w-4 mr-2" />
              Stampa PDF
            </Button>
          </div>
        </div>
        <div className="container mx-auto px-6 pb-3 -mt-1">
          <p className="text-xs text-gray-500">
            <strong>Per la stampa Pixart:</strong> usa &quot;Entrambi JPG&quot; per scaricare le 2 immagini in alta
            risoluzione (300 DPI, qualita&apos; 95%) e caricale come pagina 1 e 2 nel template Pieghevoli
            299&times;212mm.
          </p>
        </div>
      </div>

      {/* Sheets */}
      <div className="py-8 px-4 print:p-0 flex flex-col items-center gap-10 print:gap-0">
        {/* Sheet 1 - INTERNO: 3 prodotti */}
        <div className="w-full max-w-[calc(299mm+2rem)]">
          <div className="no-print mb-3 flex items-center gap-3">
            <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-700 text-xs font-bold uppercase tracking-wider">
              Foglio 1 / Interno
            </span>
            <span className="text-xs text-gray-500">
              Pannelli: <strong>Santaddeo</strong> &middot; <strong>HotelProfit AI</strong> &middot;{" "}
              <strong>Manubot</strong>
            </span>
          </div>
          <div ref={sheet1Ref} className="volantino-4-sheet">
            <PanelSlot label="Pannello 1 - Santaddeo">
              <ProductPage product={santaddeo} index={0} total={totalProducts} />
            </PanelSlot>
            <PanelSlot label="Pannello 2 - HotelProfit AI">
              <ProductPage product={hotelProfit} index={1} total={totalProducts} />
            </PanelSlot>
            <PanelSlot label="Pannello 3 - Manubot">
              <ProductPage product={manubot} index={2} total={totalProducts} />
            </PanelSlot>
          </div>
        </div>

        {/* Sheet 2 - ESTERNO: retro copertina | ultimo prodotto | copertina
            (ordine corretto per letter-fold: piegando, la copertina finisce sopra a destra) */}
        <div className="w-full max-w-[calc(299mm+2rem)]">
          <div className="no-print mb-3 flex items-center gap-3">
            <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-orange-100 text-orange-700 text-xs font-bold uppercase tracking-wider">
              Foglio 2 / Esterno
            </span>
            <span className="text-xs text-gray-500">
              Pannelli: <strong>Retro copertina</strong> &middot; <strong>Hotel Accelerator</strong> &middot;{" "}
              <strong>Copertina</strong>
            </span>
          </div>
          <div ref={sheet2Ref} className="volantino-4-sheet">
            <PanelSlot label="Pannello 1 - Retro copertina">
              <BackCover />
            </PanelSlot>
            <PanelSlot label="Pannello 2 - Hotel Accelerator">
              <ProductPage product={hotelAccelerator} index={3} total={totalProducts} />
            </PanelSlot>
            <PanelSlot label="Pannello 3 - Copertina">
              <CoverPage />
            </PanelSlot>
          </div>
        </div>
      </div>
    </div>
  )
}
