import { Header } from "@/components/header"
import Hero from "@/components/hero"
import Services from "@/components/services"
import Portfolio from "@/components/portfolio"
import ProjectsSection from "@/components/projects-section"
import AppsSection from "@/components/apps-section"
import About from "@/components/about"
import Contact from "@/components/contact"
import { Footer } from "@/components/footer"
import Script from "next/script"
import { LandingPageTracker } from "@/components/landing-page-tracker"

export default function Home() {
  return (
    <div className="min-h-screen">
      <LandingPageTracker slug="home" />

      <Script async src="https://www.googletagmanager.com/gtag/js?id=G-S6YEEXE4C3" strategy="afterInteractive" />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-S6YEEXE4C3');
        `}
      </Script>

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
