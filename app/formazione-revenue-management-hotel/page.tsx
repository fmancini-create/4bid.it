import Link from "next/link"
import { GraduationCap, Users, BookOpen, CheckCircle2, Award, Target, TrendingUp, Briefcase } from "lucide-react"
import { Button } from "@/components/ui/button"
import Header from "@/components/header"
import Footer from "@/components/footer"
import { LandingPageTracker } from "@/components/landing-page-tracker"

export const metadata = {
  title: "Formazione Revenue Management Hotel | Corsi e Training | 4BID.IT",
  description:
    "Corsi di formazione Revenue Management per hotel: dai fondamentali alle strategie avanzate. Training pratico per hotel manager, revenue manager e staff alberghiero.",
  keywords:
    "formazione revenue management, corsi hotel, training revenue, corso revenue manager, formazione alberghiera, workshop hotel",
}

export default function FormazioneRevenueManagementHotelPage() {
  return (
    <div className="min-h-screen bg-background">
      <LandingPageTracker slug="formazione-revenue-management-hotel" />

      <Header />

      {/* Hero Section */}
      <section className="pt-32 pb-16 bg-gradient-to-br from-primary-blue/10 via-blue-grey/5 to-background">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl font-bold text-foreground mb-6 text-balance">
              Formazione Revenue Management per Hotel
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed mb-8 text-pretty">
              Corsi pratici e training operativo per hotel manager, revenue manager e staff. Dai fondamentali alle
              strategie avanzate, con focus su applicazione reale e risultati misurabili.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link href="/#contact">
                <Button size="lg" className="bg-primary-blue hover:bg-primary-blue/90">
                  Richiedi Info sui Corsi
                </Button>
              </Link>
              <Link href="/progetti/santaddeo">
                <Button size="lg" variant="outline">
                  Scopri SANTADDEO RMS
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Perché Formarsi */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center text-foreground mb-12">Perché Investire in Formazione</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-card rounded-xl p-8 shadow-md border border-border">
              <TrendingUp className="h-12 w-12 text-primary-blue mb-4" />
              <h3 className="text-2xl font-bold text-card-foreground mb-3">+15-25%</h3>
              <p className="text-muted-foreground">
                Aumento medio RevPAR dopo training strutturato del team revenue management
              </p>
            </div>

            <div className="bg-card rounded-xl p-8 shadow-md border border-border">
              <Users className="h-12 w-12 text-primary-blue mb-4" />
              <h3 className="text-2xl font-bold text-card-foreground mb-3">Team Autonomo</h3>
              <p className="text-muted-foreground">
                Riduci la dipendenza da consulenti esterni formando competenze interne stabili
              </p>
            </div>

            <div className="bg-card rounded-xl p-8 shadow-md border border-border">
              <Award className="h-12 w-12 text-primary-blue mb-4" />
              <h3 className="text-2xl font-bold text-card-foreground mb-3">Best Practices</h3>
              <p className="text-muted-foreground">
                Metodologie validate e case study reali da applicare immediatamente nella tua struttura
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Programmi Formativi */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center text-foreground mb-12">I Nostri Programmi Formativi</h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {[
              {
                title: "Corso Base: Fondamentali Revenue Management",
                duration: "2 giorni (16 ore)",
                target: "Hotel manager, front office manager, staff amministrativo",
                topics: [
                  "Concetti base: occupancy, ADR, RevPAR",
                  "Dynamic pricing e strategia tariffaria",
                  "Gestione canali di distribuzione",
                  "Forecast e budgeting revenue",
                ],
              },
              {
                title: "Corso Avanzato: Revenue Strategy",
                duration: "3 giorni (24 ore)",
                target: "Revenue manager, general manager, proprietari",
                topics: [
                  "Yield management e capacity control",
                  "Competitive set analysis",
                  "Price positioning e displacement analysis",
                  "Strategie disintermediazione OTA",
                ],
              },
              {
                title: "Workshop Pratico: Implementazione Software",
                duration: "1 giorno (8 ore)",
                target: "Staff operativo che utilizzerà SANTADDEO RMS",
                topics: [
                  "Setup completo sistema revenue",
                  "Dashboard operative e KPI monitoring",
                  "Automation rules e alerting",
                  "Reporting e analytics avanzate",
                ],
              },
              {
                title: "Training On-Site Personalizzato",
                duration: "Personalizzabile",
                target: "Tutto il team alberghiero",
                topics: [
                  "Programma custom su esigenze specifiche",
                  "Training direttamente in hotel",
                  "Affiancamento operativo sul campo",
                  "Follow-up e mentoring post-corso",
                ],
              },
            ].map((corso, index) => (
              <div key={index} className="bg-card rounded-2xl p-8 border border-border shadow-md">
                <GraduationCap className="h-12 w-12 text-primary-blue mb-4" />
                <h3 className="text-2xl font-bold text-card-foreground mb-3">{corso.title}</h3>
                <div className="space-y-2 mb-4">
                  <p className="text-sm text-muted-foreground">
                    <strong>Durata:</strong> {corso.duration}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    <strong>Target:</strong> {corso.target}
                  </p>
                </div>
                <div className="space-y-2">
                  {corso.topics.map((topic, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary-blue mt-1 flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">{topic}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Metodologia */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center text-foreground mb-12">La Nostra Metodologia</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: BookOpen,
                title: "Teoria Essenziale",
                description: "Concetti chiave e framework metodologici senza troppa teoria accademica",
              },
              {
                icon: Briefcase,
                title: "Case Study Reali",
                description: "Esempi pratici da hotel veri con dati e risultati misurabili",
              },
              {
                icon: Target,
                title: "Esercitazioni Pratiche",
                description: "Workshop hands-on con simulazioni e scenari operativi realistici",
              },
              {
                icon: Users,
                title: "Q&A e Supporto",
                description: "Discussione problematiche specifiche e supporto post-corso via email",
              },
            ].map((metodo, index) => (
              <div
                key={index}
                className="bg-card rounded-xl p-6 shadow-md border border-border hover:shadow-lg transition-shadow"
              >
                <metodo.icon className="h-10 w-10 text-primary-blue mb-3" />
                <h3 className="text-lg font-bold text-card-foreground mb-2">{metodo.title}</h3>
                <p className="text-sm text-muted-foreground">{metodo.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonianze */}
      <section className="py-20 bg-gradient-to-br from-primary-blue to-blue-grey text-white">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-12">Feedback dai Partecipanti</h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8">
              <p className="mb-4 text-lg italic">
                "Corso pratico e immediatamente applicabile. In 2 mesi abbiamo aumentato il RevPAR del 18% applicando le
                strategie apprese."
              </p>
              <p className="font-semibold">Laura M.</p>
              <p className="text-sm opacity-80">Revenue Manager, Hotel 4* Firenze</p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8">
              <p className="mb-4 text-lg italic">
                "Finalmente ho capito come funziona veramente il revenue management. Training chiaro, esempi concreti,
                docenti preparati."
              </p>
              <p className="font-semibold">Marco T.</p>
              <p className="text-sm opacity-80">General Manager, Boutique Hotel Toscana</p>
            </div>
          </div>
        </div>
      </section>

      {/* Incluso nei Corsi */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center text-foreground mb-12">Cosa Include il Corso</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              "Materiale didattico completo (slide, template Excel, checklist)",
              "Certificato di partecipazione",
              "Accesso a gruppo LinkedIn Alumni per networking",
              "Template strategia revenue personalizzabile",
              "30 giorni supporto email post-corso",
              "Registrazione video delle sessioni (corsi online)",
            ].map((item, index) => (
              <div key={index} className="flex items-start gap-3">
                <CheckCircle2 className="h-6 w-6 text-primary-blue flex-shrink-0 mt-1" />
                <span className="text-muted-foreground">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold text-foreground mb-6">Vuoi Formare il Tuo Team?</h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Richiedi il calendario corsi o un preventivo per training personalizzato on-site nella tua struttura.
          </p>
          <Link href="/#contact">
            <Button size="lg" className="bg-primary-blue hover:bg-primary-blue/90">
              Richiedi Informazioni
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  )
}
