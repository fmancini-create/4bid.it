/**
 * TEMPORANEO - solo lettura. Separa contatti reali da dati di prova e verifica
 * la sovrapposizione con la lista DEM di 4bid. Nessuna scrittura.
 */
import { createClient } from "@supabase/supabase-js"

const mask = (e: string) => {
  const [u, d] = e.split("@")
  return (u?.slice(0, 2) ?? "") + "***@" + (d ?? "?")
}
const PROVA = /test|prova|example|fittizi|demo|pippo|pluto|paperino|hotelbid\.org|santaddeo\.com|noreply|no-reply/i

async function main() {
  const sant = createClient(process.env.SANTADDEO_SUPABASE_URL!, process.env.SANTADDEO_SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  })
  const bid = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  })

  type C = { email: string; nome: string; azienda: string; tipo: string; motivo?: string }
  const buoni: C[] = []
  const scartati: C[] = []

  const { data: hotels } = await sant
    .from("hotels")
    .select("name,city,contact_email,is_active,deleted_at")
  for (const h of hotels ?? []) {
    const e = (h.contact_email ?? "").trim().toLowerCase()
    if (!e.includes("@")) continue
    const c: C = { email: e, nome: "", azienda: h.name ?? "", tipo: "cliente" }
    if (!h.is_active || h.deleted_at) { scartati.push({ ...c, motivo: "struttura non attiva" }); continue }
    if (PROVA.test(e) || PROVA.test(h.name ?? "")) { scartati.push({ ...c, motivo: "dato di prova" }); continue }
    buoni.push(c)
  }

  const { data: profs } = await sant.from("profiles").select("email,first_name,last_name,role,job_title")
  for (const p of profs ?? []) {
    const e = (p.email ?? "").trim().toLowerCase()
    if (!e.includes("@")) continue
    const nome = ((p.first_name ?? "") + " " + (p.last_name ?? "")).trim()
    // property_admin = referente di una struttura cliente; sales_agent = collaboratore
    const tipo = p.role === "sales_agent" ? "collaboratore" : p.role === "property_admin" ? "cliente" : "interno"
    const c: C = { email: e, nome, azienda: p.job_title ?? "", tipo }
    if (PROVA.test(e) || PROVA.test(nome)) { scartati.push({ ...c, motivo: "dato di prova" }); continue }
    if (p.role === "super_admin") { scartati.push({ ...c, motivo: "utenza interna" }); continue }
    buoni.push(c)
  }

  // deduplica per email
  const perEmail = new Map<string, C>()
  for (const c of buoni) {
    const p = perEmail.get(c.email)
    if (!p) perEmail.set(c.email, c)
    else if (!p.nome && c.nome) perEmail.set(c.email, { ...c, azienda: c.azienda || p.azienda })
  }
  const unici = [...perEmail.values()]

  console.log("  === CANDIDATI REALI ===")
  console.log("  grezzi: " + buoni.length + "  ->  unici: " + unici.length + "  (scartati: " + scartati.length + ")")
  for (const t of ["cliente", "collaboratore", "interno"]) {
    const g = unici.filter((c) => c.tipo === t)
    if (!g.length) continue
    console.log("\n  " + t.toUpperCase() + ": " + g.length)
    for (const c of g) console.log("     " + mask(c.email).padEnd(30) + (c.nome || c.azienda).slice(0, 34))
  }
  console.log("\n  === SCARTATI ===")
  for (const c of scartati) console.log("     " + mask(c.email).padEnd(30) + c.motivo)

  // sovrapposizione con la lista DEM esistente e con i disiscritti
  const emails = unici.map((c) => c.email)
  const { data: giaPresenti } = await bid.from("dem_contacts").select("email,tipo_contatto").in("email", emails)
  const { data: disiscritti } = await bid.from("dem_unsubscribes").select("email").in("email", emails)
  console.log("\n  === CONFRONTO CON LA LISTA DEM DI 4BID ===")
  console.log("  gia' presenti: " + (giaPresenti ?? []).length)
  for (const g of giaPresenti ?? []) console.log("     " + mask(g.email).padEnd(30) + "tipo attuale: " + g.tipo_contatto)
  console.log("  disiscritti (da NON reinserire): " + (disiscritti ?? []).length)
  for (const d of disiscritti ?? []) console.log("     " + mask(d.email))
  console.log("\n  da aggiungere davvero: " + (unici.length - (giaPresenti ?? []).length - (disiscritti ?? []).length))
}
main()
