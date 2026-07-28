"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Menu, X, Lock, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
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
    { label: "PORTFOLIO", href: "/#portfolio" },
    { label: "REVENUE MANAGEMENT", href: "/soluzioni-revenue-management" },
    { label: "BLOG", href: "/blog" },
    { label: "PARLANO DI NOI", href: "/parlano-di-noi" },
    { label: "CHI SIAMO", href: "/#about" },
    { label: "PROGETTI IN SVILUPPO", href: "/#projects" },
    { label: "APP SVILUPPATE", href: "/#app" },
    { label: "PROPONI LA TUA IDEA", href: "/proponi-idea" },
    { label: "PRENOTA DEMO", href: "/prenota-demo" },
    { label: "CONTATTACI", href: "/#contact" },
  ]

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center" title="4bid - Home">
            <Image src="/logo.png" alt="4bid Logo" width={80} height={50} style={{ width: 'auto', height: 'auto' }} priority />
          </Link>

          {/* Desktop Navigation
              Measured: this row needs ~1466px to fit 12 links plus the button. It
              used to switch on at lg (1024px), so between 1024px and ~1490px the
              nav overflowed and pushed "Area Riservata" clean off the right edge —
              invisible and unclickable at ordinary laptop widths. Switch to the
              full nav only once there is genuinely room; below that the burger
              menu already exposes every entry. */}
          <nav className="hidden 2xl:flex items-center gap-8">
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
            {/* "Area Riservata" must lead to the client Project Room, which is what
                that name refers to. It used to point at /admin/login, the internal
                back office restricted to a single address, so clients following it
                could never reach their documents. /area-riservata routes by itself:
                projects when signed in, login otherwise. */}
            <Link href="/area-riservata">
              <Button
                variant="outline"
                size="sm"
                className="border-[#5B9BD5] text-[#5B9BD5] hover:bg-[#5B9BD5] hover:text-white transition-colors bg-transparent"
              >
                <Lock className="h-4 w-4 mr-2" />
                Area Riservata
              </Button>
            </Link>
            {isAdmin && (
              <>
                <Link href="/admin">
                  <Button variant="ghost" size="sm" className="text-gray-600 hover:text-[#5B9BD5]">
                    Admin
                  </Button>
                </Link>
                <Button variant="ghost" size="sm" onClick={handleLogout} className="text-gray-600 hover:text-[#5B9BD5]">
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </>
            )}
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
            <Link href="/area-riservata" className="block py-3" onClick={() => setIsMenuOpen(false)}>
              <Button
                variant="outline"
                size="sm"
                className="w-full border-[#5B9BD5] text-[#5B9BD5] hover:bg-[#5B9BD5] hover:text-white bg-transparent"
              >
                <Lock className="h-4 w-4 mr-2" />
                Area Riservata
              </Button>
            </Link>
            {isAdmin && (
              <>
                <Link href="/admin" className="block py-3" onClick={() => setIsMenuOpen(false)}>
                  <Button variant="ghost" size="sm" className="w-full text-gray-600 hover:text-[#5B9BD5]">
                    Admin
                  </Button>
                </Link>
                <div className="block py-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      handleLogout()
                      setIsMenuOpen(false)
                    }}
                    className="w-full text-gray-600 hover:text-[#5B9BD5]"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </Button>
                </div>
              </>
            )}
          </nav>
        )}
      </div>
    </header>
  )
}

export default Header
