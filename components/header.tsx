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

  const navItems = [
    { label: "HOME", href: "/" },
    { label: "DOVE INTERVENIAMO", href: "/#services" },
    { label: "PROBLEMI E SOLUZIONI", href: "/problemi-hotel-soluzioni" },
    { label: "PORTFOLIO", href: "/#portfolio" },
    { label: "REVENUE MANAGEMENT", href: "/soluzioni-revenue-management" },
    { label: "BLOG", href: "/blog" },
    { label: "VIDEO GUIDE", href: "/video-guide" },
    { label: "PARLANO DI NOI", href: "/parlano-di-noi" },
    { label: "CHI SIAMO", href: "/#about" },
    { label: "PROGETTI IN SVILUPPO", href: "/#projects" },
    { label: "APP SVILUPPATE", href: "/#app" },
    { label: "PROPONI LA TUA IDEA", href: "/proponi-idea" },
    { label: "LAVORA CON NOI", href: "/lavora-con-noi" },
    { label: "PRENOTA DEMO", href: "/prenota-demo" },
    { label: "CONTATTACI", href: "/#contact" },
  ]

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

          {/* Desktop Navigation
              Measured: this row needs ~1466px to fit 12 links plus the button. It
              used to switch on at lg (1024px), so between 1024px and ~1490px the
              nav overflowed and pushed "Area Riservata" clean off the right edge —
              invisible and unclickable at ordinary laptop widths. Switch to the
              full nav only once there is genuinely room; below that the burger
              menu already exposes every entry.

              Misurato a 1536px (container pieno a 2xl): con gap-8 la riga
              chiedeva 1524px per i soli link, contro 1456px disponibili una
              volta tolto il logo — 68px di troppo già prima di aggiungere
              "PROBLEMI E SOLUZIONI", ed è il motivo per cui etichette come
              "PROGETTI IN SVILUPPO" andavano a capo su tre righe. I 15 gap da
              32px valevano 480px: portarli a 20px libera 300px, che coprono la
              voce nuova e restituiscono margine (gap-4 lascia respiro anche al
              logo a piena dimensione). */}
          <nav className="hidden 2xl:flex items-center gap-4 ml-6">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                title={item.label}
                className="text-sm font-medium text-gray-600 hover:text-[#5B9BD5] transition-colors border-b-2 border-transparent hover:border-[#F4B942] pb-1"
              >
                {item.label}
              </Link>
            ))}
            {/* Two separate areas exist — the client Project Room and the internal
                back office — and only a label distinguished them, so a single
                button named "Area Riservata" could not serve both: clients read
                it as their documents, we read it as the back office. Worse, the
                /admin entry rendered only when isAdmin was already true, so the
                door was visible exclusively to whoever had already walked through
                it. Both destinations are now named explicitly and always
                reachable. A dropdown keeps them within the width of one button:
                this row already needs ~1466px of the 1536px available at 2xl. */}
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
            className="2xl:hidden"
            aria-label={isMenuOpen ? "Chiudi il menu di navigazione" : "Apri il menu di navigazione"}
            aria-expanded={isMenuOpen}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <nav className="2xl:hidden py-4 border-t max-h-[calc(100vh-5rem)] overflow-y-auto">
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
