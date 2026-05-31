"use client"

import { useState, useEffect } from "react"
import useSWR from "swr"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Search, ChevronLeft, ChevronRight, ArrowLeft, Users, Building2, Download } from "lucide-react"

interface HotelContact {
  email: string
  nome: string
  cognome: string
  nome_azienda: string
}

interface ApiResponse {
  rows: HotelContact[]
  total: number
  totalAll: number
  withName: number
  withoutName: number
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

export default function ContattiView() {
  const [search, setSearch] = useState("")
  const [debounced, setDebounced] = useState("")
  const [page, setPage] = useState(1)
  const pageSize = 50

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => {
      setDebounced(search)
      setPage(1)
    }, 350)
    return () => clearTimeout(t)
  }, [search])

  const key = `/api/dem/hotels?q=${encodeURIComponent(debounced)}&page=${page}&pageSize=${pageSize}`
  const { data, error, isLoading } = useSWR(key, fetcher, { keepPreviousData: true })

  const totalPages = data?.totalPages ?? 1
  const startIdx = data ? (data.page - 1) * data.pageSize : 0

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-8">
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
              Anteprima della lista unificata e deduplicata (non ancora importata in una campagna).
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
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Users className="h-4 w-4" />
                Contatti totali
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{data ? formatNumber(data.totalAll) : "—"}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Building2 className="h-4 w-4" />
                Con nome struttura
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{data ? formatNumber(data.withName) : "—"}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Building2 className="h-4 w-4" />
                Senza nome (saluto generico)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{data ? formatNumber(data.withoutName) : "—"}</p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="mb-4 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Cerca per email o nome struttura…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          {debounced && data && (
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
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Struttura</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading && !data ? (
                    <TableRow>
                      <TableCell colSpan={3} className="py-10 text-center text-muted-foreground">
                        Caricamento…
                      </TableCell>
                    </TableRow>
                  ) : data && data.rows.length > 0 ? (
                    data.rows.map((r, i) => (
                      <TableRow key={r.email}>
                        <TableCell className="text-xs text-muted-foreground">
                          {formatNumber(startIdx + i + 1)}
                        </TableCell>
                        <TableCell className="font-medium">{r.email}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {r.nome_azienda || <span className="italic opacity-60">—</span>}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} className="py-10 text-center text-muted-foreground">
                        Nessun contatto trovato.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
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
