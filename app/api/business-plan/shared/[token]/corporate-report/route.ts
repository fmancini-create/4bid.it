import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server-admin"
import { getBusinessPlanShareSession } from "@/lib/business-plan-share-session"

type CorporateData = {
  funding?: { amount?: number; graceMonths?: number; amortizationMonths?: number; illustrativeRate?: number; annualDebtService?: number }
  snapshot?: Array<{ label?: string; value?: string }>
  products?: Array<{ name?: string; area?: string; tagline?: string; description?: string; pricing?: string }>
  scenarios?: Array<{ name?: string; accounts?: number[]; revenue?: number[]; recurring?: number[]; ebitda?: number[]; margin?: number[] }>
  benchmark?: Array<{ suite?: string; competitor?: string; company?: string; price?: string; functionality?: number; priceCompetitiveness?: number; comment?: string }>
  pricingNotes?: string[]
  exit?: string
}

const esc = (value: unknown) => String(value ?? "")
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;")

const nl = (value: unknown) => esc(value).replaceAll("\n", "<br/>")
const euro = (value: number) => new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(value || 0)

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
  if (share.expires_at && new Date(share.expires_at) < new Date()) return NextResponse.json({ error: "Link scaduto" }, { status: 410 })

  const { data: plan, error: planError } = await supabase.from("business_plans").select("*").eq("id", share.business_plan_id).single()
  if (planError || !plan || plan.project_type !== "corporate_saas") return NextResponse.json({ error: "Dossier non disponibile" }, { status: 404 })

  let data: CorporateData = {}
  try { data = JSON.parse(plan.description || "{}") } catch { data = {} }

  await supabase.from("business_plan_share_events").insert({
    share_id: share.id,
    business_plan_id: share.business_plan_id,
    event_type: "corporate_report_opened",
    recipient_email: session.visitorEmail,
    metadata: { visitor_name: session.visitorName, visitor_company: session.visitorCompany || null },
  })

  const years = [2027, 2028, 2029, 2030, 2031]
  const scenarioRows = (data.scenarios || []).map((scenario) => `
    <tr class="group"><td colspan="6">${esc(scenario.name)}</td></tr>
    <tr><td>Ricavi (k€)</td>${(scenario.revenue || []).map((v) => `<td class="n">${esc(v)}</td>`).join("")}</tr>
    <tr><td>EBITDA (k€)</td>${(scenario.ebitda || []).map((v) => `<td class="n">${esc(v)}</td>`).join("")}</tr>
    <tr><td>Account/property</td>${(scenario.accounts || []).map((v) => `<td class="n">${esc(v)}</td>`).join("")}</tr>
    <tr><td>Ricavi ricorrenti</td>${(scenario.recurring || []).map((v) => `<td class="n">${esc(v)}%</td>`).join("")}</tr>`).join("")

  const productCards = (data.products || []).map((product) => `<div class="card"><h3>${esc(product.name)}</h3><div class="muted">${esc(product.area)}</div><p><b>${esc(product.tagline)}</b></p><p>${esc(product.description)}</p><div class="pill">${esc(product.pricing)}</div></div>`).join("")

  const benchmarkRows = (data.benchmark || []).map((row) => `<tr><td>${esc(row.suite)}</td><td><b>${esc(row.competitor)}</b></td><td>${esc(row.company)}</td><td>${esc(row.price)}</td><td class="n">${esc(row.functionality)}/5</td><td class="n">${esc(row.priceCompetitiveness)}/5</td><td>${esc(row.comment)}</td></tr>`).join("")
  const funding = data.funding
  const date = new Date().toLocaleDateString("it-IT")

  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${esc(plan.name)}</title><style>
    @page{size:A4;margin:16mm}*{box-sizing:border-box}body{font-family:Arial,sans-serif;color:#172033;margin:0;line-height:1.45;font-size:10.5pt}header{display:flex;justify-content:space-between;align-items:center;border-bottom:3px solid #f59e0b;padding-bottom:12px;margin-bottom:24px}header img{height:34px}.muted{color:#64748b}.cover{min-height:245mm;display:flex;flex-direction:column;justify-content:center;page-break-after:always}.cover h1{font-size:30pt;margin:8px 0}.cover h2{color:#d97706;font-size:17pt;font-weight:500}.grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}.kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:18px 0}.kpi,.card{border:1px solid #e2e8f0;border-radius:10px;padding:14px}.kpi b{display:block;font-size:16pt;margin-top:4px}.card{break-inside:avoid}.card h3{margin:0;color:#d97706}.pill{display:inline-block;background:#fff7ed;border:1px solid #fed7aa;padding:5px 9px;border-radius:999px;font-size:9pt}h2{font-size:17pt;color:#d97706;border-bottom:1px solid #fed7aa;padding-bottom:6px;margin-top:28px}h3{font-size:12pt}table{width:100%;border-collapse:collapse;margin:12px 0;font-size:8.5pt}th{background:#172033;color:#fff;text-align:left;padding:7px}td{border-bottom:1px solid #e2e8f0;padding:6px;vertical-align:top}.n{text-align:right;white-space:nowrap}.group td{background:#fff7ed;font-weight:bold;color:#9a5b08}.page{page-break-before:always}.note{background:#f8fafc;border-left:4px solid #f59e0b;padding:12px;margin:14px 0}.footer{margin-top:24px;padding-top:8px;border-top:1px solid #e2e8f0;color:#64748b;font-size:8pt}@media print{a{color:inherit;text-decoration:none}}
  </style></head><body>
    <section class="cover"><img src="https://4bid.it/logo.png" alt="4BID" style="width:150px"><h1>Business Plan 2027–2031</h1><h2>4BID S.r.l. a Socio Unico</h2><p>${nl(plan.executive_summary)}</p><div class="note">Documento riservato. Accesso identificato: ${esc(session.visitorName)}${session.visitorCompany ? ` — ${esc(session.visitorCompany)}` : ""}. Generato il ${esc(date)}.</div></section>
    <header><img src="https://4bid.it/logo.png" alt="4BID"><div class="muted">Dossier economico-finanziario · ${esc(date)}</div></header>
    <h2>Sintesi e struttura finanziaria</h2>
    <div class="kpis">${(data.snapshot || []).slice(0,8).map((item) => `<div class="kpi"><span class="muted">${esc(item.label)}</span><b>${esc(item.value)}</b></div>`).join("")}</div>
    ${funding ? `<div class="note"><b>Finanziamento richiesto:</b> ${esc(euro(funding.amount || 0))} · ${esc(funding.graceMonths)} mesi di preammortamento · ${esc(funding.amortizationMonths)} mesi di ammortamento · tasso illustrativo ${esc(funding.illustrativeRate)}% · debt service annuo circa ${esc(euro(funding.annualDebtService || 0))}.</div>` : ""}
    <h2>Business model</h2><p>${nl(plan.business_model)}</p><h2>Posizionamento e mercato</h2><p>${nl(plan.market_analysis)}</p>
    <section class="page"><header><img src="https://4bid.it/logo.png" alt="4BID"><div class="muted">Prodotti e pricing</div></header><h2>Le piattaforme proprietarie</h2><div class="grid">${productCards}</div>${data.pricingNotes?.length ? `<h2>Calibrazione listini</h2>${data.pricingNotes.map((n) => `<div class="note">${esc(n)}</div>`).join("")}` : ""}</section>
    <section class="page"><header><img src="https://4bid.it/logo.png" alt="4BID"><div class="muted">Scenari 2027–2031</div></header><h2>Tre scenari gestionali</h2><table><thead><tr><th>Scenario / KPI</th>${years.map((year) => `<th class="n">${year}</th>`).join("")}</tr></thead><tbody>${scenarioRows}</tbody></table><h2>Strategia di scale-up</h2><p>${nl(plan.marketing_strategy)}</p><h2>Solidità e capacità di rimborso</h2><p>${nl(plan.management_team)}</p></section>
    <section class="page"><header><img src="https://4bid.it/logo.png" alt="4BID"><div class="muted">Benchmark competitivo</div></header><h2>Competitor, produttori e posizionamento</h2><p class="muted">Punteggi 0–5: valutazione analitica interna 4BID, non recensioni utenti. Prezzi indicativi e soggetti alle condizioni dei vendor.</p><table><thead><tr><th>Area</th><th>Prodotto</th><th>Azienda</th><th>Prezzo</th><th>Funz.</th><th>Prezzo</th><th>Commento 4BID</th></tr></thead><tbody>${benchmarkRows}</tbody></table></section>
    <section class="page"><header><img src="https://4bid.it/logo.png" alt="4BID"><div class="muted">Rischi e opzione strategica</div></header><h2>Rischi e mitigazioni</h2><p>${nl(plan.risk_analysis)}</p>${data.exit ? `<h2>Opzione di exit</h2><div class="note">${esc(data.exit)}</div>` : ""}<div class="footer">4BID S.r.l. · Documento riservato · Le proiezioni non costituiscono garanzia di risultati futuri.</div></section>
  </body></html>`

  return new NextResponse(html, { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "private, no-store", "X-Robots-Tag": "noindex, nofollow, noarchive" } })
}
