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
  title: "4BID.IT - Holding di software e tool per il settore turismo | Suite HORECA",
  description:
    "4BID SRL è la holding italiana che sviluppa una suite completa di software, app e piattaforme per hotel, ristoranti e strutture ricettive: Santaddeo (revenue management), HotelProfit AI (controllo di gestione), Manubot, Hotel Accelerator e 4BID Ecomobility.",
  keywords:
    "4bid, 4bid srl, holding software turismo, suite horeca, santaddeo, hotelprofit ai, manubot, hotel accelerator, ecomobility, revenue management hotel, software gestionale hotel, controllo di gestione hotel, mobilità elettrica hotel",
  openGraph: {
    title: "4BID.IT - Holding di software e tool per il settore turismo",
    description:
      "L'ecosistema 4BID: una suite completa di software per il mondo HORECA — Santaddeo, HotelProfit AI, Manubot, Hotel Accelerator e 4BID Ecomobility — più progetti verticali in altri settori.",
    type: "website",
    url: "https://www.4bid.it",
    locale: "it_IT",
    siteName: "4BID.IT",
    images: [
      {
        url: "https://www.4bid.it/og-image-4bid.jpg",
        width: 1200,
        height: 630,
        alt: "4BID SRL - Holding di software e tool per il turismo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "4BID.IT - Holding di software per il turismo",
    description: "Suite HORECA: Santaddeo, HotelProfit AI, Manubot, Hotel Accelerator, 4BID Ecomobility",
    images: ["https://www.4bid.it/og-image-4bid.jpg"],
  },
  alternates: {
    canonical: "https://www.4bid.it",
  },
}

export default function Home() {
  return (
    <div className="min-h-screen">
      <StructuredData
        type="Organization"
        title="4BID.IT - Innovazione e Tecnologia"
        description="4BID offre consulenza revenue management, software innovativi e soluzioni tecnologiche per hotel e aziende"
        url="https://www.4bid.it"
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
