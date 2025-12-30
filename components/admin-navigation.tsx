"use client"

import { useState } from "react"
import { Home, MessageSquare, FolderKanban, Users, TrendingUp, Menu, X, BookOpen, Share2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface AdminNavigationProps {
  userEmail: string
}

export default function AdminNavigation({ userEmail }: AdminNavigationProps) {
  const [isOpen, setIsOpen] = useState(false)

  const sections = [
    { id: "landing-pages", label: "Landing Pages", icon: TrendingUp },
    { id: "investor-inquiries", label: "Investitori", icon: Users },
    { id: "project-submissions", label: "Progetti", icon: FolderKanban },
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
      <Button
        variant="outline"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-3 left-3 z-50 h-9 w-9 bg-background shadow-md"
      >
        {isOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
      </Button>

      <aside
        className={`fixed top-0 left-0 h-screen bg-card border-r border-border w-64 p-4 sm:p-6 space-y-4 sm:space-y-6 transition-transform z-40 overflow-y-auto ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="space-y-2 pt-12 lg:pt-0">
          <div className="flex items-center gap-2">
            <Home className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            <h1 className="text-lg sm:text-xl font-bold">Admin</h1>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground truncate">{userEmail}</p>
        </div>

        <nav className="space-y-1 sm:space-y-2">
          {sections.map((section) => {
            const Icon = section.icon
            return (
              <button
                key={section.id}
                onClick={() => scrollToSection(section.id)}
                className="w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg hover:bg-muted transition-colors text-left"
              >
                <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-primary shrink-0" />
                <span className="font-medium text-sm sm:text-base">{section.label}</span>
              </button>
            )
          })}

          <a
            href="/admin/chat-conversations"
            className="w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg hover:bg-muted transition-colors text-left"
          >
            <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 text-primary shrink-0" />
            <span className="font-medium text-sm sm:text-base">Chat AI</span>
          </a>

          <a
            href="/admin/knowledge-base"
            className="w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg hover:bg-muted transition-colors text-left"
          >
            <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-primary shrink-0" />
            <span className="font-medium text-sm sm:text-base">Knowledge Base</span>
          </a>

          <a
            href="/admin/social-media"
            className="w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg hover:bg-muted transition-colors text-left"
          >
            <Share2 className="h-4 w-4 sm:h-5 sm:w-5 text-primary shrink-0" />
            <span className="font-medium text-sm sm:text-base">Social Media</span>
          </a>
        </nav>

        <div className="pt-4 border-t border-border">
          <Button asChild variant="outline" className="w-full bg-transparent text-sm">
            <a href="/">Torna al Sito</a>
          </Button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isOpen && <div className="lg:hidden fixed inset-0 bg-black/50 z-30" onClick={() => setIsOpen(false)} />}
    </>
  )
}
