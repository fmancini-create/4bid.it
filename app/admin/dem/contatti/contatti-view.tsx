"use client"

import { useState, useEffect } from "react"
import useSWR from "swr"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Users,
  MapPin,
  Phone,
  Download,
  Star,
  Globe,
} from "lucide-react"

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

interface ApiResponse {
  rows: HotelContact[]
  total: number
  totalAll: number
  stats: {
    withName: number
    withoutName: number
    withRegione: number
    withCitta: number
    withTelefono: number
    withIndirizzo: number
  }
  regioni: string[]
  page: number
  pageSize: number
  totalPages: number
}

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error("Errore caricamento contatti")
    return r.json() as Promise<ApiResponse>
  })

function formatNumber(n: number) {
  return new Intl.NumberFormat("it-IT").format(n)
}

const ALL_REGIONS = "__all__"

export default function ContattiView() {
  const [search, setSearch] = useState("")
  const [debounced, setDebounced] = useState("")
  const [regione, setRegione] = useState<string>(ALL_REGIONS)
  const [page, setPage] = useState(1)
  const [expanded, setExpanded] = useState<string | null>(null)
  const pageSize = 50

  useEffect(() => {
    const t = setTimeout(() => {
      setDebounced(search)
      setPage(1)
    }, 350)
    return () => clearTimeout(t)
  }, [search])

  const regioneParam = regione === ALL_REGIONS ? "" : regione
  const key = `/api/dem/hotels?q=${encodeURIComponent(debounced)}&regione=${encodeURIComponent(
    regioneParam
  )}&page=${page}&pageSize=${pageSize}`
  const { data, error, isLoading } = useSWR(key, fetcher, { keepPreviousData: true })

  const totalPages = data?.totalPages ?? 1
  const startIdx = data ? (data.page - 1) * data.pageSize : 0

  const stats = data?.stats

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              href="/admin/dem"
              className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Torna alle campagne
            </Link>
            <h1 className="text-2xl font-bold text-balance">Contatti Hotel</h1>
            <p className="text-sm text-muted-foreground">
              Lista unificata e arricchita con i dati disponibili dalle fonti (regione, citta&apos;,
              indirizzo, telefono, stelle, referente).
            </p>
          </div>
          <Button asChild variant="outline" size="sm">
            <a href="/dem/hotels-italia.csv" download>
              <Download className="mr-2 h-4 w-4" />
              Scarica CSV
            </a>
          </Button>
        </div>

        {/* Stats */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <StatCard icon={<Users className="h-4 w-4" />} label="Contatti totali" value={data ? data.totalAll : null} />
          <StatCard
            icon={<MapPin className="h-4 w-4" />}
            label="Con regione"
            value={stats ? stats.withRegione : null}
            total={data?.totalAll}
          />
          <StatCard
            icon={<MapPin className="h-4 w-4" />}
            label="Con citta'"
            value={stats ? stats.withCitta : null}
            total={data?.totalAll}
          />
          <StatCard
            icon={<Phone className="h-4 w-4" />}
            label="Con telefono"
            value={stats ? stats.withTelefono : null}
            total={data?.totalAll}
          />
          <StatCard
            icon={<MapPin className="h-4 w-4" />}
            label="Con indirizzo"
            value={stats ? stats.withIndirizzo : null}
            total={data?.totalAll}
          />
        </div>

        {/* Filters */}
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Cerca per email, struttura o citta'…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select
            value={regione}
            onValueChange={(v) => {
              setRegione(v)
              setPage(1)
            }}
          >
            <SelectTrigger className="w-full sm:w-56">
              <SelectValue placeholder="Tutte le regioni" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_REGIONS}>Tutte le regioni</SelectItem>
              {data?.regioni.map((r) => (
                <SelectItem key={r} value={r}>
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {data && (
            <Badge variant="secondary" className="whitespace-nowrap">
              {formatNumber(data.total)} risultati
            </Badge>
          )}
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            {error ? (
              <div className="p-8 text-center text-destructive">
                Errore nel caricamento dei contatti. Riprova.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Struttura</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Localita&apos;</TableHead>
                      <TableHead>Regione</TableHead>
                      <TableHead>Telefono</TableHead>
                      <TableHead className="text-center">Stelle</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading && !data ? (
                      <TableRow>
                        <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                          Caricamento…
                        </TableCell>
                      </TableRow>
                    ) : data && data.rows.length > 0 ? (
                      data.rows.map((r, i) => {
                        const isOpen = expanded === r.email
                        const localita = [r.citta, r.provincia ? `(${r.provincia})` : ""]
                          .filter(Boolean)
                          .join(" ")
                        return (
                          <>
                            <TableRow
                              key={r.email}
                              className="cursor-pointer"
                              onClick={() => setExpanded(isOpen ? null : r.email)}
                            >
                              <TableCell className="text-xs text-muted-foreground">
                                {formatNumber(startIdx + i + 1)}
                              </TableCell>
                              <TableCell className="font-medium">
                                {r.nome_azienda || <span className="italic opacity-50">—</span>}
                              </TableCell>
                              <TableCell className="text-muted-foreground">{r.email}</TableCell>
                              <TableCell className="text-muted-foreground">
                                {localita || <span className="opacity-40">—</span>}
                              </TableCell>
                              <TableCell>
                                {r.regione ? (
                                  <Badge variant="outline" className="font-normal">
                                    {r.regione}
                                  </Badge>
                                ) : (
                                  <span className="opacity-40">—</span>
                                )}
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {r.telefono || <span className="opacity-40">—</span>}
                              </TableCell>
                              <TableCell className="text-center">
                                {r.stelle ? (
                                  <span className="inline-flex items-center gap-0.5 text-amber-500">
                                    {r.stelle}
                                    <Star className="h-3 w-3 fill-current" />
                                  </span>
                                ) : (
                                  <span className="opacity-40">—</span>
                                )}
                              </TableCell>
                            </TableRow>
                            {isOpen && (
                              <TableRow key={r.email + "-detail"} className="bg-muted/40">
                                <TableCell />
                                <TableCell colSpan={6} className="text-sm">
                                  <div className="grid grid-cols-1 gap-x-8 gap-y-1 py-1 sm:grid-cols-2">
                                    <Detail label="Indirizzo">
                                      {[r.indirizzo, r.cap].filter(Boolean).join(" - ")}
                                    </Detail>
                                    <Detail label="Referente">
                                      {[r.referente_nome, r.referente_cognome].filter(Boolean).join(" ")}
                                    </Detail>
                                    <Detail label="Categoria">{r.categoria}</Detail>
                                    <Detail label="Sito">
                                      {r.sito ? (
                                        <a
                                          href={r.sito.startsWith("http") ? r.sito : `https://${r.sito}`}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="inline-flex items-center gap-1 text-primary hover:underline"
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          <Globe className="h-3 w-3" />
                                          {r.sito}
                                        </a>
                                      ) : null}
                                    </Detail>
                                  </div>
                                </TableCell>
                              </TableRow>
                            )}
                          </>
                        )
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                          Nessun contatto trovato.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {data && data.total > 0 && (
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Pagina {formatNumber(data.page)} di {formatNumber(totalPages)}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={data.page <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Precedente
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={data.page >= totalPages}
              >
                Successiva
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  total,
}: {
  icon: React.ReactNode
  label: string
  value: number | null
  total?: number
}) {
  const pct = value != null && total ? Math.round((value / total) * 100) : null
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          {icon}
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xl font-bold">{value != null ? formatNumber(value) : "—"}</p>
        {pct != null && <p className="text-xs text-muted-foreground">{pct}%</p>}
      </CardContent>
    </Card>
  )
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  const empty =
    children == null ||
    children === "" ||
    (Array.isArray(children) && children.length === 0)
  return (
    <div className="flex gap-2">
      <span className="min-w-20 font-medium text-muted-foreground">{label}:</span>
      <span>{empty ? <span className="opacity-40">—</span> : children}</span>
    </div>
  )
}
