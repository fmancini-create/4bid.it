"use client"

import Image from "next/image"
import {
  Printer,
  TrendingUp,
  Bot,
  Calculator,
  Hotel,
  Zap,
  Globe,
  Mail,
  Phone,
  ArrowRight,
  Quote,
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
  // Light editorial palette
  ink: string // dark ink color for headings (CSS color)
  accent: string // bright accent for highlights
  accentSoft: string // very light tint for backgrounds
  features: { title: string; text: string }[]
}

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
    status: "in-sviluppo",
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
  {
    id: "ecomobility",
    name: "4BID Ecomobility",
    tagline: "Mobilita' Elettrica per il Turismo",
    description:
      "Trasforma il parcheggio del tuo hotel in un servizio premium: colonnine di ricarica, ricavi extra e ospiti EV soddisfatti.",
    pullQuote: "Il tuo parcheggio diventa una fonte di ricavo.",
    logo: "/ecomobility-logo.png",
    url: "4bid.it/ecomobility",
    status: "in-sviluppo",
    productIcon: Zap,
    ink: "#064e3b",
    accent: "#059669",
    accentSoft: "#d1fae5",
    features: [
      { title: "Charging Hotel Network", text: "La tua struttura sulla mappa nazionale dei punti di ricarica." },
      { title: "Ricavi Extra", text: "Monetizzi ogni sessione di ricarica dei tuoi ospiti." },
      { title: "Ospiti EV Targetizzati", text: "Attrai una clientela alto-spendente con auto elettrica." },
      { title: "Gestione Centralizzata", text: "Dashboard unica per consumi, utenti e ricavi." },
      { title: "Zero Investimento", text: "Colonnine fornite e installate gratuitamente." },
      { title: "Tariffe Personalizzabili", text: "Decidi tu i prezzi per ospiti e per esterni." },
      { title: "Visibilita' App Top", text: "Plugsurfing, ChargeMap, Google Maps e altre." },
      { title: "Manutenzione Inclusa", text: "Assistenza H24 e ricambi compresi nel servizio." },
    ],
  },
]

function StatusPill({ status, accent }: { status: ProductStatus; accent: string }) {
  if (status === "online") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-100 border border-emerald-200">
        <span className="inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
        <span className="text-[9px] font-bold uppercase tracking-widest text-emerald-700">Online</span>
      </span>
    )
  }
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border"
      style={{ backgroundColor: "#fef3c7", borderColor: "#fcd34d" }}
    >
      <span className="inline-flex h-1.5 w-1.5 rounded-full" style={{ backgroundColor: accent }} />
      <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: "#92400e" }}>
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
    <div className="volantino-3-page bg-[#f5f5f4] flex flex-col relative">
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
      <div className="h-2 w-full shrink-0" style={{ backgroundColor: product.accent }} aria-hidden="true" />

      {/* Header */}
      <div className="px-7 pt-5 pb-3 flex items-center justify-between shrink-0 relative z-10">
        <div className="flex items-center gap-2.5">
          <div
            className="h-8 w-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: product.accent }}
          >
            <ProductIcon className="h-4 w-4 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-gray-500">
              Suite 4BID &middot; n. {pageNum}/{totalNum}
            </p>
            <p className="text-[10px] font-semibold mt-0.5" style={{ color: product.ink }}>
              {product.tagline}
            </p>
          </div>
        </div>
        <StatusPill status={product.status} accent={product.accent} />
      </div>

      {/* Main title block + Logo */}
      <div className="px-7 pt-2 pb-3 shrink-0 relative z-10">
        <div className="flex items-end gap-3">
          <div className="flex-1 min-w-0">
            <h2
              className="text-[2.4rem] font-black tracking-tight leading-[0.95] text-balance"
              style={{ color: product.ink }}
            >
              {product.name}
            </h2>
          </div>
          <div className="shrink-0 relative h-24 w-24">
            <Image
              src={product.logo || "/placeholder.svg"}
              alt={`${product.name} logo`}
              fill
              className="object-contain mix-blend-multiply"
              sizes="96px"
              priority
            />
          </div>
        </div>
      </div>

      {/* Pull quote box - compact */}
      <div className="px-7 shrink-0 relative z-10">
        <div
          className="rounded-xl px-3 py-2.5 flex items-start gap-2 border-l-4"
          style={{ backgroundColor: product.accentSoft, borderLeftColor: product.accent }}
        >
          <Quote className="h-3.5 w-3.5 shrink-0 mt-0.5" style={{ color: product.accent }} strokeWidth={2.5} />
          <p
            className="text-[12px] font-bold leading-snug text-pretty italic"
            style={{ color: product.ink }}
          >
            {product.pullQuote}
          </p>
        </div>
      </div>

      {/* Section label */}
      <div className="px-7 pt-3 pb-2 shrink-0 relative z-10">
        <div className="flex items-center gap-2">
          <span
            className="text-[9px] font-bold uppercase tracking-[0.25em]"
            style={{ color: product.accent }}
          >
            8 Caratteristiche Principali
          </span>
          <div className="flex-1 h-px bg-gray-300" />
        </div>
      </div>

      {/* Features grid 2x4 - bigger cards filling all available space */}
      <div className="px-7 flex-1 min-h-0 relative z-10 pb-4">
        <div className="grid grid-cols-2 grid-rows-4 gap-2 h-full">
          {product.features.map((f, i) => (
            <div
              key={i}
              className="bg-white rounded-xl p-3 border border-gray-200/80 shadow-sm flex flex-col gap-1.5 overflow-hidden"
            >
              <div className="flex items-center gap-2">
                <span
                  className="shrink-0 text-[10px] font-mono font-black w-6 h-6 rounded-md flex items-center justify-center text-white"
                  style={{ backgroundColor: product.accent }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <p
                  className="text-[11.5px] font-bold leading-tight text-pretty flex-1 min-w-0"
                  style={{ color: product.ink }}
                >
                  {f.title}
                </p>
              </div>
              <p className="text-[10px] leading-snug text-gray-700 text-pretty flex-1">{f.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="shrink-0 relative z-10">
        <div
          className="px-7 py-3 flex items-center justify-between"
          style={{ backgroundColor: product.ink }}
        >
          <div className="flex items-center gap-2 min-w-0">
            <Globe className="h-3.5 w-3.5 shrink-0" style={{ color: product.accentSoft }} />
            <p className="text-[11px] font-bold text-white tracking-tight truncate">{product.url}</p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[9px] uppercase tracking-widest" style={{ color: product.accentSoft }}>
              Scopri di piu&apos;
            </span>
            <ArrowRight className="h-3 w-3" style={{ color: product.accentSoft }} />
          </div>
        </div>
      </div>
    </div>
  )
}

function CoverPage() {
  return (
    <div className="volantino-3-page bg-[#f5f5f4] flex flex-col relative">
      {/* Giant "4" decorative */}
      <div
        className="absolute -bottom-12 -right-8 select-none pointer-events-none font-black leading-none text-orange-100"
        style={{ fontSize: "22rem", letterSpacing: "-0.05em" }}
        aria-hidden="true"
      >
        4
      </div>

      {/* Color band */}
      <div className="h-1.5 w-full shrink-0 flex" aria-hidden="true">
        <div className="flex-1" style={{ backgroundColor: "#0d9488" }} />
        <div className="flex-1" style={{ backgroundColor: "#2563eb" }} />
        <div className="flex-1" style={{ backgroundColor: "#ea580c" }} />
        <div className="flex-1" style={{ backgroundColor: "#7c3aed" }} />
        <div className="flex-1" style={{ backgroundColor: "#059669" }} />
      </div>

      {/* Header */}
      <div className="px-7 pt-7 pb-3 shrink-0 relative z-10 flex items-center gap-3">
        <div className="h-16 w-16 rounded-2xl bg-white shadow-md overflow-hidden flex items-center justify-center p-1.5">
          <div className="relative h-full w-full">
            <Image
              src="/4bid-borghi-logo.jpeg"
              alt="4BID SRL"
              fill
              className="object-contain"
              sizes="64px"
            />
          </div>
        </div>
        <div>
          <p className="text-[9px] uppercase tracking-[0.3em] text-gray-500 font-bold">Holding</p>
          <p className="text-2xl font-black tracking-tight leading-none mt-0.5 text-gray-900">4BID SRL</p>
        </div>
      </div>

      {/* Issue marker */}
      <div className="px-7 pb-1 shrink-0 relative z-10">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-orange-600">
            Edizione Speciale
          </span>
          <div className="flex-1 h-px bg-gray-300" />
          <span className="text-[10px] font-mono text-gray-500">2026</span>
        </div>
      </div>

      {/* Big headline */}
      <div className="px-7 pt-4 pb-3 shrink-0 relative z-10">
        <h1
          className="font-black tracking-tight leading-[0.9] text-balance text-gray-900"
          style={{ fontSize: "3.2rem" }}
        >
          La suite
          <br />
          <span className="text-orange-600">completa</span>
          <br />
          per il turismo.
        </h1>
      </div>

      {/* Lead paragraph */}
      <div className="px-7 pb-4 shrink-0 relative z-10">
        <p className="text-[13px] leading-relaxed text-gray-700 text-pretty max-w-[88%]">
          Cinque prodotti pensati, sviluppati e gestiti da chi il settore lo vive ogni giorno. Una sola visione:
          piu&apos; ricavi, piu&apos; controllo, meno fatica.
        </p>
      </div>

      {/* Index */}
      <div className="px-7 flex-1 min-h-0 relative z-10">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[9px] font-bold uppercase tracking-[0.25em] text-gray-500">In questo numero</span>
          <div className="flex-1 h-px bg-gray-300" />
        </div>
        <div className="space-y-1.5">
          {products.map((p, i) => {
            const Icon = p.productIcon
            return (
              <div key={p.id} className="flex items-center gap-3 py-1">
                <span
                  className="text-[10px] font-mono font-black w-7 shrink-0"
                  style={{ color: p.accent }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div
                  className="h-7 w-7 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: p.accentSoft }}
                >
                  <Icon className="h-3.5 w-3.5" style={{ color: p.accent }} strokeWidth={2.5} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-bold text-gray-900 leading-tight truncate">{p.name}</p>
                  <p className="text-[9px] text-gray-500 leading-tight">{p.tagline}</p>
                </div>
                <StatusPill status={p.status} accent={p.accent} />
              </div>
            )
          })}
        </div>
      </div>

      {/* Footer with site URL */}
      <div className="shrink-0 relative z-10 bg-gray-900 px-7 py-3 flex items-center justify-between">
        <div>
          <p className="text-[9px] uppercase tracking-[0.25em] text-orange-300 font-bold">Scopri tutta la suite</p>
          <p className="text-base font-black text-white mt-0.5">www.4bid.it</p>
        </div>
        <div className="flex items-center gap-1.5">
          <Mail className="h-3.5 w-3.5 text-orange-300" />
          <span className="text-[10px] text-gray-300 font-medium">info@4bid.it</span>
        </div>
      </div>
    </div>
  )
}

function BackCover() {
  return (
    <div className="volantino-3-page bg-[#f5f5f4] flex flex-col relative">
      {/* Color band */}
      <div className="h-1.5 w-full shrink-0 flex" aria-hidden="true">
        <div className="flex-1" style={{ backgroundColor: "#0d9488" }} />
        <div className="flex-1" style={{ backgroundColor: "#2563eb" }} />
        <div className="flex-1" style={{ backgroundColor: "#ea580c" }} />
        <div className="flex-1" style={{ backgroundColor: "#7c3aed" }} />
        <div className="flex-1" style={{ backgroundColor: "#059669" }} />
      </div>

      {/* Decorative big arrow */}
      <div
        className="absolute -top-8 -left-10 select-none pointer-events-none font-black leading-none text-orange-100"
        style={{ fontSize: "20rem", letterSpacing: "-0.05em" }}
        aria-hidden="true"
      >
        &rsaquo;
      </div>

      {/* Header */}
      <div className="px-7 pt-7 pb-2 shrink-0 relative z-10">
        <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-orange-600">Inizia oggi</p>
        <h2 className="text-[2.4rem] font-black tracking-tight leading-[0.95] mt-2 text-balance text-gray-900">
          Pronto a far
          <br />
          crescere
          <br />
          <span className="text-orange-600">la tua struttura?</span>
        </h2>
      </div>

      <div className="px-7 pb-3 shrink-0 relative z-10">
        <p className="text-[12px] leading-relaxed text-gray-700 text-pretty max-w-[92%]">
          Contattaci per una demo gratuita di uno qualunque dei prodotti della suite. Senza impegno, senza costi
          nascosti.
        </p>
      </div>

      {/* Steps */}
      <div className="px-7 shrink-0 relative z-10 space-y-2.5 pb-3">
        {[
          { n: "01", title: "Contattaci", text: "Email, telefono o dal sito www.4bid.it" },
          { n: "02", title: "Demo Personalizzata", text: "Ti mostriamo i prodotti adatti alla tua struttura" },
          { n: "03", title: "Start in Pochi Giorni", text: "Setup rapido e supporto dedicato dal primo giorno" },
        ].map((s) => (
          <div
            key={s.n}
            className="bg-white rounded-xl border border-gray-200/80 px-3.5 py-2.5 flex items-start gap-3"
          >
            <span
              className="shrink-0 text-base font-mono font-black w-9 h-9 rounded-lg flex items-center justify-center text-white"
              style={{ backgroundColor: "#ea580c" }}
            >
              {s.n}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-bold leading-tight text-gray-900">{s.title}</p>
              <p className="text-[10.5px] text-gray-600 leading-snug mt-0.5">{s.text}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex-1 min-h-0" />

      {/* Contact card */}
      <div className="mx-7 mb-5 rounded-2xl bg-gray-900 text-white p-4 shrink-0 relative z-10">
        <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-orange-300 mb-3">Contatti</p>
        <div className="space-y-2">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
              <Globe className="h-3.5 w-3.5 text-orange-300" />
            </div>
            <div>
              <p className="text-[8px] uppercase tracking-widest text-gray-400">Sito</p>
              <p className="text-[12px] font-bold">www.4bid.it</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
              <Mail className="h-3.5 w-3.5 text-orange-300" />
            </div>
            <div>
              <p className="text-[8px] uppercase tracking-widest text-gray-400">Email</p>
              <p className="text-[12px] font-bold">info@4bid.it</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
              <Phone className="h-3.5 w-3.5 text-orange-300" />
            </div>
            <div>
              <p className="text-[8px] uppercase tracking-widest text-gray-400">Telefono</p>
              <p className="text-[12px] font-bold">Su richiesta dal sito</p>
            </div>
          </div>
        </div>
      </div>

      {/* Holding signature */}
      <div className="bg-gray-900 px-7 py-3 shrink-0 relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-10 w-10 rounded-full bg-white shadow-md overflow-hidden flex items-center justify-center p-1">
            <div className="relative h-full w-full">
              <Image src="/4bid-borghi-logo.jpeg" alt="4BID" fill className="object-contain" sizes="40px" />
            </div>
          </div>
          <div>
            <p className="text-[8px] uppercase tracking-[0.25em] text-gray-400 font-bold">Holding</p>
            <p className="text-[14px] font-black text-white tracking-tight leading-tight">4BID SRL</p>
          </div>
        </div>
        <p className="text-[8px] uppercase tracking-[0.25em] text-gray-400 text-right leading-tight">
          La suite completa
          <br />
          <span className="text-orange-300 normal-case tracking-normal text-[9px]">per il turismo</span>
        </p>
      </div>
    </div>
  )
}

export default function Volantino3Client() {
  const handlePrint = () => {
    window.print()
  }

  const totalProductPages = products.length

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Toolbar - hidden on print */}
      <div className="no-print sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Volantino Prodotti 4BID &mdash; v3 Editoriale</h1>
            <p className="text-sm text-gray-500">
              {totalProductPages + 2} facciate A5 &middot; stile light editoriale &middot; 8 caratteristiche per
              prodotto
            </p>
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
        <CoverPage />
        {products.map((p, i) => (
          <ProductPage key={p.id} product={p} index={i} total={totalProductPages} />
        ))}
        <BackCover />
      </div>
    </div>
  )
}
