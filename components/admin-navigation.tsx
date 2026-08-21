"use client"

import { useState, useEffect } from "react"
import {
  Home,
  MessageSquare,
  FolderKanban,
  Users,
  TrendingUp,
  Menu,
  X,
  BookOpen,
  Share2,
  FileSpreadsheet,
  Bike,
  Mail,
  CalendarDays,
  Printer,
  Video,
  Newspaper,
  Search,
  FileText,
  Lock,
  Inbox,
  Briefcase,
  Table2,
  Hotel,
  ServerCog,
  Activity,
} from "lucide-react"
import { Button } from "@/components/ui/button"

interface AdminNavigationProps {
  userEmail: string
  /** Pending Project Room access requests, shown as a badge. */
  pendingProjectRoom?: number
}

export default function AdminNavigation({ userEmail, pendingProjectRoom = 0 }: AdminNavigationProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [pendingPress, setPendingPress] = useState(0)
  const [pendingApplications, setPendingApplications] = useState(0)

  useEffect(() => {
    let active = true
    fetch("/api/admin/press-mentions?count=1")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (active && d && typeof d.pending === "number") setPendingPress(d.pending)
      })
      .catch(() => {})
    // Unhandled applications ("nuova") shown as a red dot on Candidature so a new
    // arrival is visible even if the notification email is filtered or delayed.
    fetch("/api/admin/job-applications?count=1")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (active && d && typeof d.pending === "number") setPendingApplications(d.pending)
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [])

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
    // Labelled "Progetti" until now, which collided with the Project Room: this
    // section only lists forms submitted from the public site, so anyone looking
    // for the client area clicked here and found the wrong thing.
    { id: "project-submissions", label: "Richieste dal Sito", icon: FolderKanban },
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

          {/* Pending access requests were only visible inside the Project Room
              panel, so they went unread. The count travels with the navigation. */}
          <button
            onClick={() => scrollToSection("project-room")}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-muted active:bg-muted/80 transition-colors text-left touch-manipulation"
          >
            <Inbox className="h-5 w-5 text-primary shrink-0" />
            <span className="font-medium text-sm sm:text-base">Project Room</span>
            {pendingProjectRoom > 0 && (
              <span className="ml-auto shrink-0 rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">
                {pendingProjectRoom}
              </span>
            )}
          </button>

          {/* The Project Room had no entry anywhere in this sidebar, so once inside
              the back office there was no way to reach the client area at all. */}
          <a
            href="/area-riservata/progetti"
            className="w-full flex items-center gap-3 px-3 py-3 rounded-lg bg-primary/5 hover:bg-primary/10 active:bg-primary/15 transition-colors text-left touch-manipulation"
          >
            <Lock className="h-5 w-5 text-primary shrink-0" />
            <span className="font-semibold text-sm sm:text-base">Project Room clienti</span>
          </a>

          <a
            href="/admin/control-center"
            className="w-full flex items-center gap-3 px-3 py-3 rounded-lg bg-primary/5 hover:bg-primary/10 active:bg-primary/15 transition-colors text-left touch-manipulation"
          >
            <Activity className="h-5 w-5 text-primary shrink-0" />
            <span className="font-semibold text-sm sm:text-base">Control Center</span>
          </a>

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

          <a
            href="/admin/seo"
            className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-muted active:bg-muted/80 transition-colors text-left touch-manipulation"
          >
            <Search className="h-5 w-5 text-primary shrink-0" />
            <span className="font-medium text-sm sm:text-base">Monitor SEO</span>
          </a>

          <a
            href="/admin/business-plan"
            className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-muted active:bg-muted/80 transition-colors text-left touch-manipulation"
          >
            <FileSpreadsheet className="h-5 w-5 text-primary shrink-0" />
            <span className="font-medium text-sm sm:text-base">Business Plan</span>
          </a>

          <a
            href="/admin/quotes"
            className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-muted active:bg-muted/80 transition-colors text-left touch-manipulation"
          >
            <FileText className="h-5 w-5 text-primary shrink-0" />
            <span className="font-medium text-sm sm:text-base">Preventivi</span>
          </a>

          <a
            href="/admin/quotes/comparison"
            className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-muted active:bg-muted/80 transition-colors text-left touch-manipulation"
          >
            <Table2 className="h-5 w-5 text-primary shrink-0" />
            <span className="font-medium text-sm sm:text-base">Tabelle comparative</span>
          </a>

          <a
            href="/admin/candidature"
            className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-muted active:bg-muted/80 transition-colors text-left touch-manipulation"
          >
            <Briefcase className="h-5 w-5 text-primary shrink-0" />
            <span className="font-medium text-sm sm:text-base">Candidature</span>
            {pendingApplications > 0 && (
              <span
                className="ml-auto inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-red-600 text-white text-xs font-bold"
                aria-label={`${pendingApplications} nuove candidature`}
              >
                {pendingApplications}
              </span>
            )}
          </a>

          <a
            href="/admin/scidoo-clienti"
            className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-muted active:bg-muted/80 transition-colors text-left touch-manipulation"
          >
            <Hotel className="h-5 w-5 text-primary shrink-0" />
            <span className="font-medium text-sm sm:text-base">Clienti Scidoo</span>
          </a>

          <a
            href="/admin/slope-clienti"
            className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-muted active:bg-muted/80 transition-colors text-left touch-manipulation"
          >
            <Hotel className="h-5 w-5 text-primary shrink-0" />
            <span className="font-medium text-sm sm:text-base">Clienti Slope</span>
          </a>

          <a
            href="/admin/censimento-strutture"
            className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-muted active:bg-muted/80 transition-colors text-left touch-manipulation"
          >
            <ServerCog className="h-5 w-5 text-primary shrink-0" />
            <span className="font-medium text-sm sm:text-base">Censimento Gestionali</span>
          </a>

          <a
            href="/admin/dem"
            className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-muted active:bg-muted/80 transition-colors text-left touch-manipulation"
          >
            <Mail className="h-5 w-5 text-primary shrink-0" />
            <span className="font-medium text-sm sm:text-base">DEM</span>
          </a>

          <a
            href="/admin/eventi"
            className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-muted active:bg-muted/80 transition-colors text-left touch-manipulation"
          >
            <CalendarDays className="h-5 w-5 text-primary shrink-0" />
            <span className="font-medium text-sm sm:text-base">Eventi</span>
          </a>

          <a
            href="/admin/parlano-di-noi"
            className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-muted active:bg-muted/80 transition-colors text-left touch-manipulation"
          >
            <Newspaper className="h-5 w-5 text-primary shrink-0" />
            <span className="font-medium text-sm sm:text-base">Parlano di noi</span>
            {pendingPress > 0 && (
              <span
                className="ml-auto inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-red-600 text-white text-xs font-bold"
                aria-label={`${pendingPress} notizie in attesa`}
              >
                {pendingPress}
              </span>
            )}
          </a>

          <a
            href="/admin/video"
            className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-muted active:bg-muted/80 transition-colors text-left touch-manipulation"
          >
            <Video className="h-5 w-5 text-primary shrink-0" />
            <span className="font-medium text-sm sm:text-base">Video guide</span>
          </a>

          <a
            href="/admin/ecomobility"
            className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-muted active:bg-muted/80 transition-colors text-left touch-manipulation"
          >
            <Bike className="h-5 w-5 text-primary shrink-0" />
            <span className="font-medium text-sm sm:text-base">Ecomobility</span>
          </a>

          <div className="h-px bg-border my-2" />

          <a
            href="/volantino"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-muted active:bg-muted/80 transition-colors text-left touch-manipulation"
          >
            <Printer className="h-5 w-5 text-primary shrink-0" />
            <span className="font-medium text-sm sm:text-base">Volantino A5</span>
          </a>

          <a
            href="/volantino-2"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-muted active:bg-muted/80 transition-colors text-left touch-manipulation"
          >
            <Printer className="h-5 w-5 text-primary shrink-0" />
            <span className="font-medium text-sm sm:text-base">Volantino A5 v2 Tech</span>
          </a>

          <a
            href="/volantino-3"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-muted active:bg-muted/80 transition-colors text-left touch-manipulation"
          >
            <Printer className="h-5 w-5 text-primary shrink-0" />
            <span className="font-medium text-sm sm:text-base">Volantino A5 v3 Editoriale</span>
          </a>

          <a
            href="/sfondo-call"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-muted active:bg-muted/80 transition-colors text-left touch-manipulation"
          >
            <Video className="h-5 w-5 text-primary shrink-0" />
            <span className="font-medium text-sm sm:text-base">Sfondo Videocall</span>
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
