import type { MetadataRoute } from "next"
import { getAllPosts } from "@/lib/blog/posts"
import { getAllCategories, getPublishedGuides, GLOSSARY } from "@/lib/knowledge-base"

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://www.4bid.it"

  // `lastModified` viene dichiarato solo quando esiste una data reale e
  // verificabile. Usare `new Date()` per pagine statiche farebbe apparire ogni
  // URL come modificato a ogni build/richiesta, producendo un falso segnale di
  // freschezza. Per le pagine senza una data editoriale affidabile e' meglio
  // omettere il campo.

  // Blog: indice + articoli. I singoli articoli hanno una data reale.
  const blogIndex = {
    url: `${baseUrl}/blog`,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }
  const blogPosts = getAllPosts().map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: new Date(post.dateModified),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }))

  const homepage = {
    url: baseUrl,
    changeFrequency: "daily" as const,
    priority: 1.0,
  }

  const guidePages = ["guida-revenue-management-hotel", "guida-pricing-hotel", "guida-prenotazioni-dirette-hotel"].map(
    (slug) => ({
      url: `${baseUrl}/${slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.9,
    }),
  )

  // Solo URL canonici: le varianti consolidate via 301 non devono comparire
  // nella sitemap, altrimenti invieremmo a Google segnali contraddittori.
  const landingPages = [
    "consulenza-revenue-management-hotel",
    "software-revenue-management-santaddeo",
    "ottimizzazione-prezzi-hotel-toscana",
    "revenue-management-bed-breakfast",
    "revenue-management-agriturismo",
    "dynamic-pricing-hotel",
    "gestione-canali-distribuzione-hotel",
    "yield-management-hotel",
    "analisi-competitiva-hotel-firenze",
    "formazione-revenue-management-hotel",
    "revenue-management-resort-lusso",
    "kpi-metriche-hotel",
    "forecast-budgeting-hotel",
    "ottimizzazione-adr-hotel",
    "software-revenue-management-hotel",
    "revenue-management-boutique-hotel",
    "ottimizzazione-ota-hotel",
    "revenue-management-catene-hotel",
    "preventivi-progetti-personalizzati-hotel",
    "prenotazioni-dirette-hotel",
    "consulenza-personalizzata-hotel",
    "strategie-pricing-hotel",
    "revenue-manager-hotel-toscana",
    "webmarketing-hotel-prenotazioni",
    "come-aumentare-ricavi-hotel",
    "ottimizzazione-revpar-hotel",
    "cose-il-revenue-management",
    "problemi-hotel-soluzioni",
  ].map((slug) => ({
    url: `${baseUrl}/${slug}`,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }))

  const progetti = [
    "santaddeo",
    "manubot",
    "risparmio-compulsivo",
    "autoexel",
    "hotel-accelerator",
    "hotelprofit-ai",
    "mypetsenseai",
  ].map((slug) => ({
    url: `${baseUrl}/progetti/${slug}`,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }))

  const ecomobility = [
    "ecomobility/come-funziona",
    "ecomobility/piattaforma-ecomobility",
    "ecomobility/noleggio-mobilita-elettrica-hotel",
    "ecomobility/registra-struttura",
  ].map((slug) => ({
    url: `${baseUrl}/${slug}`,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }))

  const hubAndEvents = [
    {
      url: `${baseUrl}/soluzioni-revenue-management`,
      changeFrequency: "weekly" as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/eventi/santaddeo-launch`,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    },
  ]

  const eeatPages = ["chi-siamo", "metodo-4bid", "filippo-mancini"].map((slug) => ({
    url: `${baseUrl}/${slug}`,
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }))

  const kbHub = {
    url: `${baseUrl}/knowledge-base`,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }
  const kbCategories = getAllCategories().map((c) => ({
    url: `${baseUrl}/knowledge-base/${c.slug}`,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }))
  const kbGuides = getPublishedGuides().map((g) => ({
    url: `${baseUrl}/knowledge-base/${g.categorySlug}/${g.slug}`,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }))

  const glossaryHub = {
    url: `${baseUrl}/glossario`,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }
  const glossaryTerms = GLOSSARY.map((t) => ({
    url: `${baseUrl}/glossario/${t.slug}`,
    changeFrequency: "monthly" as const,
    priority: 0.5,
  }))

  const otherPages = [
    {
      url: `${baseUrl}/prenota-demo`,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    },
    {
      url: `${baseUrl}/lavora-con-noi`,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    },
    // I /volantino* NON stanno in sitemap: sono materiale commerciale che si
    // manda per email o si stampa e non sono pagine organiche da promuovere.
    {
      url: `${baseUrl}/proponi-idea`,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/parlano-di-noi`,
      changeFrequency: "daily" as const,
      priority: 0.6,
    },
    {
      url: `${baseUrl}/video-guide`,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/privacy`,
      changeFrequency: "yearly" as const,
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms`,
      changeFrequency: "yearly" as const,
      priority: 0.3,
    },
  ]

  return [
    homepage,
    blogIndex,
    ...blogPosts,
    ...guidePages,
    ...landingPages,
    ...progetti,
    ...ecomobility,
    ...hubAndEvents,
    ...eeatPages,
    kbHub,
    ...kbCategories,
    ...kbGuides,
    glossaryHub,
    ...glossaryTerms,
    ...otherPages,
  ]
}
