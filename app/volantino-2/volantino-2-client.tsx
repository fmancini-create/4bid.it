"use client"

import Image from "next/image"
import {
  Printer,
  TrendingUp,
  Bot,
  Calculator,
  Hotel,
  Zap,
  CheckCircle2,
  Shield,
  Globe,
  Mail,
  Sparkles,
  ArrowUpRight,
  Circle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import "./print.css"

type ProductStatus = "online" | "in-sviluppo"

type Product = {
  id: string
  name: string
  tagline: string
  description: string
  logo: string
  url: string
  status: ProductStatus
  features: { title: string; text: string }[]
  productIcon: typeof TrendingUp
  // Tech-startup palette: each product has its own bold gradient
  heroGradient: string // background gradient class for hero
  accentColor: string // bright accent (hex) for highlights
  badgeBg: string // bg class for accent badges
  badgeText: string // text class for accent badges
  glowColor: string // hex for radial glow orbs
}

const products: Product[] = [
  {
    id: "santaddeo",
    name: "Santaddeo",
    tagline: "The Human Revenue Manager",
    description:
      "Il primo Revenue Management System Intelligente e Umano. Spiega ogni decisione e si adatta alla tua struttura.",
    logo: "/santaddeo-logo.png",
    url: "santaddeo.com",
    status: "online",
    productIcon: TrendingUp,
    heroGradient: "from-teal-500 via-cyan-500 to-emerald-500",
    accentColor: "#14b8a6",
    badgeBg: "bg-teal-500/10",
    badgeText: "text-teal-300",
    glowColor: "#14b8a6",
    features: [
      { title: "Formula a Commissione", text: "Zero costi fissi. Paghi solo in base ai risultati." },
      { title: "Risultati dal Primo Mese", text: "Aumenti ricavi camere gia' dopo 30 giorni di utilizzo." },
      { title: "100% Trasparente", text: "Ogni prezzo proposto e' spiegato in linguaggio semplice." },
      { title: "Guard - Controllo OTA", text: "Verifica che le OTA vendano ai prezzi inviati dall'RMS." },
    ],
  },
  {
    id: "hotelprofit-ai",
    name: "HotelProfit AI",
    tagline: "Controllo di Gestione Intelligente",
    description:
      "Massimizza i profitti del tuo hotel con un team di commercialisti specializzati supportati dall'AI.",
    logo: "/hotelprofit-ai-logo.png",
    url: "hotelprofitai.com",
    status: "online",
    productIcon: Calculator,
    heroGradient: "from-blue-600 via-indigo-500 to-emerald-500",
    accentColor: "#3b82f6",
    badgeBg: "bg-blue-500/10",
    badgeText: "text-blue-300",
    glowColor: "#3b82f6",
    features: [
      { title: "Analisi Real-Time", text: "Costi, ricavi e marginalita' sempre aggiornati in tempo reale." },
      { title: "Forecasting AI", text: "Previsioni su ricavi e cash-flow basate su dati e mercato." },
      { title: "Team di Esperti", text: "Commercialisti specializzati nel settore hospitality." },
      { title: "Consigli Personalizzati", text: "Suggerimenti operativi basati sui tuoi numeri reali." },
    ],
  },
  {
    id: "manubot",
    name: "Manubot",
    tagline: "The Smart Maintenance Assistant",
    description:
      "Sistema universale di gestione delle manutenzioni che parla la lingua di tutti: WhatsApp e Telegram.",
    logo: "/manubot-logo-new.png",
    url: "manubot.it",
    status: "online",
    productIcon: Bot,
    heroGradient: "from-orange-500 via-amber-500 to-rose-500",
    accentColor: "#f97316",
    badgeBg: "bg-orange-500/10",
    badgeText: "text-orange-300",
    glowColor: "#f97316",
    features: [
      { title: "WhatsApp & Telegram", text: "Apri ticket di manutenzione con un messaggio." },
      { title: "Automatico End-to-End", text: "Smista, assegna e tiene traccia di ogni richiesta." },
      { title: "Universale", text: "Adatto a hotel, residence, aziende, condomini." },
      { title: "Storico e Reportistica", text: "Ogni intervento tracciato. Report per costi e tempi." },
    ],
  },
  {
    id: "hotel-accelerator",
    name: "Hotel Accelerator",
    tagline: "Il Software Gestionale Completo per Hotel",
    description:
      "CMS, CRM, Email Marketing, Inbox Omnicanale e AI in un'unica soluzione. Aumenta le prenotazioni dirette fino al 35%.",
    logo: "/hotel-accelerator-logo.jpg",
    url: "hotelaccelerator.com",
    status: "in-sviluppo",
    productIcon: Hotel,
    heroGradient: "from-indigo-600 via-violet-500 to-fuchsia-500",
    accentColor: "#8b5cf6",
    badgeBg: "bg-violet-500/10",
    badgeText: "text-violet-300",
    glowColor: "#8b5cf6",
    features: [
      { title: "+35% Dirette", text: "Marketing automation che sposta le prenotazioni dalle OTA al sito." },
      { title: "Inbox Omnicanale", text: "Email, chat, WhatsApp e social in un'unica casella." },
      { title: "CRM + Email Marketing", text: "Segmentazione automatica e campagne mirate per fidelizzare." },
      { title: "AI Integrata", text: "Risponde alle FAQ, suggerisce upsell, personalizza l'esperienza." },
    ],
  },
  {
    id: "ecomobility",
    name: "4BID Ecomobility",
    tagline: "Mobilita' Elettrica per il Turismo",
    description:
      "Trasforma il parcheggio del tuo hotel in un servizio premium: colonnine di ricarica, ricavi extra e ospiti EV soddisfatti.",
    logo: "/ecomobility-logo.png",
    url: "4bid.it/ecomobility",
    status: "online",
    productIcon: Zap,
    heroGradient: "from-emerald-500 via-lime-500 to-teal-500",
    accentColor: "#10b981",
    badgeBg: "bg-emerald-500/10",
    badgeText: "text-emerald-300",
    glowColor: "#10b981",
    features: [
      { title: "Charging Hotel Network", text: "La tua struttura nella mappa nazionale dei punti di ricarica." },
      { title: "Ricavi Extra", text: "Monetizzi ogni sessione di ricarica. Zero investimento iniziale." },
      { title: "Ospiti EV Targetizzati", text: "Attrai una clientela alto-spendente con auto elettrica." },
      { title: "Gestione Centralizzata", text: "Dashboard unica per monitorare consumi, utenti e ricavi." },
    ],
  },
]

function StatusBadge({ status, accent }: { status: ProductStatus; accent: string }) {
  if (status === "online") {
    return (
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/30">
        <div className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
        </div>
        <span className="text-[9px] font-bold uppercase tracking-widest text-emerald-300">Online</span>
      </div>
    )
  }
  return (
    <div
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border"
      style={{ backgroundColor: `${accent}1A`, borderColor: `${accent}4D` }}
    >
      <Sparkles className="h-2.5 w-2.5" style={{ color: accent }} />
      <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: accent }}>
        In Sviluppo
      </span>
    </div>
  )
}

function ProductPanel({ product, index }: { product: Product; index: number }) {
  const ProductIcon = product.productIcon
  return (
    <div className="volantino-page bg-[#0a0a0f] text-white flex flex-col relative overflow-hidden">
      {/* Background glow orbs (decoration) */}
      <div
        className="absolute -top-20 -right-20 w-64 h-64 rounded-full opacity-30 blur-3xl pointer-events-none"
        style={{ background: `radial-gradient(circle, ${product.glowColor} 0%, transparent 70%)` }}
        aria-hidden="true"
      />
      <div
        className="absolute -bottom-32 -left-20 w-72 h-72 rounded-full opacity-20 blur-3xl pointer-events-none"
        style={{ background: `radial-gradient(circle, ${product.glowColor} 0%, transparent 70%)` }}
        aria-hidden="true"
      />

      {/* Subtle grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
        aria-hidden="true"
      />

      {/* Top accent gradient bar */}
      <div className={`h-1 w-full shrink-0 bg-gradient-to-r ${product.heroGradient}`} aria-hidden="true" />

      {/* Header: page number + status */}
      <div className="px-6 pt-5 pb-3 flex items-center justify-between shrink-0 relative z-10">
        <div className="flex items-center gap-2">
          <span
            className="text-[10px] font-mono font-bold tracking-widest"
            style={{ color: product.accentColor }}
          >
            0{index + 1}/05
          </span>
          <div className="h-px w-8 bg-white/20" />
          <span className="text-[9px] uppercase tracking-widest text-white/40 font-semibold">Prodotto</span>
        </div>
        <StatusBadge status={product.status} accent={product.accentColor} />
      </div>

      {/* Hero block: gradient card with logo + icon */}
      <div className="px-6 shrink-0 relative z-10">
        <div
          className={`relative rounded-2xl p-5 bg-gradient-to-br ${product.heroGradient} overflow-hidden`}
        >
          {/* Subtle noise/grain effect via overlay */}
          <div className="absolute inset-0 bg-black/10" aria-hidden="true" />

          <div className="relative flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/20 backdrop-blur-sm mb-3">
                <ProductIcon className="h-3 w-3 text-white" strokeWidth={2.5} />
                <span className="text-[9px] font-bold uppercase tracking-widest text-white">
                  {product.tagline.split(" ").slice(0, 3).join(" ")}
                </span>
              </div>
              <h2 className="text-[1.75rem] font-black tracking-tight leading-[1.05] text-white text-balance">
                {product.name}
              </h2>
            </div>

            {/* Floating logo card */}
            <div className="shrink-0 h-14 w-14 rounded-xl bg-white shadow-2xl overflow-hidden flex items-center justify-center p-1.5">
              <div className="relative h-full w-full">
                <Image
                  src={product.logo || "/placeholder.svg"}
                  alt={`${product.name} logo`}
                  fill
                  className="object-contain"
                  sizes="56px"
                  priority
                />
              </div>
            </div>
          </div>

          {/* Tagline pill at bottom */}
          <p className="relative mt-3 text-[11px] text-white/95 font-medium leading-snug">
            {product.tagline}
          </p>
        </div>
      </div>

      {/* Description */}
      <div className="px-6 pt-4 pb-3 shrink-0 relative z-10">
        <p className="text-[13px] leading-relaxed text-white/75 text-pretty">{product.description}</p>
      </div>

      {/* Features grid */}
      <div className="px-6 flex-1 min-h-0 overflow-hidden relative z-10">
        <div className="flex items-center gap-2 mb-3">
          <div
            className="h-1 w-1 rounded-full"
            style={{ backgroundColor: product.accentColor }}
            aria-hidden="true"
          />
          <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/50">Highlights</p>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        <div className="grid grid-cols-2 gap-2">
          {product.features.map((f, i) => (
            <div
              key={f.title}
              className="rounded-xl bg-white/[0.04] border border-white/10 p-2.5 backdrop-blur-sm relative overflow-hidden group"
            >
              {/* Corner number */}
              <div
                className="absolute top-1.5 right-1.5 text-[8px] font-mono font-bold opacity-30"
                style={{ color: product.accentColor }}
              >
                {String(i + 1).padStart(2, "0")}
              </div>

              <div
                className="h-5 w-5 rounded-md flex items-center justify-center mb-1.5"
                style={{ backgroundColor: `${product.accentColor}25` }}
              >
                <CheckCircle2 className="h-3 w-3" style={{ color: product.accentColor }} strokeWidth={2.5} />
              </div>
              <p className="text-[11px] font-bold text-white leading-tight">{f.title}</p>
              <p className="text-[9.5px] text-white/55 leading-snug mt-1">{f.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 pb-4 pt-4 shrink-0 relative z-10">
        <div className="rounded-xl bg-white/[0.04] border border-white/10 p-3 flex items-center justify-between backdrop-blur-sm">
          <div className="flex items-center gap-2 min-w-0">
            <div
              className="h-7 w-7 rounded-lg flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${product.accentColor}20` }}
            >
              <Globe className="h-3.5 w-3.5" style={{ color: product.accentColor }} />
            </div>
            <div className="min-w-0">
              <p className="text-[8px] uppercase tracking-widest text-white/40">Visita</p>
              <p className="text-[12px] font-bold text-white truncate">{product.url}</p>
            </div>
          </div>
          <ArrowUpRight className="h-4 w-4 text-white/40 shrink-0" />
        </div>

        {/* Brand line */}
        <div className="mt-2.5 flex items-center justify-between text-[9px] text-white/40">
          <div className="flex items-center gap-1.5">
            <div className="relative h-4 w-4 rounded-sm overflow-hidden bg-white flex items-center justify-center shrink-0">
              <Image
                src="/4bid-borghi-logo.jpeg"
                alt="4BID"
                width={16}
                height={16}
                className="object-contain w-3.5 h-3.5"
              />
            </div>
            <span className="font-semibold uppercase tracking-widest">4BID SRL</span>
          </div>
          <span className="font-mono">www.4bid.it</span>
        </div>
      </div>
    </div>
  )
}

function CoverPage() {
  return (
    <div className="volantino-page bg-[#0a0a0f] text-white flex flex-col relative overflow-hidden">
      {/* Mesh gradient background */}
      <div
        className="absolute inset-0 opacity-70"
        style={{
          background:
            "radial-gradient(at 20% 0%, #14b8a6 0%, transparent 50%), radial-gradient(at 80% 0%, #3b82f6 0%, transparent 50%), radial-gradient(at 0% 50%, #f97316 0%, transparent 40%), radial-gradient(at 80% 50%, #8b5cf6 0%, transparent 40%), radial-gradient(at 40% 100%, #10b981 0%, transparent 50%)",
          filter: "blur(60px)",
        }}
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-[#0a0a0f]/60" aria-hidden="true" />

      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
        aria-hidden="true"
      />

      {/* Top corner: brand chip */}
      <div className="px-7 pt-7 shrink-0 relative z-10 flex items-center justify-between">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-md">
          <div className="relative h-5 w-5 rounded-full overflow-hidden bg-white flex items-center justify-center">
            <Image
              src="/4bid-borghi-logo.jpeg"
              alt="4BID"
              width={20}
              height={20}
              className="object-contain w-4 h-4"
            />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest">4BID SRL</span>
        </div>
        <div className="text-[9px] font-mono text-white/40 uppercase tracking-widest">v2.0 / 2026</div>
      </div>

      {/* Main hero */}
      <div className="px-7 flex-1 flex flex-col justify-center relative z-10">
        {/* Eyebrow */}
        <div className="inline-flex items-center gap-2 mb-4 self-start">
          <Sparkles className="h-3 w-3 text-[#F4B942]" />
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#F4B942]">
            L&apos;ecosistema 4BID
          </p>
        </div>

        {/* Title */}
        <h1 className="text-[2.6rem] font-black leading-[0.95] tracking-tight text-balance">
          Cinque prodotti.
          <br />
          <span className="bg-gradient-to-r from-teal-300 via-blue-300 to-violet-300 bg-clip-text text-transparent">
            Un solo ecosistema.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mt-5 text-[13px] leading-relaxed text-white/70 max-w-[92%]">
          Software, AI e infrastrutture per il futuro del turismo: revenue management, controllo di gestione,
          manutenzioni, marketing alberghiero e mobilita&apos; elettrica.
        </p>

        {/* Big stats / product chips */}
        <div className="mt-7 grid grid-cols-5 gap-1.5">
          {products.map((p) => {
            const Icon = p.productIcon
            return (
              <div
                key={p.id}
                className="rounded-lg bg-white/[0.06] border border-white/10 p-2 flex flex-col items-center justify-center gap-1 backdrop-blur-md"
              >
                <div
                  className="h-7 w-7 rounded-md flex items-center justify-center"
                  style={{ backgroundColor: `${p.accentColor}30` }}
                >
                  <Icon className="h-3.5 w-3.5" style={{ color: p.accentColor }} strokeWidth={2.5} />
                </div>
                <p className="text-[8px] font-bold text-white/80 text-center leading-tight">
                  {p.name.replace("4BID ", "").split(" ")[0]}
                </p>
              </div>
            )
          })}
        </div>

        {/* Status legend */}
        <div className="mt-5 flex items-center gap-4 text-[9px]">
          <div className="flex items-center gap-1.5">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <span className="text-white/60 font-medium">3 Online</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Circle className="h-2 w-2 text-[#F4B942]" />
            <span className="text-white/60 font-medium">2 In sviluppo</span>
          </div>
        </div>
      </div>

      {/* Bottom: CTA */}
      <div className="px-7 pb-7 pt-5 shrink-0 relative z-10">
        <div className="rounded-2xl bg-white/[0.06] border border-white/10 backdrop-blur-md p-4 flex items-center justify-between">
          <div>
            <p className="text-[9px] uppercase tracking-widest text-white/40">Scopri tutto su</p>
            <p className="text-lg font-black tracking-tight mt-0.5">
              <span className="bg-gradient-to-r from-teal-300 to-blue-300 bg-clip-text text-transparent">
                www.4bid.it
              </span>
            </p>
          </div>
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-teal-400 to-blue-500 flex items-center justify-center shadow-lg">
            <ArrowUpRight className="h-5 w-5 text-white" strokeWidth={2.5} />
          </div>
        </div>
      </div>
    </div>
  )
}

function BackCover() {
  return (
    <div className="volantino-page bg-[#0a0a0f] text-white flex flex-col relative overflow-hidden">
      {/* Mesh gradient bottom */}
      <div
        className="absolute inset-0 opacity-60"
        style={{
          background:
            "radial-gradient(at 100% 100%, #14b8a6 0%, transparent 50%), radial-gradient(at 0% 100%, #8b5cf6 0%, transparent 50%), radial-gradient(at 50% 0%, #3b82f6 0%, transparent 40%)",
          filter: "blur(80px)",
        }}
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-[#0a0a0f]/70" aria-hidden="true" />

      {/* Top accent gradient bar */}
      <div
        className="h-1 w-full shrink-0 bg-gradient-to-r from-teal-500 via-blue-500 via-orange-500 via-violet-500 to-emerald-500"
        aria-hidden="true"
      />

      {/* Header */}
      <div className="px-7 pt-7 pb-4 shrink-0 relative z-10">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/10 border border-white/20 backdrop-blur-md mb-4">
          <Sparkles className="h-3 w-3 text-[#F4B942]" />
          <span className="text-[9px] font-bold uppercase tracking-widest text-[#F4B942]">Inizia oggi</span>
        </div>

        <h2 className="text-[2.1rem] font-black tracking-tight leading-[1.05] text-balance">
          Pronto a far crescere
          <br />
          <span className="bg-gradient-to-r from-teal-300 to-blue-300 bg-clip-text text-transparent">
            la tua struttura?
          </span>
        </h2>

        <p className="mt-3 text-[12.5px] leading-relaxed text-white/70 text-pretty">
          Una demo gratuita per scoprire i prodotti adatti al tuo business. Senza impegno, senza costi nascosti.
        </p>
      </div>

      {/* Steps */}
      <div className="px-7 pb-4 shrink-0 relative z-10">
        <div className="space-y-2.5">
          {[
            {
              n: "01",
              title: "Contattaci",
              text: "Email, telefono o dal sito www.4bid.it",
              color: "#14b8a6",
            },
            {
              n: "02",
              title: "Demo Personalizzata",
              text: "Ti mostriamo i prodotti adatti alla tua struttura",
              color: "#3b82f6",
            },
            {
              n: "03",
              title: "Start in Pochi Giorni",
              text: "Setup rapido e supporto dedicato dal primo giorno",
              color: "#8b5cf6",
            },
          ].map((s) => (
            <div
              key={s.n}
              className="rounded-xl bg-white/[0.04] border border-white/10 backdrop-blur-sm p-3 flex items-center gap-3"
            >
              <div
                className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0 font-mono font-black text-sm"
                style={{ backgroundColor: `${s.color}20`, color: s.color }}
              >
                {s.n}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-[13px] leading-tight">{s.title}</p>
                <p className="text-[10.5px] text-white/55 leading-snug mt-0.5">{s.text}</p>
              </div>
              <ArrowUpRight className="h-4 w-4 text-white/30 shrink-0" />
            </div>
          ))}
        </div>
      </div>

      {/* Spacer */}
      <div className="flex-1 min-h-0" />

      {/* Contact card with gradient border effect */}
      <div className="mx-7 mb-5 shrink-0 relative z-10">
        <div
          className="rounded-2xl p-[1px]"
          style={{
            background: "linear-gradient(135deg, #14b8a6 0%, #3b82f6 50%, #8b5cf6 100%)",
          }}
        >
          <div className="rounded-2xl bg-[#0a0a0f]/95 p-4 backdrop-blur-xl">
            <p className="text-[9px] font-bold uppercase tracking-widest text-[#F4B942] mb-3">Contatti</p>
            <div className="grid grid-cols-2 gap-2.5">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                  <Globe className="h-3.5 w-3.5 text-teal-300" />
                </div>
                <div className="min-w-0">
                  <p className="text-[8px] uppercase tracking-widest text-white/40">Sito</p>
                  <p className="text-[11px] font-bold truncate">www.4bid.it</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                  <Mail className="h-3.5 w-3.5 text-blue-300" />
                </div>
                <div className="min-w-0">
                  <p className="text-[8px] uppercase tracking-widest text-white/40">Email</p>
                  <p className="text-[11px] font-bold truncate">info@4bid.it</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer holding */}
      <div className="bg-black/40 backdrop-blur-md border-t border-white/10 px-7 py-3.5 shrink-0 relative z-10">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="relative h-9 w-9 rounded-full overflow-hidden bg-white shadow-md ring-2 ring-white/10 shrink-0 flex items-center justify-center">
              <Image
                src="/4bid-borghi-logo.jpeg"
                alt="4BID SRL"
                width={36}
                height={36}
                className="object-contain w-8 h-8"
              />
            </div>
            <div>
              <p className="text-[8px] uppercase tracking-widest text-white/40">Holding</p>
              <p className="text-sm font-black tracking-tight">4BID SRL</p>
            </div>
          </div>
          <p className="text-[8px] uppercase tracking-widest text-white/40 text-right leading-tight">
            5 prodotti
            <br />
            <span className="text-[#F4B942] normal-case tracking-normal">per il turismo del futuro</span>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function Volantino2Client() {
  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="min-h-screen bg-[#1a1a22]">
      {/* Print Toolbar - hidden on print */}
      <div className="no-print sticky top-0 z-50 bg-[#0a0a0f]/95 backdrop-blur-md border-b border-white/10 shadow-lg">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white">Volantino Suite 4BID</h1>
              <span className="px-2 py-0.5 rounded-md bg-gradient-to-r from-teal-500 to-blue-500 text-white text-[10px] font-black uppercase tracking-widest">
                v2 Tech
              </span>
            </div>
            <p className="text-sm text-white/50">
              Anteprima 7 facciate A5 - copertina, 5 prodotti, retro copertina
            </p>
          </div>
          <div className="flex items-center gap-3">
            <p className="hidden md:block text-xs text-white/50 max-w-xs text-right">
              Premi <span className="font-semibold text-white">Stampa PDF</span> e nel dialog del browser scegli{" "}
              <span className="font-semibold text-white">&quot;Salva come PDF&quot;</span> con formato A5.
            </p>
            <Button
              onClick={handlePrint}
              size="lg"
              className="bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600 text-white border-0 shadow-lg"
            >
              <Printer className="h-5 w-5 mr-2" />
              Stampa PDF
            </Button>
          </div>
        </div>
      </div>

      {/* Pages */}
      <div className="py-8 px-4 print:p-0 flex flex-col items-center gap-8 print:gap-0">
        <CoverPage />
        {products.map((product, i) => (
          <ProductPanel key={product.id} product={product} index={i} />
        ))}
        <BackCover />
      </div>
    </div>
  )
}
