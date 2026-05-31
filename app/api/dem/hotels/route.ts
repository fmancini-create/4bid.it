import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import fs from "fs"
import path from "path"

const SUPER_ADMIN_EMAIL = "f.mancini@4bid.it"
const CSV_PATH = path.join(process.cwd(), "public", "dem", "hotels-italia.csv")

interface HotelContact {
  email: string
  nome_azienda: string
  referente_nome: string
  referente_cognome: string
  stelle: string
  categoria: string
  indirizzo: string
  cap: string
  citta: string
  provincia: string
  regione: string
  telefono: string
  sito: string
}

interface Stats {
  withName: number
  withRegione: number
  withCitta: number
  withTelefono: number
  withIndirizzo: number
}

let cache: { mtimeMs: number; rows: HotelContact[]; stats: Stats; regioni: string[] } | null = null

function parseCsvLine(line: string): string[] {
  const out: string[] = []
  let cur = ""
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        cur += ch
      }
    } else if (ch === '"') {
      inQuotes = true
    } else if (ch === ",") {
      out.push(cur)
      cur = ""
    } else {
      cur += ch
    }
  }
  out.push(cur)
  return out
}

function loadContacts(): { rows: HotelContact[]; stats: Stats; regioni: string[] } {
  const stat = fs.statSync(CSV_PATH)
  if (cache && cache.mtimeMs === stat.mtimeMs) {
    return { rows: cache.rows, stats: cache.stats, regioni: cache.regioni }
  }

  const content = fs.readFileSync(CSV_PATH, "utf8")
  const lines = content.split(/\r?\n/)
  const rows: HotelContact[] = []
  const stats: Stats = { withName: 0, withRegione: 0, withCitta: 0, withTelefono: 0, withIndirizzo: 0 }
  const regioniSet = new Set<string>()

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]
    if (!line.trim()) continue
    const c = parseCsvLine(line)
    const email = (c[0] || "").trim()
    if (!email) continue
    const row: HotelContact = {
      email,
      nome_azienda: (c[1] || "").trim(),
      referente_nome: (c[2] || "").trim(),
      referente_cognome: (c[3] || "").trim(),
      stelle: (c[4] || "").trim(),
      categoria: (c[5] || "").trim(),
      indirizzo: (c[6] || "").trim(),
      cap: (c[7] || "").trim(),
      citta: (c[8] || "").trim(),
      provincia: (c[9] || "").trim(),
      regione: (c[10] || "").trim(),
      telefono: (c[11] || "").trim(),
      sito: (c[12] || "").trim(),
    }
    if (row.nome_azienda) stats.withName++
    if (row.regione) {
      stats.withRegione++
      regioniSet.add(row.regione)
    }
    if (row.citta) stats.withCitta++
    if (row.telefono) stats.withTelefono++
    if (row.indirizzo) stats.withIndirizzo++
    rows.push(row)
  }

  const regioni = Array.from(regioniSet).sort((a, b) => a.localeCompare(b, "it"))
  cache = { mtimeMs: stat.mtimeMs, rows, stats, regioni }
  return { rows, stats, regioni }
}

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || user.email !== SUPER_ADMIN_EMAIL) {
    return NextResponse.json({ error: "Accesso negato" }, { status: 403 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const q = (searchParams.get("q") || "").trim().toLowerCase()
    const regione = (searchParams.get("regione") || "").trim()
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1)
    const pageSize = Math.min(200, Math.max(10, parseInt(searchParams.get("pageSize") || "50", 10) || 50))

    const { rows, stats, regioni } = loadContacts()

    let filtered = rows
    if (regione) filtered = filtered.filter((r) => r.regione === regione)
    if (q) {
      filtered = filtered.filter(
        (r) =>
          r.email.toLowerCase().includes(q) ||
          r.nome_azienda.toLowerCase().includes(q) ||
          r.citta.toLowerCase().includes(q)
      )
    }

    const total = filtered.length
    const totalPages = Math.max(1, Math.ceil(total / pageSize))
    const safePage = Math.min(page, totalPages)
    const start = (safePage - 1) * pageSize
    const pageRows = filtered.slice(start, start + pageSize)

    return NextResponse.json({
      rows: pageRows,
      total,
      totalAll: rows.length,
      stats: {
        withName: stats.withName,
        withoutName: rows.length - stats.withName,
        withRegione: stats.withRegione,
        withCitta: stats.withCitta,
        withTelefono: stats.withTelefono,
        withIndirizzo: stats.withIndirizzo,
      },
      regioni,
      page: safePage,
      pageSize,
      totalPages,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Errore lettura lista" },
      { status: 500 }
    )
  }
}
