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
        console.log("[v0] Error checking admin status:", error)
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
      console.log("[v0] Error setting up auth listener:", error)
    }
  }, [])

  const handleLogout = async () => {
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
      setIsAdmin(false)
      router.push("/")
    } catch (error) {
      console.log("[v0] Error during logout:", error)
    }
  }

  const navItems = [
    { label: "HOME", href: "#home" },
    { label: "DOVE INTERVENIAMO", href: "#services" },
    { label: "PORFOLIO", href: "#portfolio" },
    { label: "REVENUE MANAGEMENT", href: "#revenue" },
    { label: "PROGETTI IN SVILUPPO", href: "#projects" },
    { label: "APP SVILUPPATE", href: "#apps" },
    { label: "PROPONI LA TUA IDEA", href: "/proponi-idea" },
    { label: "CONTATTACI", href: "#contact" },
  ]

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <Image src="/logo.png" alt="4bid Logo" width={80} height={50} className="h-12 w-auto" priority />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="text-sm font-medium text-gray-600 hover:text-[#5B9BD5] transition-colors border-b-2 border-transparent hover:border-[#F4B942] pb-1"
              >
                {item.label}
              </Link>
            ))}
            {isAdmin ? (
              <>
                <Link href="/admin">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-[#5B9BD5] text-[#5B9BD5] hover:bg-[#5B9BD5] hover:text-white transition-colors bg-transparent"
                  >
                    <Lock className="h-4 w-4 mr-2" />
                    Admin
                  </Button>
                </Link>
                <Button variant="ghost" size="sm" onClick={handleLogout} className="text-gray-600 hover:text-[#5B9BD5]">
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </>
            ) : (
              <Link href="/admin/login">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-[#5B9BD5] text-[#5B9BD5] hover:bg-[#5B9BD5] hover:text-white transition-colors bg-transparent"
                >
                  <Lock className="h-4 w-4 mr-2" />
                  Area Riservata
                </Button>
              </Link>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <nav className="lg:hidden py-4 border-t">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="block py-3 text-sm font-medium text-gray-600 hover:text-[#5B9BD5] transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            {isAdmin ? (
              <>
                <Link href="/admin" className="block py-3" onClick={() => setIsMenuOpen(false)}>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full border-[#5B9BD5] text-[#5B9BD5] hover:bg-[#5B9BD5] hover:text-white bg-transparent"
                  >
                    <Lock className="h-4 w-4 mr-2" />
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
            ) : (
              <Link href="/admin/login" className="block py-3" onClick={() => setIsMenuOpen(false)}>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full border-[#5B9BD5] text-[#5B9BD5] hover:bg-[#5B9BD5] hover:text-white bg-transparent"
                >
                  <Lock className="h-4 w-4 mr-2" />
                  Area Riservata
                </Button>
              </Link>
            )}
          </nav>
        )}
      </div>
    </header>
  )
}

export default Header
