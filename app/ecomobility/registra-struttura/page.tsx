"use client"

import React from "react"

import Image from "next/image"
import Link from "next/link"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { 
  CheckCircle, 
  Bike, 
  CreditCard, 
  BarChart3, 
  Shield, 
  Zap, 
  Users, 
  MapPin,
  Phone,
  Mail,
  Building,
  ArrowRight,
  Star,
  Clock,
  Leaf
} from "lucide-react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"

export default function RegistraStrutturaPage() {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    structureName: "",
    structureType: "",
    contactName: "",
    email: "",
    phone: "",
    city: "",
    province: "",
    vehicleCount: "",
    message: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const res = await fetch("/api/ecomobility/register-interest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!res.ok) throw new Error("Errore nell'invio")

      toast({
        title: "Richiesta inviata!",
        description: "Ti contatteremo entro 24 ore per una demo personalizzata.",
      })

      setFormData({
        structureName: "",
        structureType: "",
        contactName: "",
        email: "",
        phone: "",
        city: "",
        province: "",
        vehicleCount: "",
        message: "",
      })
    } catch (error) {
      toast({
        title: "Errore",
        description: "Si è verificato un errore. Riprova o contattaci direttamente.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const features = [
    {
      icon: Bike,
      title: "Flotta Completa",
      description: "E-bike, scooter elettrici, monopattini e minicar. Gestisci tutto da un'unica piattaforma.",
    },
    {
      icon: CreditCard,
      title: "Pagamenti Automatici",
      description: "Stripe Connect integrato. I clienti pagano online, tu incassi direttamente sul tuo conto.",
    },
    {
      icon: BarChart3,
      title: "Dashboard Completa",
      description: "Monitora prenotazioni, flotta, ricavi e statistiche in tempo reale.",
    },
    {
      icon: Shield,
      title: "Documenti Sicuri",
      description: "Verifica automatica di patente e carta d'identità. Conformità GDPR garantita.",
    },
    {
      icon: Zap,
      title: "Setup in 24 Ore",
      description: "Ti configuriamo la piattaforma personalizzata con il tuo brand in un giorno.",
    },
    {
      icon: MapPin,
      title: "GPS Tracking",
      description: "Traccia i veicoli in tempo reale. Lucchetti smart opzionali per maggiore sicurezza.",
    },
  ]

  const plans = [
    {
      name: "Starter",
      price: "49",
      description: "Per piccole strutture fino a 5 veicoli",
      features: [
        "Dashboard completa",
        "Prenotazioni online",
        "Pagamenti Stripe",
        "Report base",
        "Supporto email",
      ],
      highlight: false,
    },
    {
      name: "Professional",
      price: "99",
      description: "Per strutture medie fino a 15 veicoli",
      features: [
        "Tutto Starter +",
        "Report avanzati",
        "Multi-operatore",
        "GPS tracking base",
        "Supporto prioritario",
      ],
      highlight: true,
    },
    {
      name: "Enterprise",
      price: "199",
      description: "Per grandi strutture, veicoli illimitati",
      features: [
        "Tutto Professional +",
        "White label completo",
        "API access",
        "GPS + lucchetti smart",
        "Account manager dedicato",
      ],
      highlight: false,
    },
  ]

  const stats = [
    { value: "+30%", label: "Revenue extra", description: "per le strutture partner" },
    { value: "24h", label: "Setup completo", description: "dalla firma del contratto" },
    { value: "5%", label: "Commissione", description: "solo sulle transazioni" },
    { value: "0€", label: "Costi nascosti", description: "trasparenza totale" },
  ]

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-orange-50 via-white to-green-50 pt-20 pb-32">
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-5" />
        <div className="container mx-auto px-4 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                <Leaf className="h-3 w-3 mr-1" />
                Mobilità Sostenibile
              </Badge>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight text-balance">
                Offri mobilità elettrica ai tuoi ospiti
              </h1>
              <p className="text-xl text-muted-foreground max-w-lg">
                La piattaforma completa per gestire il noleggio di e-bike, scooter e veicoli elettrici nella tua struttura ricettiva. Zero pensieri, massimo profitto.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  size="lg" 
                  className="bg-orange-500 hover:bg-orange-600 text-white text-lg px-8"
                  onClick={() => document.getElementById("registration-form")?.scrollIntoView({ behavior: "smooth" })}
                >
                  Richiedi Demo Gratuita
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  className="text-lg px-8 bg-transparent"
                  asChild
                >
                  <Link href="/ecomobility/come-funziona">
                    Scopri come funziona
                  </Link>
                </Button>
              </div>
            </div>
            <div className="relative">
              <div className="bg-white rounded-2xl shadow-2xl p-8 border">
                <Image
                  src="/ecomobility-logo.png"
                  alt="4BID Ecomobility"
                  width={300}
                  height={150}
                  className="mx-auto mb-6"
                />
                <div className="grid grid-cols-2 gap-4 text-center">
                  {stats.map((stat, index) => (
                    <div key={index} className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-2xl font-bold text-orange-500">{stat.value}</p>
                      <p className="text-sm font-medium text-foreground">{stat.label}</p>
                      <p className="text-xs text-muted-foreground">{stat.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="mb-4">Funzionalità</Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Tutto quello che ti serve, in un'unica piattaforma
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Dalla prenotazione al pagamento, dalla gestione flotta alla reportistica. Automatizzato e semplice.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-2 hover:border-orange-200 transition-colors">
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-orange-100 flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-orange-600" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="mb-4">Come Funziona</Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Attivo in 3 semplici passi
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { step: "1", title: "Richiedi Demo", description: "Compila il form e ti contatteremo entro 24 ore per una demo personalizzata." },
              { step: "2", title: "Configurazione", description: "Ti creiamo la piattaforma con il tuo brand, tariffe e veicoli in 24 ore." },
              { step: "3", title: "Vai Live", description: "Condividi il link con i tuoi ospiti e inizia a guadagnare subito." },
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className="h-16 w-16 rounded-full bg-orange-500 text-white flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                <p className="text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="mb-4">Pricing</Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Piani semplici e trasparenti
            </h2>
            <p className="text-lg text-muted-foreground">
              Canone mensile + 5% sulle transazioni. Nessun costo nascosto.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {plans.map((plan, index) => (
              <Card 
                key={index} 
                className={`relative ${plan.highlight ? "border-2 border-orange-500 shadow-xl" : ""}`}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-orange-500 text-white">Più Popolare</Badge>
                  </div>
                )}
                <CardHeader className="text-center pb-2">
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="mb-6">
                    <span className="text-4xl font-bold">€{plan.price}</span>
                    <span className="text-muted-foreground">/mese</span>
                  </div>
                  <ul className="space-y-3 text-left mb-8">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className={`w-full ${plan.highlight ? "bg-orange-500 hover:bg-orange-600" : ""}`}
                    variant={plan.highlight ? "default" : "outline"}
                    onClick={() => document.getElementById("registration-form")?.scrollIntoView({ behavior: "smooth" })}
                  >
                    Inizia Ora
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-orange-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-orange-100 text-orange-800">Testimonianze</Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Cosa dicono i nostri partner
            </h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                quote: "Da quando abbiamo attivato Ecomobility, gli ospiti ci chiedono continuamente le bici. Revenue extra del 25% in alta stagione.",
                author: "Marco R.",
                role: "Direttore, Hotel 4 stelle Toscana",
              },
              {
                quote: "Setup velocissimo e supporto eccellente. La gestione automatica dei pagamenti ci ha semplificato la vita.",
                author: "Laura B.",
                role: "Property Manager, Residence Lago di Garda",
              },
              {
                quote: "I nostri ospiti adorano esplorare la zona in e-bike. Un servizio che ci differenzia dalla concorrenza.",
                author: "Giovanni M.",
                role: "Titolare, Agriturismo Umbria",
              },
            ].map((testimonial, index) => (
              <Card key={index} className="bg-white">
                <CardContent className="pt-6">
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-4 italic">"{testimonial.quote}"</p>
                  <div>
                    <p className="font-semibold">{testimonial.author}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Registration Form Section */}
      <section id="registration-form" className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <Badge className="mb-4 bg-green-100 text-green-800">Registrati Ora</Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Richiedi una demo gratuita
              </h2>
              <p className="text-lg text-muted-foreground">
                Compila il form e ti contatteremo entro 24 ore per mostrarti la piattaforma in azione.
              </p>
            </div>

            <Card className="border-2">
              <CardContent className="p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="structureName">Nome Struttura *</Label>
                      <div className="relative">
                        <Building className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="structureName"
                          placeholder="Es. Hotel Bellavista"
                          className="pl-10"
                          value={formData.structureName}
                          onChange={(e) => setFormData({ ...formData, structureName: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="structureType">Tipo Struttura *</Label>
                      <Select 
                        value={formData.structureType} 
                        onValueChange={(value) => setFormData({ ...formData, structureType: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleziona tipologia" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hotel">Hotel</SelectItem>
                          <SelectItem value="resort">Resort</SelectItem>
                          <SelectItem value="agriturismo">Agriturismo</SelectItem>
                          <SelectItem value="bb">B&B</SelectItem>
                          <SelectItem value="residence">Residence</SelectItem>
                          <SelectItem value="campeggio">Campeggio</SelectItem>
                          <SelectItem value="altro">Altro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="contactName">Nome e Cognome *</Label>
                      <div className="relative">
                        <Users className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="contactName"
                          placeholder="Mario Rossi"
                          className="pl-10"
                          value={formData.contactName}
                          onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="info@tuohotel.com"
                          className="pl-10"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Telefono *</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="+39 123 456 7890"
                          className="pl-10"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="vehicleCount">Quanti veicoli vorresti?</Label>
                      <Select 
                        value={formData.vehicleCount} 
                        onValueChange={(value) => setFormData({ ...formData, vehicleCount: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleziona numero" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1-5">1-5 veicoli</SelectItem>
                          <SelectItem value="6-10">6-10 veicoli</SelectItem>
                          <SelectItem value="11-20">11-20 veicoli</SelectItem>
                          <SelectItem value="20+">Più di 20 veicoli</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="city">Città *</Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="city"
                          placeholder="Firenze"
                          className="pl-10"
                          value={formData.city}
                          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="province">Provincia *</Label>
                      <Input
                        id="province"
                        placeholder="FI"
                        value={formData.province}
                        onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Note o richieste particolari</Label>
                    <Textarea
                      id="message"
                      placeholder="Raccontaci le tue esigenze..."
                      rows={4}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    />
                  </div>

                  <Button 
                    type="submit" 
                    size="lg" 
                    className="w-full bg-orange-500 hover:bg-orange-600 text-lg"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Clock className="mr-2 h-5 w-5 animate-spin" />
                        Invio in corso...
                      </>
                    ) : (
                      <>
                        Richiedi Demo Gratuita
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </>
                    )}
                  </Button>

                  <p className="text-center text-sm text-muted-foreground">
                    Compilando il form accetti la nostra{" "}
                    <Link href="/privacy" className="underline hover:text-foreground">
                      Privacy Policy
                    </Link>
                    . Ti contatteremo entro 24 ore lavorative.
                  </p>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="mb-4">FAQ</Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Domande Frequenti
            </h2>
          </div>
          <div className="max-w-3xl mx-auto space-y-4">
            {[
              {
                q: "Devo acquistare i veicoli?",
                a: "No, il modello 4BID Ecomobility prevede che tu fornisca i veicoli. Noi forniamo la piattaforma e opzionalmente l'hardware (GPS, lucchetti). In alternativa possiamo consigliarti partner per il noleggio operativo della flotta.",
              },
              {
                q: "Quanto tempo serve per essere operativi?",
                a: "In 24 ore dalla firma del contratto ti configuriamo la piattaforma con il tuo brand, tariffe e veicoli. Puoi iniziare subito a ricevere prenotazioni.",
              },
              {
                q: "Come funzionano i pagamenti?",
                a: "I clienti pagano con carta di credito tramite Stripe. L'importo va direttamente sul tuo conto Stripe, noi tratteniamo solo il 5% di commissione.",
              },
              {
                q: "Posso personalizzare tariffe e condizioni?",
                a: "Assolutamente sì. Puoi impostare tariffe a ore con prezzi decrescenti, cauzioni, condizioni di noleggio e documenti richiesti.",
              },
              {
                q: "C'è un vincolo contrattuale?",
                a: "Il canone è mensile e puoi disdire in qualsiasi momento con 30 giorni di preavviso. Nessun vincolo annuale obbligatorio.",
              },
            ].map((faq, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="text-lg">{faq.q}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{faq.a}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 bg-orange-500 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Pronto a far crescere il tuo business?
          </h2>
          <p className="text-xl text-orange-100 mb-8 max-w-2xl mx-auto">
            Unisciti alle strutture che già offrono mobilità elettrica ai propri ospiti.
          </p>
          <Button 
            size="lg" 
            variant="secondary" 
            className="text-lg px-8"
            onClick={() => document.getElementById("registration-form")?.scrollIntoView({ behavior: "smooth" })}
          >
            Inizia Ora - È Gratis
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  )
}
