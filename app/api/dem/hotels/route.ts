import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import fs from "fs"
import path from "path"

const SUPER_ADMIN_EMAIL = "f.mancini@4bid.it"
const CSV_PATH = path.join(process.cwd(), "public", "dem", "hotels-italia.csv")

interface HotelContact {
  email: string
  nome: string
  cognome: string
  nome_azienda: string
}

// Module-scoped cache so we don't re-parse the 1.3MB CSV on every request
let cache: { mtimeMs: number; rows: HotelContact[]; withName: number } | null = null

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

function loadContacts(): { rows: HotelContact[]; withName: number } {
  const stat = fs.statSync(CSV_PATH)
  if (cache && cache.mtimeMs === stat.mtimeMs) {
    return { rows: cache.rows, withName: cache.withName }
  }

  const content = fs.readFileSync(CSV_PATH, "utf8")
  const lines = content.split(/\r?\n/)
  const rows: HotelContact[] = []
  let withName = 0
  // skip header (line 0)
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]
    if (!line.trim()) continue
    const cols = parseCsvLine(line)
    const email = (cols[0] || "").trim()
    if (!email) continue
    const nome = (cols[1] || "").trim()
    const cognome = (cols[2] || "").trim()
    const nome_azienda = (cols[3] || "").trim()
    if (nome_azienda) withName++
    rows.push({ email, nome, cognome, nome_azienda })
  }

  cache = { mtimeMs: stat.mtimeMs, rows, withName }
  return { rows, withName }
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
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1)
    const pageSize = Math.min(200, Math.max(10, parseInt(searchParams.get("pageSize") || "50", 10) || 50))

    const { rows, withName } = loadContacts()

    const filtered = q
      ? rows.filter(
          (r) => r.email.toLowerCase().includes(q) || r.nome_azienda.toLowerCase().includes(q)
        )
      : rows

    const total = filtered.length
    const totalPages = Math.max(1, Math.ceil(total / pageSize))
    const safePage = Math.min(page, totalPages)
    const start = (safePage - 1) * pageSize
    const pageRows = filtered.slice(start, start + pageSize)

    return NextResponse.json({
      rows: pageRows,
      total,
      totalAll: rows.length,
      withName,
      withoutName: rows.length - withName,
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
