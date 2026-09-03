import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server-admin"
import { getBusinessPlanShareSession } from "@/lib/business-plan-share-session"

type CorporateData = {
  documentDate?: string
  funding?: {
    amount?: number
    graceMonths?: number
    amortizationMonths?: number
    illustrativeRate?: number
    annualDebtService?: number
  }
  snapshot?: Array<{ label?: string; value?: string }>
  products?: Array<{
    name?: string
    area?: string
    tagline?: string
    description?: string
    pricing?: string
  }>
  scenarios?: Array<{
    name?: string
    accounts?: number[]
    revenue?: number[]
    recurring?: number[]
    ebitda?: number[]
    margin?: number[]
  }>
  benchmark?: Array<{
    suite?: string
    competitor?: string
    company?: string
    price?: string
    functionality?: number
    priceCompetitiveness?: number
    comment?: string
  }>
  pricingNotes?: string[]
  exit?: string
}

const esc = (value: unknown) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;")

const nl = (value: unknown) => esc(value).replaceAll("\n", "<br/>")
const euro = (value: number) =>
  new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value || 0)

export async function GET(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const session = getBusinessPlanShareSession(request, token)
  if (!session) return NextResponse.json({ error: "Accesso non autorizzato" }, { status: 401 })

  const supabase = createAdminClient()
  const { data: share, error: shareError } = await supabase
    .from("business_plan_shares")
    .select("id, business_plan_id, can_download, expires_at")
    .eq("token", token)
    .eq("id", session.shareId)
    .single()

  if (shareError || !share) return NextResponse.json({ error: "Condivisione non valida" }, { status: 404 })
  if (!share.can_download) return NextResponse.json({ error: "Download non consentito" }, { status: 403 })
  if (share.expires_at && new Date(share.expires_at) < new Date()) {
    return NextResponse.json({ error: "Link scaduto" }, { status: 410 })
  }

  const { data: plan, error: planError } = await supabase
    .from("business_plans")
    .select("*")
    .eq("id", share.business_plan_id)
    .single()

  if (planError || !plan || plan.project_type !== "corporate_saas") {
    return NextResponse.json({ error: "Dossier non disponibile" }, { status: 404 })
  }

  let data: CorporateData = {}
  try {
    data = JSON.parse(plan.description || "{}")
  } catch {
    data = {}
  }

  await supabase.from("business_plan_share_events").insert({
    share_id: share.id,
    business_plan_id: share.business_plan_id,
    event_type: "corporate_report_opened",
    recipient_email: session.visitorEmail,
    metadata: {
      visitor_name: session.visitorName,
      visitor_company: session.visitorCompany || null,
    },
  })

  const years = [2027, 2028, 2029, 2030, 2031]
  const reportDate = data.documentDate || new Date().toLocaleDateString("it-IT")
  const funding = data.funding
  const realistic = (data.scenarios || []).find((scenario) =>
    String(scenario.name || "").toLowerCase().includes("real"),
  )

  const snapshotCards = (data.snapshot || [])
    .slice(0, 8)
    .map(
      (item) => `
        <div class="metric">
          <div class="metric-label">${esc(item.label)}</div>
          <div class="metric-value">${esc(item.value)}</div>
        </div>`,
    )
    .join("")

  const productCards = (data.products || [])
    .map(
      (product, index) => `
        <article class="product-card avoid-break">
          <div class="product-number">${String(index + 1).padStart(2, "0")}</div>
          <div>
            <div class="eyebrow">${esc(product.area)}</div>
            <h3>${esc(product.name)}</h3>
            <p class="product-tagline">${esc(product.tagline)}</p>
            <p>${esc(product.description)}</p>
            ${product.pricing ? `<div class="pill">${esc(product.pricing)}</div>` : ""}
          </div>
        </article>`,
    )
    .join("")

  const scenarioBlocks = (data.scenarios || [])
    .map(
      (scenario) => `
        <section class="scenario avoid-break">
          <div class="scenario-title">${esc(scenario.name || "Scenario")}</div>
          <table class="scenario-table">
            <thead>
              <tr><th>KPI</th>${years.map((year) => `<th>${year}</th>`).join("")}</tr>
            </thead>
            <tbody>
              <tr><td>Ricavi (k€)</td>${years.map((_, i) => `<td>${esc(scenario.revenue?.[i] ?? "—")}</td>`).join("")}</tr>
              <tr><td>EBITDA (k€)</td>${years.map((_, i) => `<td>${esc(scenario.ebitda?.[i] ?? "—")}</td>`).join("")}</tr>
              <tr><td>Margine EBITDA</td>${years.map((_, i) => `<td>${scenario.margin?.[i] != null ? `${esc(scenario.margin[i])}%` : "—"}</td>`).join("")}</tr>
              <tr><td>Account/property</td>${years.map((_, i) => `<td>${esc(scenario.accounts?.[i] ?? "—")}</td>`).join("")}</tr>
              <tr><td>Ricavi ricorrenti</td>${years.map((_, i) => `<td>${scenario.recurring?.[i] != null ? `${esc(scenario.recurring[i])}%` : "—"}</td>`).join("")}</tr>
            </tbody>
          </table>
        </section>`,
    )
    .join("")

  const benchmarkCards = (data.benchmark || [])
    .map(
      (row) => `
        <article class="benchmark-card avoid-break">
          <div class="benchmark-topline">
            <span class="eyebrow">${esc(row.suite)}</span>
            <span class="benchmark-company">${esc(row.company)}</span>
          </div>
          <h3>${esc(row.competitor)}</h3>
          <div class="benchmark-meta">
            <span><b>Prezzo indicativo</b><br/>${esc(row.price)}</span>
            <span><b>Funzionalità</b><br/>${esc(row.functionality ?? "—")}/5</span>
            <span><b>Competitività prezzo</b><br/>${esc(row.priceCompetitiveness ?? "—")}/5</span>
          </div>
          <p>${esc(row.comment)}</p>
        </article>`,
    )
    .join("")

  const pricingNotes = data.pricingNotes?.length
    ? `<div class="notes-grid">${data.pricingNotes
        .map((note) => `<div class="note avoid-break">${esc(note)}</div>`)
        .join("")}</div>`
    : ""

  const financeHero = funding
    ? `
      <div class="finance-hero avoid-break">
        <div>
          <span>Finanziamento richiesto</span>
          <strong>${esc(euro(funding.amount || 0))}</strong>
        </div>
        <div>
          <span>Preammortamento</span>
          <strong>${esc(funding.graceMonths ?? "—")} mesi</strong>
        </div>
        <div>
          <span>Ammortamento</span>
          <strong>${esc(funding.amortizationMonths ?? "—")} mesi</strong>
        </div>
        <div>
          <span>Debt service annuo</span>
          <strong>${esc(euro(funding.annualDebtService || 0))}</strong>
        </div>
      </div>`
    : ""

  const html = `<!doctype html>
<html lang="it">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${esc(plan.name || "4BID — Dossier Banca & Investitori")}</title>
  <style>
    @page { size: A4; margin: 13mm 14mm 15mm; }
    * { box-sizing: border-box; }
    html { background: #eef2f7; }
    body {
      margin: 0;
      color: #162033;
      background: #eef2f7;
      font-family: Inter, ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif;
      font-size: 10.2pt;
      line-height: 1.48;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .toolbar {
      position: sticky;
      top: 0;
      z-index: 20;
      display: flex;
      justify-content: center;
      gap: 10px;
      padding: 12px;
      background: rgba(15,23,42,.96);
      box-shadow: 0 8px 25px rgba(15,23,42,.18);
    }
    .toolbar button {
      border: 0;
      border-radius: 9px;
      padding: 11px 18px;
      font-weight: 800;
      cursor: pointer;
    }
    .toolbar .primary { background: #f59e0b; color: #111827; }
    .toolbar .secondary { background: #fff; color: #172033; }
    .report {
      width: 210mm;
      margin: 18px auto 32px;
      background: #fff;
      box-shadow: 0 20px 60px rgba(15,23,42,.14);
    }
    .sheet {
      position: relative;
      padding: 15mm 15mm 17mm;
      min-height: 277mm;
      background: #fff;
      break-after: page;
      page-break-after: always;
    }
    .sheet:last-child { break-after: auto; page-break-after: auto; }
    .cover {
      display: flex;
      flex-direction: column;
      min-height: 277mm;
      padding: 20mm 17mm 17mm;
      background: linear-gradient(145deg, #020617 0%, #0f172a 62%, #172033 100%);
      color: #fff;
    }
    .logo { width: 43mm; height: auto; object-fit: contain; }
    .cover-kicker {
      margin-top: 34mm;
      color: #fbbf24;
      font-size: 9pt;
      font-weight: 900;
      letter-spacing: .13em;
      text-transform: uppercase;
    }
    .cover h1 {
      max-width: 155mm;
      margin: 5mm 0 3mm;
      font-size: 31pt;
      line-height: 1.06;
      letter-spacing: -.03em;
    }
    .cover-subtitle { max-width: 150mm; color: #cbd5e1; font-size: 13pt; }
    .cover-summary {
      max-width: 160mm;
      margin-top: 11mm;
      color: #e2e8f0;
      font-size: 11pt;
    }
    .cover-bottom {
      margin-top: auto;
      display: grid;
      grid-template-columns: 1.35fr .65fr;
      gap: 8mm;
      align-items: end;
    }
    .cover-stat-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 3mm; }
    .cover-stat {
      min-height: 28mm;
      padding: 4mm;
      border: 1px solid rgba(255,255,255,.12);
      border-radius: 4mm;
      background: rgba(255,255,255,.055);
    }
    .cover-stat span { display:block; color:#94a3b8; font-size:8pt; }
    .cover-stat b { display:block; margin-top:1.5mm; color:#fff; font-size:15pt; line-height:1.1; }
    .confidential { color: #94a3b8; font-size: 8.5pt; text-align: right; }
    .page-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8mm;
      padding-bottom: 4mm;
      border-bottom: 1px solid #e2e8f0;
    }
    .page-head img { width: 29mm; }
    .page-head .right { color: #64748b; font-size: 8.5pt; text-align: right; }
    .section-title {
      margin: 9mm 0 4mm;
      color: #0f172a;
      font-size: 19pt;
      line-height: 1.12;
      letter-spacing: -.02em;
    }
    .section-title::after {
      content: "";
      display:block;
      width: 18mm;
      height: 1.1mm;
      margin-top: 2.5mm;
      border-radius: 99px;
      background:#f59e0b;
    }
    .lead { color: #475569; font-size: 11pt; }
    .eyebrow {
      color: #b45309;
      font-size: 7.6pt;
      font-weight: 900;
      letter-spacing: .08em;
      text-transform: uppercase;
    }
    .metrics { display: grid; grid-template-columns: repeat(4, 1fr); gap: 3mm; margin: 5mm 0 7mm; }
    .metric {
      min-height: 24mm;
      padding: 4mm;
      border: 1px solid #e2e8f0;
      border-radius: 3.5mm;
      background: #f8fafc;
    }
    .metric-label { color:#64748b; font-size:7.8pt; }
    .metric-value { margin-top:1.5mm; color:#0f172a; font-size:13.5pt; font-weight:900; line-height:1.12; }
    .finance-hero {
      display:grid;
      grid-template-columns:repeat(4,1fr);
      gap:0;
      overflow:hidden;
      margin:5mm 0 7mm;
      border:1px solid #fde68a;
      border-radius:4mm;
      background:#fffbeb;
    }
    .finance-hero > div { padding:4mm; border-right:1px solid #fde68a; }
    .finance-hero > div:last-child { border-right:0; }
    .finance-hero span { display:block; color:#92400e; font-size:7.5pt; }
    .finance-hero strong { display:block; margin-top:1mm; color:#111827; font-size:12pt; }
    .two-col { display:grid; grid-template-columns:1fr 1fr; gap:6mm; }
    .text-block { padding: 4.5mm 5mm; border: 1px solid #e2e8f0; border-radius: 3.5mm; background:#fff; }
    .text-block h3 { margin:0 0 2mm; font-size:11.5pt; }
    .text-block p { margin:0; color:#334155; }
    .product-grid { display:grid; grid-template-columns:1fr 1fr; gap:4mm; }
    .product-card {
      position:relative;
      display:grid;
      grid-template-columns:10mm 1fr;
      gap:4mm;
      min-height: 49mm;
      padding: 4.5mm;
      border:1px solid #e2e8f0;
      border-radius:4mm;
      background:#fff;
    }
    .product-number { color:#f59e0b; font-size:10pt; font-weight:900; }
    .product-card h3 { margin:1mm 0 1.5mm; font-size:13pt; line-height:1.15; }
    .product-card p { margin:1.5mm 0; color:#475569; font-size:9.2pt; }
    .product-tagline { color:#172033 !important; font-weight:800; }
    .pill {
      display:inline-block;
      margin-top:1.5mm;
      padding:1.2mm 2.5mm;
      border:1px solid #fed7aa;
      border-radius:99px;
      background:#fff7ed;
      color:#9a3412;
      font-size:8pt;
      font-weight:700;
    }
    .notes-grid { display:grid; grid-template-columns:1fr 1fr; gap:3mm; }
    .note { padding:3.5mm 4mm; border-left:1.2mm solid #f59e0b; background:#f8fafc; color:#475569; font-size:9pt; }
    .scenario { margin-bottom:5mm; border:1px solid #e2e8f0; border-radius:4mm; overflow:hidden; }
    .scenario-title { padding:3mm 4mm; background:#fffbeb; color:#92400e; font-size:10pt; font-weight:900; }
    table { width:100%; border-collapse:collapse; }
    .scenario-table th, .scenario-table td { padding:2.5mm 2.3mm; border-bottom:1px solid #eef2f7; text-align:right; font-size:8.7pt; }
    .scenario-table th { background:#172033; color:#fff; font-weight:800; }
    .scenario-table th:first-child, .scenario-table td:first-child { text-align:left; width:32%; }
    .scenario-table tr:last-child td { border-bottom:0; }
    .benchmark-grid { display:grid; grid-template-columns:1fr 1fr; gap:4mm; }
    .benchmark-card { padding:4mm; border:1px solid #e2e8f0; border-radius:3.5mm; }
    .benchmark-topline { display:flex; justify-content:space-between; gap:3mm; align-items:start; }
    .benchmark-company { color:#64748b; font-size:7.8pt; text-align:right; }
    .benchmark-card h3 { margin:1.4mm 0 2.5mm; font-size:12pt; }
    .benchmark-meta { display:grid; grid-template-columns:1.5fr .75fr .9fr; gap:2mm; padding:2.5mm 0; border-top:1px solid #eef2f7; border-bottom:1px solid #eef2f7; font-size:7.6pt; }
    .benchmark-card p { margin:2.5mm 0 0; color:#475569; font-size:8.5pt; }
    .risk-box { padding:5mm; border:1px solid #e2e8f0; border-radius:4mm; background:#f8fafc; }
    .exit-box { margin-top:5mm; padding:5mm; border:1px solid #fde68a; border-radius:4mm; background:#fffbeb; }
    .footer {
      position:absolute;
      left:15mm;
      right:15mm;
      bottom:7mm;
      display:flex;
      justify-content:space-between;
      gap:8mm;
      padding-top:2.5mm;
      border-top:1px solid #e2e8f0;
      color:#94a3b8;
      font-size:7.5pt;
    }
    .avoid-break { break-inside: avoid; page-break-inside: avoid; }
    h1,h2,h3 { break-after: avoid; page-break-after: avoid; }
    p { orphans:3; widows:3; }
    @media print {
      html, body { background:#fff; }
      .toolbar { display:none !important; }
      .report { width:auto; margin:0; box-shadow:none; }
      .sheet { min-height:0; padding:0; }
      .cover { min-height:267mm; padding:8mm 3mm 4mm; }
      .page-head { margin-top:0; }
      .footer { left:0; right:0; bottom:-8mm; }
    }
    @media screen and (max-width: 900px) {
      .report { width:100%; margin:0; }
      .sheet, .cover { min-height:auto; padding:24px; }
      .metrics, .finance-hero, .product-grid, .benchmark-grid, .two-col, .notes-grid { grid-template-columns:1fr; }
      .cover-bottom, .cover-stat-grid { grid-template-columns:1fr; }
      .footer { position:static; margin-top:24px; }
    }
  </style>
</head>
<body>
  <div class="toolbar">
    <button class="secondary" onclick="history.back()">Torna al dossier</button>
    <button class="primary" onclick="window.print()">Stampa / Salva PDF</button>
  </div>

  <main class="report">
    <section class="cover">
      <img class="logo" src="https://4bid.it/logo.png" alt="4BID" />
      <div class="cover-kicker">Dossier Banca & Investitori · Business Plan 2027–2031</div>
      <h1>4BID S.r.l. — dalla tecnologia proprietaria alla scala SaaS</h1>
      <div class="cover-subtitle">Dossier economico-finanziario, competitivo e strategico a supporto della fase di scale-up.</div>
      <div class="cover-summary">${nl(plan.executive_summary)}</div>
      <div class="cover-bottom">
        <div class="cover-stat-grid">
          <div class="cover-stat"><span>Finanziamento richiesto</span><b>${funding ? esc(euro(funding.amount || 0)) : "—"}</b></div>
          <div class="cover-stat"><span>Asset / piattaforme</span><b>${esc(data.products?.length || 0)}</b></div>
          <div class="cover-stat"><span>Ricavi 2031 realistico</span><b>${realistic?.revenue?.[4] != null ? `${esc(realistic.revenue[4])} k€` : "—"}</b></div>
        </div>
        <div class="confidential">
          Documento riservato<br/>
          Accesso: ${esc(session.visitorName)}${session.visitorCompany ? `<br/>${esc(session.visitorCompany)}` : ""}<br/>
          ${esc(reportDate)}
        </div>
      </div>
    </section>

    <section class="sheet">
      <div class="page-head"><img src="https://4bid.it/logo.png" alt="4BID"/><div class="right">Dossier Banca & Investitori<br/>${esc(reportDate)}</div></div>
      <h2 class="section-title">Sintesi bancaria e struttura finanziaria</h2>
      <p class="lead">I principali indicatori economici e le condizioni illustrative del finanziamento richiesto.</p>
      ${financeHero}
      <div class="metrics">${snapshotCards}</div>
      <div class="two-col">
        <div class="text-block avoid-break"><h3>Business model</h3><p>${nl(plan.business_model)}</p></div>
        <div class="text-block avoid-break"><h3>Posizionamento e mercato</h3><p>${nl(plan.market_analysis)}</p></div>
      </div>
      <div class="footer"><span>4BID S.r.l. · Documento riservato</span><span>Business Plan 2027–2031</span></div>
    </section>

    <section class="sheet">
      <div class="page-head"><img src="https://4bid.it/logo.png" alt="4BID"/><div class="right">Portafoglio prodotti<br/>${esc(reportDate)}</div></div>
      <h2 class="section-title">Piattaforme e asset digitali proprietari</h2>
      <p class="lead">Il core hospitality e gli asset di diversificazione concorrono alla crescita ricorrente e al cross-selling.</p>
      <div class="product-grid">${productCards}</div>
      ${pricingNotes ? `<h2 class="section-title" style="font-size:15pt">Note di pricing</h2>${pricingNotes}` : ""}
      <div class="footer"><span>4BID S.r.l. · Documento riservato</span><span>Portafoglio prodotti</span></div>
    </section>

    <section class="sheet">
      <div class="page-head"><img src="https://4bid.it/logo.png" alt="4BID"/><div class="right">Scenari economici<br/>2027–2031</div></div>
      <h2 class="section-title">Scenari gestionali</h2>
      <p class="lead">I valori sono espressi in migliaia di euro dove indicato. Le proiezioni sono scenari gestionali e non garanzie di risultato.</p>
      ${scenarioBlocks}
      <div class="two-col" style="margin-top:6mm">
        <div class="text-block avoid-break"><h3>Strategia di scale-up</h3><p>${nl(plan.marketing_strategy)}</p></div>
        <div class="text-block avoid-break"><h3>Solidità e capacità di rimborso</h3><p>${nl(plan.management_team)}</p></div>
      </div>
      <div class="footer"><span>4BID S.r.l. · Documento riservato</span><span>Scenari 2027–2031</span></div>
    </section>

    <section class="sheet">
      <div class="page-head"><img src="https://4bid.it/logo.png" alt="4BID"/><div class="right">Benchmark competitivo<br/>Analisi interna 4BID</div></div>
      <h2 class="section-title">Competitor e posizionamento</h2>
      <p class="lead">Valutazioni 0–5 elaborate internamente da 4BID. Prezzi indicativi e soggetti alle condizioni commerciali dei rispettivi vendor.</p>
      <div class="benchmark-grid">${benchmarkCards}</div>
      <div class="footer"><span>4BID S.r.l. · Documento riservato</span><span>Benchmark competitivo</span></div>
    </section>

    <section class="sheet">
      <div class="page-head"><img src="https://4bid.it/logo.png" alt="4BID"/><div class="right">Rischi, mitigazioni e opzione strategica</div></div>
      <h2 class="section-title">Rischi e mitigazioni</h2>
      <div class="risk-box">${nl(plan.risk_analysis)}</div>
      ${data.exit ? `<h2 class="section-title">Opzione strategica di exit</h2><div class="exit-box">${nl(data.exit)}</div>` : ""}
      <div style="margin-top:12mm;color:#64748b;font-size:8.5pt;line-height:1.6">
        Il presente documento è destinato esclusivamente ai soggetti autorizzati. Le previsioni rappresentano scenari gestionali elaborati sulla base delle informazioni disponibili e non costituiscono garanzia di risultati futuri né valutazione indipendente d'impresa.
      </div>
      <div class="footer"><span>4BID S.r.l. · Documento riservato</span><span>Fine dossier</span></div>
    </section>
  </main>
</body>
</html>`

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex, nofollow, noarchive",
    },
  })
}
