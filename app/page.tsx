import { Header } from "@/components/header"
import Hero from "@/components/hero"
import Services from "@/components/services"
import Portfolio from "@/components/portfolio"
import ProjectsSection from "@/components/projects-section"
import AppsSection from "@/components/apps-section"
import About from "@/components/about"
import Contact from "@/components/contact"
import { Footer } from "@/components/footer"
import { getOrganizationSchema, getWebSiteSchema } from "@/lib/schema-markup"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "4BID.IT - Software House & Revenue Management Hotel Italia",
  description:
    "Sviluppo software custom e consulenza Revenue Management per hotel in Toscana. Ottimizziamo ADR, RevPAR e occupazione con strategie data-driven. Preventivi gratuiti in 24h.",
  keywords: [
    "software house italia",
    "revenue management hotel",
    "consulenza alberghiera",
    "sviluppo app custom",
    "ottimizzazione prezzi hotel",
    "consulenza hotel toscana",
    "dynamic pricing",
    "yield management",
  ],
  openGraph: {
    title: "4BID.IT - Innovazione Digitale e Revenue Management Hotel",
    description:
      "Software house specializzata in soluzioni custom e consulenza revenue management per l'hospitality. Progetti innovativi, strategie vincenti.",
    type: "website",
    url: "https://4bid.it",
    siteName: "4BID.IT",
    locale: "it_IT",
  },
  alternates: {
    canonical: "https://4bid.it",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
}

export default function Home() {
  const organizationSchema = getOrganizationSchema()
  const websiteSchema = getWebSiteSchema()

  return (
    <div className="min-h-screen">
      {/* Schema Markup */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }} />

      <Header />
      <Hero />
      <Services />
      <Portfolio />
      <ProjectsSection />
      <AppsSection />
      <About />
      <Contact />
      <Footer />
    </div>
  )
}
