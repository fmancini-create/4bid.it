import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server-admin"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createAdminClient()

  // Fetch business plan with financials
  const { data: plan, error: planError } = await supabase.from("business_plans").select("*").eq("id", id).single()

  if (planError || !plan) {
    return NextResponse.json({ error: "Business plan non trovato" }, { status: 404 })
  }

  const { data: financials } = await supabase
    .from("business_plan_years")
    .select("*")
    .eq("business_plan_id", id)
    .order("year_number", { ascending: true })

  // Generate HTML for PDF
  const generationDate = new Date().toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  })

  // Calculate P&L for each year
  const calculatePL = (fin: any) => {
    const roomNights = (plan.num_rooms || 90) * (plan.opening_days_year || 365) * ((fin.occupancy_rate || 65) / 100)
    const roomRevenue = roomNights * (fin.adr || 180)
    const fbRevenue = roomRevenue * ((fin.fb_revenue_pct || 35) / 100)
    const spaRevenue = plan.has_spa ? roomRevenue * ((fin.spa_revenue_pct || 12) / 100) : 0
    const congressRevenue = plan.has_congress ? roomRevenue * ((fin.congress_revenue_pct || 20) / 100) : 0
    const otherRevenue = roomRevenue * ((fin.other_revenue_pct || 5) / 100)
    const totalRevenue = roomRevenue + fbRevenue + spaRevenue + congressRevenue + otherRevenue

    const roomCosts = roomRevenue * ((fin.rooms_cost_pct || 15) / 100)
    const fbCosts = fbRevenue * ((fin.fb_cost_pct || 35) / 100)
    const spaCosts = spaRevenue * ((fin.spa_cost_pct || 25) / 100)
    const congressCosts = congressRevenue * ((fin.congress_cost_pct || 45) / 100)
    const totalVariableCosts = roomCosts + fbCosts + spaCosts + congressCosts

    const staffCost =
      (fin.staff_rooms_cost || 0) +
      (fin.staff_fb_cost || 0) +
      (plan.has_spa ? fin.staff_spa_cost || 0 : 0) +
      (plan.has_congress ? fin.staff_congress_cost || 0 : 0) +
      (fin.staff_admin_cost || 0)
    const totalFixedCosts =
      staffCost +
      (fin.rent_cost || 0) +
      (fin.utilities_cost || 0) +
      (fin.marketing_cost || 0) +
      (fin.maintenance_cost || 0) +
      (fin.insurance_cost || 0) +
      (fin.admin_cost || 0) +
      (fin.other_fixed_cost || 0)

    const ebitda = totalRevenue - totalVariableCosts - totalFixedCosts
    const depreciation = fin.depreciation || 150000
    const interest = fin.interest_cost || 80000
    const ebt = ebitda - depreciation - interest
    const taxes = ebt > 0 ? ebt * ((fin.tax_rate || 24) / 100) : 0
    const netIncome = ebt - taxes

    return {
      roomNights: Math.round(roomNights),
      roomRevenue,
      fbRevenue,
      spaRevenue,
      congressRevenue,
      otherRevenue,
      totalRevenue,
      totalVariableCosts,
      totalFixedCosts,
      ebitda,
      netIncome,
      revpar: totalRevenue / ((plan.num_rooms || 90) * (plan.opening_days_year || 365)),
    }
  }

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("it-IT", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    }).format(n)

  const formatPercent = (n: number, total: number) => (total > 0 ? `${((n / total) * 100).toFixed(1)}%` : "-")

  const yearData = (financials || []).map((fin: any) => ({
    year: (plan.start_year || 2025) + (fin.year_number || 1) - 1,
    ...calculatePL(fin),
  }))

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Business Plan - ${plan.client_name || plan.name}</title>
      <style>
        @page { margin: 20mm; size: A4; }
        * { box-sizing: border-box; }
        body { 
          font-family: 'Segoe UI', Arial, sans-serif; 
          font-size: 11pt; 
          line-height: 1.5; 
          color: #1a1a1a;
          margin: 0;
          padding: 0;
        }
        .page { page-break-after: always; }
        .page:last-child { page-break-after: auto; }
        
        /* Header */
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 20px;
          border-bottom: 3px solid #f59e0b;
          margin-bottom: 30px;
        }
        .header img { height: 45px; }
        .header-right { text-align: right; font-size: 10pt; color: #666; }
        
        /* Cover page */
        .cover {
          height: 100vh;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          text-align: center;
        }
        .cover-logo { height: 80px; margin-bottom: 60px; }
        .cover h1 { 
          font-size: 32pt; 
          color: #1a1a1a; 
          margin: 0 0 10px 0;
          font-weight: 700;
        }
        .cover h2 { 
          font-size: 20pt; 
          color: #f59e0b; 
          margin: 0 0 40px 0;
          font-weight: 400;
        }
        .cover-meta { 
          font-size: 11pt; 
          color: #666; 
          margin-top: 60px;
        }
        .cover-meta p { margin: 5px 0; }
        
        /* Sections */
        h2 { 
          color: #f59e0b; 
          font-size: 16pt; 
          border-bottom: 2px solid #f59e0b;
          padding-bottom: 8px;
          margin: 30px 0 15px 0;
        }
        h3 { 
          color: #1a1a1a; 
          font-size: 13pt; 
          margin: 20px 0 10px 0;
        }
        
        /* Info grid */
        .info-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 15px;
          margin: 20px 0;
        }
        .info-box {
          background: #f8f8f8;
          padding: 12px;
          border-radius: 6px;
          border-left: 3px solid #f59e0b;
        }
        .info-box label { font-size: 9pt; color: #666; display: block; }
        .info-box span { font-size: 12pt; font-weight: 600; }
        
        /* Tables */
        table { 
          width: 100%; 
          border-collapse: collapse; 
          margin: 15px 0;
          font-size: 10pt;
        }
        th { 
          background: #f59e0b; 
          color: white; 
          padding: 10px 8px;
          text-align: left;
          font-weight: 600;
        }
        th.right, td.right { text-align: right; }
        td { 
          padding: 8px; 
          border-bottom: 1px solid #e0e0e0;
        }
        tr.subtotal { background: #f8f8f8; font-weight: 600; }
        tr.total { background: #f59e0b; color: white; font-weight: 700; }
        tr.total td { border: none; }
        .positive { color: #16a34a; }
        .negative { color: #dc2626; }
        
        /* KPI boxes */
        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 15px;
          margin: 20px 0;
        }
        .kpi-box {
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          color: white;
          padding: 20px;
          border-radius: 8px;
          text-align: center;
        }
        .kpi-box .year { font-size: 12pt; opacity: 0.9; }
        .kpi-box .value { font-size: 18pt; font-weight: 700; margin: 8px 0; }
        .kpi-box .label { font-size: 9pt; opacity: 0.9; }
        
        /* Content sections */
        .content-section {
          margin: 20px 0;
          padding: 15px;
          background: #fafafa;
          border-radius: 6px;
        }
        .content-section h3 { margin-top: 0; }
        
        /* Footer */
        .footer {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          padding: 10px 20mm;
          font-size: 8pt;
          color: #999;
          border-top: 1px solid #e0e0e0;
          display: flex;
          justify-content: space-between;
        }
        
        /* Print styles */
        @media print {
          .page { page-break-after: always; }
        }
      </style>
    </head>
    <body>
      <!-- Cover Page -->
      <div class="page cover">
        <img src="https://4bid.it/logo.png" alt="4BID.IT" class="cover-logo" />
        <h1>${plan.client_name || plan.name || "Business Plan"}</h1>
        <h2>${plan.project_type === "hotel" ? "Hotel" : plan.project_type} ${plan.stars || 4} Stelle${plan.stars === 4 ? " Superior" : ""}</h2>
        <p style="font-size: 14pt; color: #666;">${plan.location || ""}</p>
        <div class="cover-meta">
          <p>Documento riservato e confidenziale</p>
          <p>Generato il ${generationDate}</p>
        </div>
      </div>
      
      <!-- Project Info Page -->
      <div class="page">
        <div class="header">
          <img src="https://4bid.it/logo.png" alt="4BID.IT" />
          <div class="header-right">
            ${plan.client_name || plan.name}<br/>
            ${generationDate}
          </div>
        </div>
        
        <h2>Informazioni Progetto</h2>
        
        <div class="info-grid">
          <div class="info-box">
            <label>Località</label>
            <span>${plan.location || "-"}</span>
          </div>
          <div class="info-box">
            <label>Camere</label>
            <span>${plan.num_rooms || 90}</span>
          </div>
          <div class="info-box">
            <label>Categoria</label>
            <span>${plan.stars || 4} Stelle${plan.stars === 4 ? " Superior" : ""}</span>
          </div>
          <div class="info-box">
            <label>Giorni Apertura</label>
            <span>${plan.opening_days_year || 365}</span>
          </div>
          <div class="info-box">
            <label>Investimento</label>
            <span>${formatCurrency(plan.initial_investment || 0)}</span>
          </div>
          <div class="info-box">
            <label>Ristorante</label>
            <span>${plan.has_restaurant ? "Sì" : "No"}</span>
          </div>
          <div class="info-box">
            <label>SPA & Wellness</label>
            <span>${plan.has_spa ? "Sì" : "No"}</span>
          </div>
          <div class="info-box">
            <label>Centro Congressi</label>
            <span>${plan.has_congress ? "Sì" : "No"}</span>
          </div>
        </div>
        
        ${
          plan.executive_summary
            ? `
        <h2>Executive Summary</h2>
        <div class="content-section">
          <p style="white-space: pre-wrap;">${plan.executive_summary}</p>
        </div>
        `
            : ""
        }
      </div>
      
      <!-- Financial Projections Page -->
      <div class="page">
        <div class="header">
          <img src="https://4bid.it/logo.png" alt="4BID.IT" />
          <div class="header-right">
            ${plan.client_name || plan.name}<br/>
            ${generationDate}
          </div>
        </div>
        
        <h2>Proiezioni Finanziarie</h2>
        
        ${
          yearData.length > 0
            ? `
        <div class="kpi-grid">
          ${yearData
            .map(
              (y: any) => `
            <div class="kpi-box">
              <div class="year">Anno ${y.year}</div>
              <div class="value">${formatCurrency(y.totalRevenue)}</div>
              <div class="label">Ricavi Totali</div>
            </div>
          `,
            )
            .join("")}
        </div>
        
        <h3>Conto Economico Previsionale</h3>
        <table>
          <thead>
            <tr>
              <th>Voce</th>
              ${yearData.map((y: any) => `<th class="right">${y.year}</th><th class="right">%</th>`).join("")}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>RICAVI</strong></td>
              ${yearData.map(() => `<td></td><td></td>`).join("")}
            </tr>
            <tr>
              <td>Room Division</td>
              ${yearData
                .map(
                  (y: any) => `
                <td class="right">${formatCurrency(y.roomRevenue)}</td>
                <td class="right">${formatPercent(y.roomRevenue, y.totalRevenue)}</td>
              `,
                )
                .join("")}
            </tr>
            <tr>
              <td>Food & Beverage</td>
              ${yearData
                .map(
                  (y: any) => `
                <td class="right">${formatCurrency(y.fbRevenue)}</td>
                <td class="right">${formatPercent(y.fbRevenue, y.totalRevenue)}</td>
              `,
                )
                .join("")}
            </tr>
            ${
              plan.has_spa
                ? `
            <tr>
              <td>SPA & Wellness</td>
              ${yearData
                .map(
                  (y: any) => `
                <td class="right">${formatCurrency(y.spaRevenue)}</td>
                <td class="right">${formatPercent(y.spaRevenue, y.totalRevenue)}</td>
              `,
                )
                .join("")}
            </tr>
            `
                : ""
            }
            ${
              plan.has_congress
                ? `
            <tr>
              <td>Centro Congressi</td>
              ${yearData
                .map(
                  (y: any) => `
                <td class="right">${formatCurrency(y.congressRevenue)}</td>
                <td class="right">${formatPercent(y.congressRevenue, y.totalRevenue)}</td>
              `,
                )
                .join("")}
            </tr>
            `
                : ""
            }
            <tr>
              <td>Altri Ricavi</td>
              ${yearData
                .map(
                  (y: any) => `
                <td class="right">${formatCurrency(y.otherRevenue)}</td>
                <td class="right">${formatPercent(y.otherRevenue, y.totalRevenue)}</td>
              `,
                )
                .join("")}
            </tr>
            <tr class="subtotal">
              <td><strong>Totale Ricavi</strong></td>
              ${yearData
                .map(
                  (y: any) => `
                <td class="right"><strong>${formatCurrency(y.totalRevenue)}</strong></td>
                <td class="right">100%</td>
              `,
                )
                .join("")}
            </tr>
            <tr>
              <td><strong>COSTI</strong></td>
              ${yearData.map(() => `<td></td><td></td>`).join("")}
            </tr>
            <tr>
              <td>Costi Variabili</td>
              ${yearData
                .map(
                  (y: any) => `
                <td class="right negative">-${formatCurrency(y.totalVariableCosts)}</td>
                <td class="right">${formatPercent(y.totalVariableCosts, y.totalRevenue)}</td>
              `,
                )
                .join("")}
            </tr>
            <tr>
              <td>Costi Fissi</td>
              ${yearData
                .map(
                  (y: any) => `
                <td class="right negative">-${formatCurrency(y.totalFixedCosts)}</td>
                <td class="right">${formatPercent(y.totalFixedCosts, y.totalRevenue)}</td>
              `,
                )
                .join("")}
            </tr>
            <tr class="subtotal">
              <td><strong>EBITDA</strong></td>
              ${yearData
                .map(
                  (y: any) => `
                <td class="right ${y.ebitda >= 0 ? "positive" : "negative"}"><strong>${formatCurrency(y.ebitda)}</strong></td>
                <td class="right">${formatPercent(y.ebitda, y.totalRevenue)}</td>
              `,
                )
                .join("")}
            </tr>
            <tr class="total">
              <td><strong>UTILE NETTO</strong></td>
              ${yearData
                .map(
                  (y: any) => `
                <td class="right"><strong>${formatCurrency(y.netIncome)}</strong></td>
                <td class="right">${formatPercent(y.netIncome, y.totalRevenue)}</td>
              `,
                )
                .join("")}
            </tr>
          </tbody>
        </table>
        
        <h3>KPI Operativi</h3>
        <table>
          <thead>
            <tr>
              <th>Indicatore</th>
              ${yearData.map((y: any) => `<th class="right">${y.year}</th>`).join("")}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Room Nights</td>
              ${yearData.map((y: any) => `<td class="right">${y.roomNights.toLocaleString("it-IT")}</td>`).join("")}
            </tr>
            <tr>
              <td>RevPAR</td>
              ${yearData.map((y: any) => `<td class="right">${formatCurrency(y.revpar)}</td>`).join("")}
            </tr>
          </tbody>
        </table>
        `
            : "<p>Nessun dato finanziario disponibile.</p>"
        }
      </div>
      
      <!-- Market Analysis & Strategy Page -->
      ${
        plan.market_analysis || plan.business_model || plan.marketing_strategy
          ? `
      <div class="page">
        <div class="header">
          <img src="https://4bid.it/logo.png" alt="4BID.IT" />
          <div class="header-right">
            ${plan.client_name || plan.name}<br/>
            ${generationDate}
          </div>
        </div>
        
        ${
          plan.market_analysis
            ? `
        <h2>Analisi di Mercato</h2>
        <div class="content-section">
          <p style="white-space: pre-wrap;">${plan.market_analysis}</p>
        </div>
        `
            : ""
        }
        
        ${
          plan.business_model
            ? `
        <h2>Business Model</h2>
        <div class="content-section">
          <p style="white-space: pre-wrap;">${plan.business_model}</p>
        </div>
        `
            : ""
        }
        
        ${
          plan.marketing_strategy
            ? `
        <h2>Strategia Marketing</h2>
        <div class="content-section">
          <p style="white-space: pre-wrap;">${plan.marketing_strategy}</p>
        </div>
        `
            : ""
        }
      </div>
      `
          : ""
      }
      
      <!-- Management & Risk Page -->
      ${
        plan.management_team || plan.risk_analysis
          ? `
      <div class="page">
        <div class="header">
          <img src="https://4bid.it/logo.png" alt="4BID.IT" />
          <div class="header-right">
            ${plan.client_name || plan.name}<br/>
            ${generationDate}
          </div>
        </div>
        
        ${
          plan.management_team
            ? `
        <h2>Team di Gestione</h2>
        <div class="content-section">
          <p style="white-space: pre-wrap;">${plan.management_team}</p>
        </div>
        `
            : ""
        }
        
        ${
          plan.risk_analysis
            ? `
        <h2>Analisi dei Rischi</h2>
        <div class="content-section">
          <p style="white-space: pre-wrap;">${plan.risk_analysis}</p>
        </div>
        `
            : ""
        }
      </div>
      `
          : ""
      }
      
      <!-- Footer on all pages -->
      <div class="footer">
        <span>4BID S.r.l. - Via Dalmazia, 51 - 72017 Ostuni (BR) - P.IVA 02664480745</span>
        <span>Documento riservato - ${generationDate}</span>
      </div>
    </body>
    </html>
  `

  // Return HTML that can be printed as PDF
  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
    },
  })
}
