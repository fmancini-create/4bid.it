"use client"

import { Smartphone, Tablet, Monitor, UtensilsCrossed } from "lucide-react"
import Image from "next/image"

export default function AppsSection() {
  const apps = [
    {
      name: "4BidApp Mobile",
      description:
        "App mobile per la gestione completa delle aste e delle offerte in tempo reale. Disponibile su iOS e Android.",
      icon: Smartphone,
      platform: "iOS & Android",
      features: ["Notifiche push", "Gestione offerte", "Dashboard analytics"],
    },
    {
      name: "4Bid Manager",
      description: "Piattaforma web per il monitoraggio e la gestione centralizzata di tutte le attività commerciali.",
      icon: Monitor,
      platform: "Web App",
      features: ["Multi-utente", "Report avanzati", "Integrazione CRM"],
    },
    {
      name: "4Bid Tablet POS",
      description: "Soluzione tablet per punti vendita con gestione inventario e sistema di pagamento integrato.",
      icon: Tablet,
      platform: "Tablet",
      features: ["POS integrato", "Gestione magazzino", "Fatturazione"],
    },
    {
      name: "Da Tiberio a San Casciano",
      description:
        "App mobile per il ristorante Da Tiberio di San Casciano in Val di Pesa. Prenotazioni, menu digitale e ordini online.",
      icon: UtensilsCrossed,
      platform: "iOS & Android",
      features: ["Prenotazioni tavoli", "Menu digitale", "Ordini take-away"],
      image: "/da-tiberio-app-hand.png",
    },
  ]

  return (
    <section id="app" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <p className="text-primary/60 uppercase tracking-wide text-sm mb-2">Le nostre soluzioni</p>
          <h2 className="text-4xl font-bold text-foreground mb-4">App Sviluppate</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Creiamo applicazioni su misura per ottimizzare i processi aziendali e migliorare l'esperienza dei tuoi
            clienti
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {apps.map((app, index) => (
            <div key={index} className="bg-card border border-border rounded-lg p-8 hover:shadow-lg transition-shadow">
              {app.image ? (
                <div className="mb-6 rounded-lg overflow-hidden bg-gradient-to-br from-[#F4B942]/10 to-transparent p-4">
                  <Image
                    src={app.image || "/placeholder.svg"}
                    alt={app.name}
                    width={200}
                    height={400}
                    className="mx-auto"
                  />
                </div>
              ) : (
                <div className="bg-[#F4B942] w-16 h-16 rounded-full flex items-center justify-center mb-6">
                  <app.icon className="w-8 h-8 text-white" />
                </div>
              )}
              <h3 className="text-xl font-bold text-foreground mb-2">{app.name}</h3>
              <p className="text-sm text-primary/60 mb-4">{app.platform}</p>
              <p className="text-muted-foreground mb-6">{app.description}</p>
              <div className="space-y-2">
                <p className="text-sm font-semibold text-foreground">Funzionalità:</p>
                <ul className="space-y-1">
                  {app.features.map((feature, idx) => (
                    <li key={idx} className="text-sm text-muted-foreground flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-[#F4B942] rounded-full"></span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 bg-primary/5 border border-primary/10 rounded-lg p-8 text-center">
          <h3 className="text-2xl font-bold text-foreground mb-4">Hai bisogno di un'app personalizzata?</h3>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Sviluppiamo soluzioni software su misura per le esigenze specifiche della tua azienda. Contattaci per
            discutere il tuo progetto.
          </p>
          <a
            href="#contact"
            className="inline-block bg-primary text-primary-foreground px-8 py-3 rounded-md hover:bg-primary/90 transition-colors font-medium"
          >
            Richiedi preventivo
          </a>
        </div>
      </div>
    </section>
  )
}
