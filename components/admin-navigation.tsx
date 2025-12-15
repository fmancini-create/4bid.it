"use client"

import { useState } from "react"
import { Home, MessageSquare, FolderKanban, Users, TrendingUp, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface AdminNavigationProps {
  userEmail: string
}

export default function AdminNavigation({ userEmail }: AdminNavigationProps) {
  const [isOpen, setIsOpen] = useState(false)

  const sections = [
    { id: "landing-pages", label: "Landing Pages", icon: TrendingUp },
    { id: "investor-inquiries", label: "Richieste Investitori", icon: Users },
    { id: "project-submissions", label: "Proposte Progetti", icon: FolderKanban },
    { id: "contacts", label: "Contatti", icon: MessageSquare },
  ]

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" })
      setIsOpen(false)
    }
  }

  return (
    <>
      {/* Mobile Toggle */}
      <div className="lg:hidden fixed top-4 right-4 z-50">
        <Button variant="outline" size="icon" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Sidebar Navigation */}
      <aside
        className={`fixed top-0 left-0 h-screen bg-card border-r border-border w-64 p-6 space-y-6 transition-transform z-40 ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Home className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">Admin Dashboard</h1>
          </div>
          <p className="text-sm text-muted-foreground">{userEmail}</p>
        </div>

        <nav className="space-y-2">
          {sections.map((section) => {
            const Icon = section.icon
            return (
              <button
                key={section.id}
                onClick={() => scrollToSection(section.id)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors text-left"
              >
                <Icon className="h-5 w-5 text-primary" />
                <span className="font-medium">{section.label}</span>
              </button>
            )
          })}
        </nav>

        <div className="pt-4 border-t border-border">
          <Button asChild variant="outline" className="w-full bg-transparent">
            <a href="/">Torna al Sito</a>
          </Button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isOpen && <div className="lg:hidden fixed inset-0 bg-black/50 z-30" onClick={() => setIsOpen(false)} />}
    </>
  )
}
