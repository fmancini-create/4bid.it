import Link from "next/link"
import { CalendarCheck, Clock, Video, CheckCircle2, Phone } from "lucide-react"
import { Button } from "@/components/ui/button"
import Header from "@/components/header"
import Footer from "@/components/footer"
import { LandingPageTracker } from "@/components/landing-page-tracker"
import { StructuredData } from "@/components/seo-structured-data"
import { DemoCalendar } from "@/components/demo-calendar"

export const metadata = {
  title: "Prenota una Demo Gratuita | Revenue Management Hotel | 4BID.IT",
  description:
    "Prenota una demo gratuita e senza impegno. Scegli direttamente data e ora dal nostro calendario e scopri come aumentare i ricavi della tua struttura con SANTADDEO e i servizi 4BID.IT.",
  keywords:
    "prenota demo hotel, demo revenue management, demo gratuita santaddeo, appuntamento revenue manager, calendario prenotazione demo",
  openGraph: {
    title: "Prenota una Demo Gratuita | Revenue Management Hotel | 4BID.IT",
    description:
      "Scegli data e ora dal nostro calendario e prenota una demo gratuita per scoprire come aumentare i ricavi della tua struttura.",
    url: "https://www.4bid.it/prenota-demo",
    type: "website",
  },
  alternates: {
    canonical: "https://www.4bid.it/prenota-demo",
  },
}

const faqData = [
  {
    question: "Quanto dura la demo?",
    answer:
      "La demo dura circa 30 minuti. Ti mostriamo come funziona il nostro sistema di revenue management e rispondiamo a tutte le tue domande sulla tua struttura.",
  },
  {
    question: "La demo è gratuita?",
    answer:
      "Sì, la demo è completamente gratuita e senza alcun impegno. È un'occasione per conoscerci e valutare insieme le opportunità concrete per il tuo hotel.",
  },
  {
    question: "Come si svolge la demo?",
    answer:
      "La demo si svolge in video call. Dopo aver scelto data e ora dal calendario riceverai una email di conferma con il link per collegarti.",
  },
]

export default function PrenotaDemoPage() {
  return (
    <div className="min-h-screen bg-background">
      <StructuredData
        type="Service"
        title="Prenota una Demo Gratuita"
        description="Prenota una demo gratuita per scoprire i servizi di revenue management 4BID.IT"
        faqs={faqData}
      />
      <LandingPageTracker slug="prenota-demo" />

      <Header />

      {/* Hero Section */}
      <section className="pt-32 pb-12 bg-gradient-to-br from-primary-blue/10 via-blue-grey/5 to-background">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl font-bold text-foreground mb-6 text-balance">Prenota una Demo Gratuita</h1>
            <p className="text-xl text-muted-foreground leading-relaxed mb-8 text-pretty">
              Scegli direttamente la data e l&apos;ora che preferisci dal nostro calendario. Ti mostreremo come aumentare i
              ricavi della tua struttura, senza alcun impegno.
            </p>
            <div className="grid sm:grid-cols-3 gap-6 max-w-2xl mx-auto">
              <div className="flex flex-col items-center gap-2">
                <Clock className="h-8 w-8 text-primary-blue" />
                <span className="text-sm font-medium text-foreground">30 minuti</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Video className="h-8 w-8 text-primary-blue" />
                <span className="text-sm font-medium text-foreground">In video call</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <CheckCircle2 className="h-8 w-8 text-primary-blue" />
                <span className="text-sm font-medium text-foreground">Gratuita e senza impegno</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Calendar Embed */}
      <section className="py-16">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-center gap-3 mb-8">
              <CalendarCheck className="h-8 w-8 text-primary-blue" />
              <h2 className="text-3xl font-bold text-foreground text-center">Scegli il tuo appuntamento</h2>
            </div>
            <DemoCalendar />
            <p className="text-center text-sm text-muted-foreground mt-6">
              Non trovi uno slot adatto?{" "}
              <Link href="/#contact" className="text-primary-blue font-medium hover:underline">
                Contattaci
              </Link>{" "}
              e troveremo insieme il momento migliore.
            </p>
          </div>
        </div>
      </section>

      {/* What to expect */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center text-foreground mb-12">Cosa Vedrai Durante la Demo</h2>
          <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {[
              "Analisi rapida del posizionamento attuale della tua struttura",
              "Come funziona il dynamic pricing con SANTADDEO RMS",
              "Strategie per aumentare le prenotazioni dirette e ridurre le commissioni OTA",
              "Dashboard KPI e reporting personalizzato",
              "Opportunità concrete di crescita per il tuo hotel",
              "Risposte a tutte le tue domande, senza impegno",
            ].map((item, index) => (
              <div key={index} className="flex items-start gap-3">
                <CheckCircle2 className="h-6 w-6 text-primary-blue flex-shrink-0 mt-0.5" />
                <span className="text-muted-foreground">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Alternative contact */}
      <section className="py-20">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold text-foreground mb-6">Preferisci parlare subito?</h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Se vuoi anticipare qualche domanda o non riesci a trovare uno slot adatto, puoi chiamarci direttamente.
          </p>
          <Link href="tel:+390558334567">
            <Button size="lg" className="bg-primary-blue hover:bg-primary-blue/90">
              <Phone className="mr-2 h-5 w-5" />
              Chiamaci Ora
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  )
}
