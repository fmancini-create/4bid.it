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
  title: "Revenue Management per Hotel, B&B e Strutture Ricettive | 4BID",
  description:
    "Consulenza e software di revenue management per hotel, B&B e agriturismi: aumenta i ricavi, ottimizza prezzi e prenotazioni dirette. La suite 4BID: Santaddeo, HotelProfit AI, Manubot, Hotel Accelerator e Ecomobility.",
  keywords:
    "revenue management hotel, software revenue management, aumentare ricavi hotel, dynamic pricing hotel, consulenza revenue management, prenotazioni dirette hotel, software gestionale hotel, santaddeo, 4bid",
  openGraph: {
    title: "Revenue Management per Hotel, B&B e Strutture Ricettive | 4BID",
    description:
      "Consulenza e software di revenue management per hotel, B&B e agriturismi: aumenta i ricavi e ottimizza prezzi e prenotazioni dirette. La suite 4BID per il mondo HORECA.",
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
    title: "Revenue Management per Hotel e Strutture Ricettive | 4BID",
    description: "Aumenta i ricavi del tuo hotel con consulenza e software di revenue management. La suite 4BID per il mondo HORECA.",
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
