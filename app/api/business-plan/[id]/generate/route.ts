import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { createAdminClient } from "@/lib/supabase"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { section } = await request.json()

    console.log("[v0] Generate API - id:", id, "section:", section)

    const supabase = createAdminClient()

    // Recupera il business plan con i dati finanziari
    const { data: plan, error: planError } = await supabase.from("business_plans").select("*").eq("id", id).single()

    if (planError || !plan) {
      console.log("[v0] Generate API - plan error:", planError)
      return NextResponse.json({ error: "Business plan non trovato" }, { status: 404 })
    }

    const { data: financials } = await supabase
      .from("business_plan_years")
      .select("*")
      .eq("business_plan_id", id)
      .order("year_number", { ascending: true })

    console.log("[v0] Generate API - financials:", financials?.length || 0, "records")

    // Calcola i KPI principali per il contesto
    const kpis = (financials || []).map((fin: Record<string, number>) => {
      const roomNights = (plan.num_rooms || 90) * (plan.opening_days_year || 365) * ((fin.occupancy_rate || 65) / 100)
      const roomRevenue = roomNights * (fin.adr || 180)
      const fbRevenue = roomRevenue * ((fin.fb_revenue_pct || 35) / 100)
      const spaRevenue = roomRevenue * ((fin.spa_revenue_pct || 12) / 100)
      const totalRevenue = roomRevenue + fbRevenue + spaRevenue
      const revpar = roomRevenue / ((plan.num_rooms || 90) * (plan.opening_days_year || 365))

      return {
        year: fin.year_number,
        occupancy: fin.occupancy_rate || 65,
        adr: fin.adr || 180,
        revpar: revpar.toFixed(2),
        totalRevenue: totalRevenue.toFixed(0),
        roomRevenue: roomRevenue.toFixed(0),
      }
    })

    const projectName = plan.client_name || plan.name || "Progetto Hotel"

    // Definisci i prompt per ogni sezione
    const sectionPrompts: Record<string, string> = {
      executive_summary: `Scrivi un Executive Summary professionale per il seguente business plan alberghiero:

DATI PROGETTO:
- Nome: ${projectName}
- Tipo: Hotel ${plan.stars || 4} stelle ${plan.has_spa ? "con SPA" : ""} ${plan.has_restaurant ? "con ristorante" : ""}
- Località: ${plan.location || "Italia"}
- Numero camere: ${plan.num_rooms || 90}
- Giorni apertura: ${plan.opening_days_year || 365}
- Investimento: €${plan.initial_investment?.toLocaleString() || "8.000.000"}

PROIEZIONI FINANZIARIE:
${kpis.map((k) => `Anno ${k.year}: Occupancy ${k.occupancy}%, ADR €${k.adr}, RevPAR €${k.revpar}, Fatturato €${k.totalRevenue}`).join("\n")}

Scrivi 3-4 paragrafi che includano:
1. Vision e mission del progetto
2. Punti di forza e differenziazione
3. Obiettivi finanziari principali
4. Opportunità di mercato

Scrivi in italiano, tono professionale ma coinvolgente.`,

      market_analysis: `Scrivi un'analisi di mercato dettagliata per il seguente hotel:

DATI PROGETTO:
- Nome: ${projectName}
- Tipo: Hotel ${plan.stars || 4} stelle ${plan.has_spa ? "con centro benessere" : ""} ${plan.has_restaurant ? "con ristorante" : ""}
- Località: ${plan.location || "Lucca, Toscana"}
- Numero camere: ${plan.num_rooms || 90}

DATI FINANZIARI PREVISTI:
${kpis.map((k) => `Anno ${k.year}: Occupancy target ${k.occupancy}%, ADR €${k.adr}`).join("\n")}

Scrivi un'analisi che includa:
1. Analisi del mercato turistico della zona
2. Segmentazione della clientela target (leisure, business, MICE, wellness)
3. Analisi competitiva e positioning
4. Trend di settore rilevanti (turismo esperienziale, sostenibilità, wellness)
5. Stagionalità e strategie per ottimizzare l'occupazione

Scrivi in italiano, 4-5 paragrafi dettagliati con dati e insight specifici.`,

      business_model: `Descrivi il modello di business per il seguente hotel:

DATI PROGETTO:
- Nome: ${projectName}
- Tipo: Hotel ${plan.stars || 4} stelle
- Servizi: ${plan.has_spa ? "Centro benessere, " : ""}${plan.has_restaurant ? "Ristorante, " : ""}${plan.has_congress ? "Centro Congressi, " : ""}Camere
- Località: ${plan.location || "Italia"}
- Numero camere: ${plan.num_rooms || 90}

STRUTTURA RICAVI PREVISTA:
${
  kpis.length > 0
    ? `- Ricavi camere: €${kpis[0].roomRevenue}
- F&B: circa ${financials?.[0]?.fb_revenue_pct || 35}% dei ricavi camere
- SPA: circa ${financials?.[0]?.spa_revenue_pct || 12}% dei ricavi camere`
    : "Da definire"
}

Scrivi una descrizione del business model che includa:
1. Proposta di valore unica
2. Fonti di ricavo (camere, F&B, SPA, eventi, altro)
3. Struttura dei costi e leva operativa
4. Canali di distribuzione (diretto, OTA, tour operator)
5. Partnership strategiche

Scrivi in italiano, 4-5 paragrafi professionali.`,

      marketing_strategy: `Definisci la strategia di marketing per il seguente hotel:

DATI PROGETTO:
- Nome: ${projectName}
- Tipo: Hotel ${plan.stars || 4} stelle ${plan.has_spa ? "con SPA" : ""} ${plan.has_restaurant ? "con ristorante gourmet" : ""}
- Località: ${plan.location || "Italia"}
- Posizionamento: Upscale/Upper Upscale

TARGET OCCUPANCY E PRICING:
${kpis.map((k) => `Anno ${k.year}: Occupancy ${k.occupancy}%, ADR €${k.adr}`).join("\n")}

Scrivi una strategia marketing completa che includa:
1. Posizionamento del brand e identità visiva
2. Segmenti target prioritari e buyer personas
3. Channel mix (booking diretto, OTA, MICE, tour operator)
4. Digital marketing (SEO, social media, content marketing)
5. Revenue management e pricing dinamico
6. Programmi fedeltà e CRM
7. Budget marketing raccomandato e KPI

Scrivi in italiano, strategia dettagliata e actionable.`,

      management_team: `Descrivi la struttura organizzativa ideale per il seguente hotel:

DATI PROGETTO:
- Nome: ${projectName}
- Tipo: Hotel ${plan.stars || 4} stelle
- Numero camere: ${plan.num_rooms || 90}
- Servizi: ${plan.has_spa ? "Centro benessere, " : ""}${plan.has_restaurant ? "Ristorante, " : ""}${plan.has_congress ? "Centro Congressi, " : ""}Reception, Housekeeping

Scrivi una descrizione del team di gestione che includa:
1. Organigramma proposto
2. Ruoli chiave e responsabilità (GM, Revenue Manager, F&B Manager, ecc.)
3. Competenze necessarie per ogni posizione
4. Dimensionamento del personale (FTE per reparto)
5. Politiche HR, formazione e sviluppo
6. Outsourcing strategico

Scrivi in italiano, 4-5 paragrafi dettagliati.`,

      risk_analysis: `Analizza i rischi per il seguente progetto alberghiero:

DATI PROGETTO:
- Nome: ${projectName}
- Tipo: Hotel ${plan.stars || 4} stelle di nuova apertura
- Località: ${plan.location || "Italia"}
- Numero camere: ${plan.num_rooms || 90}
- Investimento stimato: €${plan.initial_investment?.toLocaleString() || "8.000.000"}

PROIEZIONI FINANZIARIE:
${kpis.map((k) => `Anno ${k.year}: Occupancy ${k.occupancy}%, Fatturato €${k.totalRevenue}`).join("\n")}

Scrivi un'analisi dei rischi completa che includa:
1. Rischi di mercato (concorrenza, calo domanda, cambio trend)
2. Rischi operativi (personale, qualità servizio, fornitori)
3. Rischi finanziari (cash flow, tassi interesse, cambio valuta)
4. Rischi regolatori e compliance
5. Rischi reputazionali
6. Matrice rischio/impatto per i rischi principali
7. Strategie di mitigazione per ogni categoria

Scrivi in italiano, analisi professionale e dettagliata.`,
    }

    const prompt = sectionPrompts[section]
    if (!prompt) {
      console.log("[v0] Generate API - invalid section:", section)
      return NextResponse.json({ error: "Sezione non valida" }, { status: 400 })
    }

    console.log("[v0] Generate API - calling AI model...")

    const { text } = await generateText({
      model: "openai/gpt-4o",
      prompt,
      maxTokens: 2000,
    })

    console.log("[v0] Generate API - text generated, length:", text?.length)

    return NextResponse.json({ content: text })
  } catch (error) {
    console.error("[v0] Generate API - error:", error)
    return NextResponse.json({ error: "Errore nella generazione" }, { status: 500 })
  }
}
