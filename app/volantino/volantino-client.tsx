"use client"

import Image from "next/image"
import { Printer, TrendingUp, Bot, Calculator, Hotel, CheckCircle2, Globe, Mail, Phone } from "lucide-react"
import { Button } from "@/components/ui/button"
import "./print.css"

type Product = {
  id: string
  name: string
  tagline: string
  description: string
  logo: string
  url: string
  features: { icon: typeof CheckCircle2; title: string; text: string }[]
  accent: string // tailwind color class for accents
  bgGradient: string // gradient for header strip
  iconBg: string // bg color for product icon badge
  productIcon: typeof TrendingUp
}

const products: Product[] = [
  {
    id: "santaddeo",
    name: "SANTADDEO",
    tagline: "The Human Revenue Manager",
    description:
      "Il primo Revenue Management System Intelligente e Umano. Spiega ogni decisione e si adatta alla tua struttura, ovunque nel mondo.",
    logo: "/santaddeo-logo.png",
    url: "santaddeo.com",
    productIcon: TrendingUp,
    accent: "text-teal-600",
    bgGradient: "from-teal-500 to-cyan-600",
    iconBg: "bg-teal-50",
    features: [
      {
        icon: CheckCircle2,
        title: "100% Trasparente",
        text: "Ogni prezzo proposto e' spiegato in linguaggio semplice. Sai sempre il perche' di ogni scelta.",
      },
      {
        icon: CheckCircle2,
        title: "AI che si Adatta",
        text: "L'algoritmo impara dalla tua struttura e dal mercato locale, non applica logiche standardizzate.",
      },
      {
        icon: CheckCircle2,
        title: "Push Automatico al PMS",
        text: "Connesso ai principali PMS: i prezzi vengono aggiornati senza alcun intervento manuale.",
      },
      {
        icon: CheckCircle2,
        title: "Guard Anti-Errore",
        text: "Sistema di controllo che blocca tariffe anomale e segnala incongruenze prima della pubblicazione.",
      },
    ],
  },
  {
    id: "hotelprofit-ai",
    name: "HOTELPROFIT AI",
    tagline: "Controllo di Gestione Intelligente",
    description:
      "Massimizza i profitti del tuo hotel con un team di commercialisti specializzati supportati dall'AI. Analisi, forecasting e consigli su misura.",
    logo: "/hotelprofit-ai-logo.png",
    url: "hotelprofitai.com",
    productIcon: Calculator,
    accent: "text-blue-600",
    bgGradient: "from-blue-600 to-emerald-500",
    iconBg: "bg-blue-50",
    features: [
      {
        icon: CheckCircle2,
        title: "Analisi Real-Time",
        text: "Costi, ricavi e marginalita' aggiornati in tempo reale, sempre sotto controllo.",
      },
      {
        icon: CheckCircle2,
        title: "Forecasting con AI",
        text: "Previsioni su ricavi e cash-flow basate su dati storici e mercato, non su semplici medie.",
      },
      {
        icon: CheckCircle2,
        title: "Team di Esperti",
        text: "Commercialisti specializzati nel settore hospitality, sempre disponibili per consulenza.",
      },
      {
        icon: CheckCircle2,
        title: "Consigli Personalizzati",
        text: "Suggerimenti operativi specifici per la tua struttura, basati sui tuoi numeri reali.",
      },
    ],
  },
  {
    id: "manubot",
    name: "MANUBOT",
    tagline: "The Smart Maintenance Assistant",
    description:
      "Il sistema universale di gestione e automazione delle manutenzioni che parla la lingua di tutti: WhatsApp e Telegram.",
    logo: "/manubot-logo.jpg",
    url: "manubot.it",
    productIcon: Bot,
    accent: "text-orange-600",
    bgGradient: "from-orange-500 to-amber-600",
    iconBg: "bg-orange-50",
    features: [
      {
        icon: CheckCircle2,
        title: "WhatsApp & Telegram",
        text: "Apri ticket di manutenzione con un messaggio. Nessuna app da installare per il tuo team.",
      },
      {
        icon: CheckCircle2,
        title: "Automatico End-to-End",
        text: "Smista, assegna e tiene traccia di ogni richiesta. I tecnici ricevono notifiche istantanee.",
      },
      {
        icon: CheckCircle2,
        title: "Universale",
        text: "Adatto a hotel, residence, aziende, condomini. Si integra con qualunque flusso di lavoro.",
      },
      {
        icon: CheckCircle2,
        title: "Storico e Reportistica",
        text: "Ogni intervento e' tracciato. Report periodici per monitorare costi e tempi di intervento.",
      },
    ],
  },
  {
    id: "hotel-accelerator",
    name: "HOTEL ACCELERATOR",
    tagline: "Il Software Gestionale Completo per Hotel",
    description:
      "CMS, CRM, Email Marketing, Inbox Omnicanale e AI in un'unica soluzione. Aumenta le prenotazioni dirette fino al 35% e riduci le commissioni OTA.",
    logo: "/hotel-accelerator-logo.jpg",
    url: "hotelaccelerator.com",
    productIcon: Hotel,
    accent: "text-indigo-600",
    bgGradient: "from-blue-500 to-indigo-600",
    iconBg: "bg-indigo-50",
    features: [
      {
        icon: CheckCircle2,
        title: "+35% Prenotazioni Dirette",
        text: "Strumenti di marketing automation che spostano le prenotazioni dalle OTA al sito ufficiale.",
      },
      {
        icon: CheckCircle2,
        title: "Inbox Omnicanale",
        text: "Email, chat, WhatsApp e social in un'unica casella. Il team risponde sempre dallo stesso posto.",
      },
      {
        icon: CheckCircle2,
        title: "CRM e Email Marketing",
        text: "Segmentazione automatica degli ospiti e campagne mirate per fidelizzare e far ritornare.",
      },
      {
        icon: CheckCircle2,
        title: "AI Integrata",
        text: "Risponde alle richieste piu' frequenti, suggerisce upsell e personalizza l'esperienza.",
      },
    ],
  },
]

function ProductPanel({ product }: { product: Product }) {
  const ProductIcon = product.productIcon
  return (
    <div className="volantino-page bg-white text-gray-900 flex flex-col">
      {/* Header Strip */}
      <div className={`bg-gradient-to-r ${product.bgGradient} h-3 w-full shrink-0`} aria-hidden="true" />

      {/* Logo + Product Icon */}
      <div className="px-8 pt-8 pb-4 flex items-center justify-between gap-4 shrink-0">
        <div className="relative h-16 w-44">
          <Image
            src={product.logo || "/placeholder.svg"}
            alt={`${product.name} logo`}
            fill
            className="object-contain object-left"
            sizes="180px"
            priority
          />
        </div>
        <div className={`${product.iconBg} ${product.accent} h-14 w-14 rounded-2xl flex items-center justify-center`}>
          <ProductIcon className="h-7 w-7" strokeWidth={2} />
        </div>
      </div>

      {/* Title + Tagline */}
      <div className="px-8 pb-4 shrink-0">
        <h2 className="text-3xl font-bold tracking-tight text-balance leading-tight">{product.name}</h2>
        <p className={`mt-1 text-sm font-semibold uppercase tracking-wider ${product.accent}`}>{product.tagline}</p>
      </div>

      {/* Description */}
      <div className="px-8 pb-5 shrink-0">
        <p className="text-base leading-relaxed text-gray-700 text-pretty">{product.description}</p>
      </div>

      {/* Divider */}
      <div className="mx-8 border-t border-gray-200 shrink-0" />

      {/* Features */}
      <div className="px-8 py-5 flex-1">
        <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Cosa lo rende unico</p>
        <ul className="space-y-4">
          {product.features.map((f) => {
            const Icon = f.icon
            return (
              <li key={f.title} className="flex gap-3">
                <Icon className={`h-5 w-5 mt-0.5 shrink-0 ${product.accent}`} strokeWidth={2.4} />
                <div>
                  <p className="font-semibold text-sm text-gray-900 leading-snug">{f.title}</p>
                  <p className="text-sm text-gray-600 leading-relaxed mt-0.5">{f.text}</p>
                </div>
              </li>
            )
          })}
        </ul>
      </div>

      {/* Footer with URL + 4BID Branding */}
      <div className="bg-gray-900 text-white px-8 py-4 shrink-0">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-[#F4B942]" />
            <span className="font-semibold text-sm">{product.url}</span>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-widest text-gray-400">Un prodotto</p>
            <p className="text-base font-bold leading-none">
              4<span className="text-[#F4B942]">BID</span>
              <span className="text-xs font-normal text-gray-300 ml-1">SRL</span>
            </p>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-gray-700 flex items-center justify-between text-[10px] text-gray-400">
          <div className="flex items-center gap-1.5">
            <Mail className="h-3 w-3" />
            <span>info@4bid.it</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Phone className="h-3 w-3" />
            <span>www.4bid.it</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function VolantinoClient() {
  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Print Toolbar - hidden on print */}
      <div className="print:hidden sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Volantino Prodotti 4BID</h1>
            <p className="text-sm text-gray-500">Anteprima 4 facciate A5 - una per prodotto</p>
          </div>
          <div className="flex items-center gap-3">
            <p className="hidden md:block text-xs text-gray-500 max-w-xs text-right">
              Premi <span className="font-semibold">Stampa PDF</span> e nel dialog del browser scegli{" "}
              <span className="font-semibold">"Salva come PDF"</span> con formato A5.
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
        {products.map((product) => (
          <ProductPanel key={product.id} product={product} />
        ))}
      </div>
    </div>
  )
}
