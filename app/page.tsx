import type { Metadata } from "next"
import { Header } from "@/components/header"
import Hero from "@/components/hero"
import Services from "@/components/services"
import Portfolio from "@/components/portfolio"
import ProjectsSection from "@/components/projects-section"
import AppsSection from "@/components/apps-section"
import About from "@/components/about"
import Contact from "@/components/contact"
import { Footer } from "@/components/footer"
import { LandingPageTracker } from "@/components/landing-page-tracker"
import { StructuredData } from "@/components/seo-structured-data"

export const metadata: Metadata = {
  title: "4BID.IT - Innovazione e Tecnologia per il Tuo Business | Revenue Management & Software",
  description:
    "4BID offre consulenza specializzata revenue management hotel, software innovativi e soluzioni tecnologiche per ottimizzare ricavi e performance aziendali. Scopri i nostri progetti e servizi.",
  keywords:
    "4bid, innovazione, tecnologia business, revenue management hotel, software gestionale, consulenza aziendale, ottimizzazione ricavi, progetti innovativi",
  openGraph: {
    title: "4BID.IT - Innovazione e Tecnologia per il Tuo Business",
    description: "Consulenza revenue management, software e soluzioni tecnologiche innovative per hotel e aziende",
    type: "website",
    url: "https://4bid.it",
    locale: "it_IT",
    siteName: "4BID.IT",
    images: [
      {
        url: "https://4bid.it/4bid-colorful-logo.jpg",
        width: 1200,
        height: 630,
        alt: "4BID.IT - Innovazione e Tecnologia",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "4BID.IT - Innovazione e Tecnologia per il Tuo Business",
    description: "Consulenza revenue management, software e soluzioni tecnologiche innovative",
    images: ["https://4bid.it/4bid-colorful-logo.jpg"],
  },
  alternates: {
    canonical: "https://4bid.it",
  },
}

export default function Home() {
  return (
    <div className="min-h-screen">
      <StructuredData
        type="Organization"
        title="4BID.IT - Innovazione e Tecnologia"
        description="4BID offre consulenza revenue management, software innovativi e soluzioni tecnologiche per hotel e aziende"
        url="https://4bid.it"
      />

      <LandingPageTracker slug="home" />

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
