import type { MetadataRoute } from "next"
import { getAllPosts } from "@/lib/blog/posts"
import { getAllCategories, getPublishedGuides, GLOSSARY } from "@/lib/knowledge-base"

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://www.4bid.it"
  const lastModified = new Date()

  // Blog: indice + articoli
  const blogIndex = {
    url: `${baseUrl}/blog`,
    lastModified,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }
  const blogPosts = getAllPosts().map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: new Date(post.dateModified),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }))

  // Homepage
  const homepage = {
    url: baseUrl,
    lastModified,
    changeFrequency: "daily" as const,
    priority: 1.0,
  }

  const guidePages = ["guida-revenue-management-hotel", "guida-pricing-hotel", "guida-prenotazioni-dirette-hotel"].map(
    (slug) => ({
      url: `${baseUrl}/${slug}`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.9,
    }),
  )

  // Landing Pages Revenue Management - tutte le pagine pubbliche
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
    "strategie-prenotazioni-dirette-hotel",
    "strategie-vendita-diretta-hotel",
    "formazione-revenue-management-hotel",
    "revenue-management-resort-lusso",
    "kpi-metriche-hotel",
    "forecast-budgeting-hotel",
    "ottimizzazione-adr-hotel",
    "software-revenue-management-hotel",
    "revenue-management-boutique-hotel",
    "ottimizzazione-ota-hotel",
    "revenue-management-catene-hotel",
    "adr-hotel-come-aumentarlo",
    "preventivi-progetti-personalizzati-hotel",
    "prenotazioni-dirette-hotel",
    "consulenza-personalizzata-hotel",
    "kpi-hotel-revenue-management",
    "strategie-pricing-hotel",
    "revenue-manager-hotel-toscana",
    "webmarketing-hotel-prenotazioni",
    "come-aumentare-ricavi-hotel",
    "ottimizzazione-revpar-hotel",
    "cose-il-revenue-management",
  ].map((slug) => ({
    url: `${baseUrl}/${slug}`,
    lastModified,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }))

  // Progetti
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
    lastModified,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }))

  // Ecomobility (linea prodotto a sé)
  const ecomobility = [
    "ecomobility/come-funziona",
    "ecomobility/piattaforma-ecomobility",
    "ecomobility/noleggio-mobilita-elettrica-hotel",
    "ecomobility/registra-struttura",
  ].map((slug) => ({
    url: `${baseUrl}/${slug}`,
    lastModified,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }))

  // Hub soluzioni (pagina pilastro) + eventi
  const hubAndEvents = [
    {
      url: `${baseUrl}/soluzioni-revenue-management`,
      lastModified,
      changeFrequency: "weekly" as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/eventi/santaddeo-launch`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    },
  ]

  // Pagine istituzionali / EEAT (autorevolezza)
  const eeatPages = ["chi-siamo", "metodo-4bid", "filippo-mancini"].map((slug) => ({
    url: `${baseUrl}/${slug}`,
    lastModified,
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }))

  // Knowledge Base: hub + categorie + guide pubblicate
  const kbHub = {
    url: `${baseUrl}/knowledge-base`,
    lastModified,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }
  const kbCategories = getAllCategories().map((c) => ({
    url: `${baseUrl}/knowledge-base/${c.slug}`,
    lastModified,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }))
  const kbGuides = getPublishedGuides().map((g) => ({
    url: `${baseUrl}/knowledge-base/${g.categorySlug}/${g.slug}`,
    lastModified,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }))

  // Glossario: hub + singoli termini
  const glossaryHub = {
    url: `${baseUrl}/glossario`,
    lastModified,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }
  const glossaryTerms = GLOSSARY.map((t) => ({
    url: `${baseUrl}/glossario/${t.slug}`,
    lastModified,
    changeFrequency: "monthly" as const,
    priority: 0.5,
  }))

  // Altre pagine
  const otherPages = [
    {
      url: `${baseUrl}/prenota-demo`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    },
    // I /volantino* NON stanno in sitemap: sono materiale commerciale che si
    // manda per email o si stampa, nessuno li cerca su Google. Erano dichiarati
    // con priorita' 0.7, piu' alta di /prenota-demo (0.6), e non sono
    // raggiungibili navigando il sito: dichiarare a Google pagine di servizio
    // sparge su di esse la scansione che serve alle pagine vere.
    // Restano online e funzionanti: chi ha il collegamento li apre come prima.
    {
      url: `${baseUrl}/proponi-idea`,
      lastModified,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/parlano-di-noi`,
      lastModified,
      changeFrequency: "daily" as const,
      priority: 0.6,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified,
      changeFrequency: "yearly" as const,
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified,
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
