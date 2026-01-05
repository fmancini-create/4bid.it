"use client"

import { useState, useEffect } from "react"
import { Home, MessageSquare, FolderKanban, Users, TrendingUp, Menu, X, BookOpen, Share2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface AdminNavigationProps {
  userEmail: string
}

export default function AdminNavigation({ userEmail }: AdminNavigationProps) {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false)
    }
    document.addEventListener("keydown", handleEscape)
    return () => document.removeEventListener("keydown", handleEscape)
  }, [])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [isOpen])

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
        className="lg:hidden fixed top-2 left-2 z-50 h-10 w-10 bg-background shadow-lg border-2"
        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      <aside
        className={`fixed top-0 left-0 h-screen bg-card border-r border-border w-64 p-4 sm:p-6 space-y-4 sm:space-y-6 transition-transform z-40 overflow-y-auto ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
        style={{
          paddingTop: "calc(env(safe-area-inset-top, 0px) + 3.5rem)",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
      >
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Home className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            <h1 className="text-lg sm:text-xl font-bold">Admin</h1>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground truncate">{userEmail}</p>
        </div>

        <nav className="space-y-1">
          {sections.map((section) => {
            const Icon = section.icon
            return (
              <button
                key={section.id}
                onClick={() => scrollToSection(section.id)}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-muted active:bg-muted/80 transition-colors text-left touch-manipulation"
              >
                <Icon className="h-5 w-5 text-primary shrink-0" />
                <span className="font-medium text-sm sm:text-base">{section.label}</span>
              </button>
            )
          })}

          <div className="h-px bg-border my-2" />

          <a
            href="/admin/chat-conversations"
            className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-muted active:bg-muted/80 transition-colors text-left touch-manipulation"
          >
            <MessageSquare className="h-5 w-5 text-primary shrink-0" />
            <span className="font-medium text-sm sm:text-base">Chat AI</span>
          </a>

          <a
            href="/admin/knowledge-base"
            className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-muted active:bg-muted/80 transition-colors text-left touch-manipulation"
          >
            <BookOpen className="h-5 w-5 text-primary shrink-0" />
            <span className="font-medium text-sm sm:text-base">Knowledge Base</span>
          </a>

          <a
            href="/admin/social-media"
            className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-muted active:bg-muted/80 transition-colors text-left touch-manipulation"
          >
            <Share2 className="h-5 w-5 text-primary shrink-0" />
            <span className="font-medium text-sm sm:text-base">Social Media</span>
          </a>
        </nav>

        <div className="pt-4 border-t border-border">
          <Button asChild variant="outline" className="w-full bg-transparent text-sm touch-manipulation">
            <a href="/">Torna al Sito</a>
          </Button>
        </div>
      </aside>

      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 z-30 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
          onTouchEnd={() => setIsOpen(false)}
        />
      )}
    </>
  )
}
