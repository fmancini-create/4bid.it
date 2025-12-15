import { Bot, CheckCircle2, Settings, Brain } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export function SantaddeoUniqueCallout() {
  return (
    <div className="bg-gradient-to-br from-primary-blue/10 to-blue-grey/10 rounded-2xl p-8 md:p-12 border-2 border-primary-blue/20">
      <div className="flex items-center gap-4 mb-6">
        <Bot className="h-16 w-16 text-primary-blue flex-shrink-0" />
        <div>
          <h3 className="text-2xl md:text-3xl font-bold text-foreground">
            SANTADDEO: L'Unico RMS Veramente Trasparente
          </h3>
          <p className="text-muted-foreground text-lg">The Human Revenue Manager</p>
        </div>
      </div>

      <div className="bg-yellow/10 border-l-4 border-yellow p-4 mb-6 rounded-r-lg">
        <p className="text-foreground font-semibold text-lg">
          SANTADDEO è l'unico RMS esistente che non solo ti spiega la logica dietro alla proposta di prezzo, ma la
          determinazione del prezzo è calcolata da <strong>N fattori</strong> (tutti personalizzabili per
          struttura/giorno/dinamiche), rendendolo una <strong>vera macchina da guerra</strong>, se ben utilizzata!
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="flex items-start gap-3">
          <Brain className="h-6 w-6 text-primary-blue mt-1 flex-shrink-0" />
          <div>
            <h4 className="font-bold text-foreground mb-2">Explainable AI - Zero Black Box</h4>
            <p className="text-sm text-muted-foreground">
              Ogni prezzo proposto ha una spiegazione chiara e dettagliata. Capirai esattamente perché SANTADDEO
              suggerisce €120 invece di €100, con il peso di ogni fattore visualizzato.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Settings className="h-6 w-6 text-primary-blue mt-1 flex-shrink-0" />
          <div>
            <h4 className="font-bold text-foreground mb-2">Personalizzazione Totale dei Fattori</h4>
            <p className="text-sm text-muted-foreground">
              Meteo, eventi, domanda, competitor, OTA, stagionalità, tipo camera, segmento cliente: configura il peso di
              ogni variabile secondo la TUA strategia e la TUA struttura.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <CheckCircle2 className="h-6 w-6 text-primary-blue mt-1 flex-shrink-0" />
          <div>
            <h4 className="font-bold text-foreground mb-2">Adattamento per Giorno e Situazione</h4>
            <p className="text-sm text-muted-foreground">
              Non solo per struttura: personalizza i pesi per giorno della settimana, periodo dell'anno, eventi
              specifici. Il sistema si adatta alle dinamiche uniche del tuo mercato.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <CheckCircle2 className="h-6 w-6 text-primary-blue mt-1 flex-shrink-0" />
          <div>
            <h4 className="font-bold text-foreground mb-2">Performance Based - Zero Rischio</h4>
            <p className="text-sm text-muted-foreground">
              Pagamento a performance sui risultati. Siamo così sicuri dell'efficacia di SANTADDEO che offriamo anche il
              modello revenue share: guadagni solo se guadagni tu.
            </p>
          </div>
        </div>
      </div>

      <div className="flex gap-4 flex-wrap">
        <Link href="/progetti/santaddeo">
          <Button size="lg" className="bg-primary-blue hover:bg-primary-blue/90">
            Scopri SANTADDEO
          </Button>
        </Link>
        <Link href="/software-revenue-management-santaddeo">
          <Button size="lg" variant="outline">
            Dettagli Tecnici Completi
          </Button>
        </Link>
      </div>
    </div>
  )
}
