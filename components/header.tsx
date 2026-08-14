"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Menu, X, Lock, LogOut, ChevronDown, FolderOpen, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const supabase = createClient()
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (user) {
          setIsAdmin(user.email === "f.mancini@4bid.it")
        }
      } catch (error) {
        // Silently fail
        // Silently fail - user is not admin
        setIsAdmin(false)
      }
    }

    checkAdmin()

    // Listen for auth state changes
    try {
      const supabase = createClient()
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(() => {
        checkAdmin()
      })

      return () => subscription.unsubscribe()
    } catch (error) {
      // Silently fail
    }
  }, [])

  const handleLogout = async () => {
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
      setIsAdmin(false)
      router.push("/")
    } catch (error) {
      // Silently fail
    }
  }

  /* Misurato a 1600px: per stare su una riga sola le 15 voci piatte chiedevano
     2170px contro i 1536 disponibili, quindi 11 etichette su 15 si spezzavano su
     2-3 righe ("PROGETTI IN SVILUPPO" su tre). Nessun gap o dimensione di font
     recupera 634px: la riga va accorciata raggruppando. Qui restano 7 elementi
     in orizzontale (3 link diretti + 4 tendine); il menu a scomparsa continua a
     mostrare tutte le voci in elenco piatto, dove lo spazio verticale non è
     scarso. */
  const navGroups: { label: string; href?: string; items?: { label: string; href: string }[] }[] = [
    { label: "HOME", href: "/" },
    {
      label: "SOLUZIONI",
      items: [
        { label: "Dove interveniamo", href: "/#services" },
        { label: "Problemi e Soluzioni", href: "/problemi-hotel-soluzioni" },
        { label: "Revenue Management", href: "/soluzioni-revenue-management" },
      ],
    },
    {
      label: "PROGETTI",
      items: [
        { label: "Portfolio", href: "/#portfolio" },
        { label: "Progetti in sviluppo", href: "/#projects" },
        { label: "App sviluppate", href: "/#app" },
      ],
    },
    {
      label: "RISORSE",
      items: [
        { label: "Blog", href: "/blog" },
        { label: "Video guide", href: "/video-guide" },
      ],
    },
    {
      label: "AZIENDA",
      items: [
        { label: "Chi siamo", href: "/#about" },
        { label: "Parlano di noi", href: "/parlano-di-noi" },
        { label: "Lavora con noi", href: "/lavora-con-noi" },
        { label: "Proponi la tua idea", href: "/proponi-idea" },
      ],
    },
    { label: "PRENOTA DEMO", href: "/prenota-demo" },
    { label: "CONTATTACI", href: "/#contact" },
  ]

  /* Il menu a scomparsa mostra le stesse destinazioni in elenco piatto: derivarlo
     dai gruppi evita che un domani una voce esista in una sola delle due liste. */
  const navItems = navGroups.flatMap((group) =>
    group.items ? group.items.map((item) => ({ label: item.label.toUpperCase(), href: item.href })) : [group as { label: string; href: string }],
  )

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          {/* shrink-0: senza questo il logo è la prima vittima di una riga di
              navigazione troppo larga. Misurato a 1600px, veniva compresso da
              80px a 36px (e in precedenza fin quasi a zero) invece di forzare le
              etichette ad andare a capo. Con lo spazio garantito serve però un
              tetto all'altezza: lo style inline "height: auto" faceva assumere
              al file la sua dimensione naturale (129×80px), che riempiva per
              intero la barra da h-20 sbordando oltre il fondo. h-12 w-auto
              tiene il rapporto e lo riporta a ~77px di base. */}
          <Link href="/" className="flex shrink-0 items-center" title="4bid - Home">
            {/* L'altezza sta nello style inline, non in una classe: Next legge lo
                style dell'elemento per il controllo sulle proporzioni e con le
                sole utility Tailwind avvisava a ogni render che una sola delle
                due dimensioni era stata modificata. */}
            <Image
              src="/logo.png"
              alt="4bid Logo"
              width={80}
              height={50}
              style={{ height: "3rem", width: "auto" }}
              priority
            />
          </Link>

          {/* Navigazione desktop.
              Storia delle misure di questa riga, perché è già stata sbagliata due
              volte: con le 15 voci piatte serviva molto più spazio di quanto ce ne
              fosse (2170px richiesti contro 1536), e il flex non taglia il testo —
              lo manda a capo, quindi il difetto si vedeva come etichette su due o
              tre righe invece che come sforamento. Prima ancora la soglia era lg
              (1024px) e "Area Riservata" finiva fuori dal bordo destro.
              Con 7 elementi la riga chiede ~700px: whitespace-nowrap impedisce
              qualsiasi ritorno a capo e la soglia può scendere a xl (1280px),
              dove lo spazio è ampio. Sotto quella soglia vale il menu a
              scomparsa, che elenca tutte le voci. Se si aggiungono elementi qui,
              rimisurare: nowrap trasforma un eccesso di larghezza in sforamento
              silenzioso a destra. */}
          <nav className="hidden xl:flex items-center gap-5 ml-8">
            {navGroups.map((group) =>
              group.items ? (
                <DropdownMenu key={group.label}>
                  <DropdownMenuTrigger className="flex items-center gap-1 whitespace-nowrap border-b-2 border-transparent pb-1 text-sm font-medium text-gray-600 transition-colors hover:border-[#F4B942] hover:text-[#5B9BD5] data-[state=open]:text-[#5B9BD5]">
                    {group.label}
                    <ChevronDown className="h-3.5 w-3.5" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-56">
                    {group.items.map((item) => (
                      <DropdownMenuItem key={item.href} asChild>
                        <Link href={item.href} className="cursor-pointer">
                          {item.label}
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link
                  key={group.label}
                  href={group.href!}
                  title={group.label}
                  className="whitespace-nowrap text-sm font-medium text-gray-600 hover:text-[#5B9BD5] transition-colors border-b-2 border-transparent hover:border-[#F4B942] pb-1"
                >
                  {group.label}
                </Link>
              ),
            )}
            {/* Two separate areas exist — the client Project Room and the internal
                back office — and only a label distinguished them, so a single
                button named "Area Riservata" could not serve both: clients read
                it as their documents, we read it as the back office. Worse, the
                /admin entry rendered only when isAdmin was already true, so the
                door was visible exclusively to whoever had already walked through
                it. Both destinations are now named explicitly and always
                reachable. A dropdown keeps them within the width of one button,
                which is what lets this row stay on a single line. */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-[#5B9BD5] text-[#5B9BD5] hover:bg-[#5B9BD5] hover:text-white transition-colors bg-transparent"
                >
                  <Lock className="h-4 w-4 mr-2" />
                  Accedi
                  <ChevronDown className="h-4 w-4 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72">
                <DropdownMenuLabel>Aree riservate</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/area-riservata" className="flex-col items-start gap-0.5 cursor-pointer">
                    <span className="flex items-center gap-2 font-medium">
                      <FolderOpen className="h-4 w-4" />
                      Project Room
                    </span>
                    <span className="pl-6 text-xs text-muted-foreground">Documenti e revisioni clienti</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/admin" className="flex-col items-start gap-0.5 cursor-pointer">
                    <span className="flex items-center gap-2 font-medium">
                      <Settings className="h-4 w-4" />
                      Pannello Admin
                    </span>
                    <span className="pl-6 text-xs text-muted-foreground">Gestione sito e piattaforma</span>
                  </Link>
                </DropdownMenuItem>
                {isAdmin && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                      <LogOut className="h-4 w-4 mr-2" />
                      Esci
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="xl:hidden"
            aria-label={isMenuOpen ? "Chiudi il menu di navigazione" : "Apri il menu di navigazione"}
            aria-expanded={isMenuOpen}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <nav className="xl:hidden py-4 border-t max-h-[calc(100vh-5rem)] overflow-y-auto">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                title={item.label}
                className="block py-3 text-sm font-medium text-gray-600 hover:text-[#5B9BD5] transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            {/* Vertical space is not scarce here, so both areas get their own
                entry rather than hiding behind a dropdown. */}
            <p className="pt-4 pb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">Aree riservate</p>
            <Link href="/area-riservata" className="block py-2" onClick={() => setIsMenuOpen(false)}>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start border-[#5B9BD5] text-[#5B9BD5] hover:bg-[#5B9BD5] hover:text-white bg-transparent"
              >
                <FolderOpen className="h-4 w-4 mr-2" />
                Project Room
                <span className="ml-auto text-xs opacity-70">Clienti</span>
              </Button>
            </Link>
            <Link href="/admin" className="block py-2" onClick={() => setIsMenuOpen(false)}>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start border-gray-300 text-gray-600 hover:bg-gray-100 bg-transparent"
              >
                <Settings className="h-4 w-4 mr-2" />
                Pannello Admin
                <span className="ml-auto text-xs opacity-70">4BID</span>
              </Button>
            </Link>
            {isAdmin && (
              <div className="block py-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    handleLogout()
                    setIsMenuOpen(false)
                  }}
                  className="w-full justify-start text-gray-600 hover:text-[#5B9BD5]"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Esci
                </Button>
              </div>
            )}
          </nav>
        )}
      </div>
    </header>
  )
}

export default Header
