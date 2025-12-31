import type { MetadataRoute } from "next"

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://www.4bid.it"
  const lastModified = new Date()

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
  const progetti = ["santaddeo", "manubot", "risparmio-compulsivo", "autoexel", "hotel-accelerator"].map((slug) => ({
    url: `${baseUrl}/progetti/${slug}`,
    lastModified,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }))

  // Altre pagine
  const otherPages = [
    {
      url: `${baseUrl}/proponi-idea`,
      lastModified,
      changeFrequency: "monthly" as const,
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

  return [homepage, ...guidePages, ...landingPages, ...progetti, ...otherPages]
}
