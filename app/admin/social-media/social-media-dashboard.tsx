"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Facebook,
  Instagram,
  Linkedin,
  Plus,
  Sparkles,
  Calendar,
  Check,
  Clock,
  Send,
  Settings,
  RefreshCw,
  Edit2,
  Trash2,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  ImageIcon,
  Loader2,
  Pencil,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"

interface SocialAccount {
  id: string
  platform: "facebook" | "instagram" | "linkedin"
  account_name: string
  account_id: string | null
  is_active: boolean
  created_at: string
  page_id?: string | null // Added page_id
}

interface SocialPost {
  id: string
  content: string
  image_url: string | null
  post_type: string
  hashtags: string[] | null
  scheduled_for: string | null
  published_at: string | null
  status: "draft" | "pending_approval" | "approved" | "scheduled" | "published" | "failed"
  is_ai_generated: boolean
  ai_topic: string | null
  platforms: string[]
  auto_publish: boolean
  requires_approval: boolean
  error_message: string | null
  created_at: string
  target_accounts?: string[] // Added target_accounts
}

interface SocialSettings {
  id: string
  posting_frequency_days: number
  auto_generate_enabled: boolean
  topics: string[]
  tone: string
  include_hashtags: boolean
  default_hashtags: string[]
  last_auto_generated_at: string | null
}

interface Props {
  initialAccounts?: SocialAccount[]
  initialPosts?: SocialPost[]
  initialSettings?: SocialSettings | null
  userEmail?: string
}

const platformIcons = {
  facebook: Facebook,
  instagram: Instagram,
  linkedin: Linkedin,
}

const platformColors = {
  facebook: "bg-blue-600",
  instagram: "bg-gradient-to-r from-purple-500 to-pink-500",
  linkedin: "bg-blue-700",
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  draft: { label: "Bozza", color: "bg-gray-500", icon: Edit2 },
  pending_approval: { label: "Da approvare", color: "bg-yellow-500", icon: Clock },
  approved: { label: "Approvato", color: "bg-green-500", icon: Check },
  scheduled: { label: "Programmato", color: "bg-blue-500", icon: Calendar },
  published: { label: "Pubblicato", color: "bg-emerald-500", icon: CheckCircle2 },
  failed: { label: "Errore", color: "bg-red-500", icon: AlertCircle },
}

export default function SocialMediaDashboard({
  initialAccounts = [],
  initialPosts = [],
  initialSettings,
  userEmail,
}: Props) {
  const router = useRouter()
  const [accounts, setAccounts] = useState<SocialAccount[]>(initialAccounts)
  const [posts, setPosts] = useState<SocialPost[]>(initialPosts)
  const [settings, setSettings] = useState<SocialSettings | null>(initialSettings)
  const [isGenerating, setIsGenerating] = useState(false)
  const [showConnectDialog, setShowConnectDialog] = useState(false)
  const [showSettingsDialog, setShowSettingsDialog] = useState(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingPost, setEditingPost] = useState<SocialPost | null>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)

  const [showManualConnect, setShowManualConnect] = useState<string | null>(null)
  const [manualPageId, setManualPageId] = useState("")
  const [manualPageName, setManualPageName] = useState("")
  const [manualAccessToken, setManualAccessToken] = useState("")
  const [isSavingManual, setIsSavingManual] = useState(false)

  // New post form state
  const [newPost, setNewPost] = useState({
    content: "",
    platforms: ["facebook", "instagram", "linkedin"] as string[],
    auto_publish: false,
    scheduled_for: "",
    ai_topic: "",
    target_accounts: [] as string[], // Changed to string[] for account IDs
    image_url: "",
    image_topic: "",
    image_style: "professional" as string,
  })

  const [isGeneratingImage, setIsGeneratingImage] = useState(false)

  const generateAIPost = async (topic?: string) => {
    setIsGenerating(true)
    try {
      const response = await fetch("/api/social/generate-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: topic || newPost.ai_topic,
          tone: settings?.tone || "professional",
          includeHashtags: settings?.include_hashtags ?? true,
          defaultHashtags: settings?.default_hashtags || [],
        }),
      })

      if (!response.ok) throw new Error("Errore nella generazione")

      const data = await response.json()
      setNewPost((prev) => ({ ...prev, content: data.content }))
      toast.success("Post generato con AI!")
    } catch (error) {
      toast.error("Errore nella generazione del post")
    } finally {
      setIsGenerating(false)
    }
  }

  const generateAIImage = async () => {
    if (!newPost.image_topic && !newPost.ai_topic) {
      toast.error("Inserisci un argomento per l'immagine")
      return
    }

    setIsGeneratingImage(true)
    try {
      const response = await fetch("/api/social/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: newPost.image_topic || newPost.ai_topic || "hospitality, hotel, revenue management",
          style: newPost.image_style,
        }),
      })

      if (!response.ok) throw new Error("Errore nella generazione")

      const data = await response.json()
      setNewPost((prev) => ({ ...prev, image_url: data.imageUrl }))
      toast.success("Immagine generata con AI!")
    } catch (error) {
      toast.error("Errore nella generazione dell'immagine")
    } finally {
      setIsGeneratingImage(false)
    }
  }

  const savePost = async () => {
    // Simplified savePost to align with the update's DialogFooter
    try {
      if (newPost.platforms.length === 0) {
        toast.error("Seleziona almeno una piattaforma")
        return
      }

      // Determine status based on auto_publish and scheduled_for
      let status: "draft" | "pending_approval" | "scheduled" = "draft"
      if (newPost.auto_publish && newPost.scheduled_for) {
        status = "scheduled"
      } else if (newPost.auto_publish && !newPost.scheduled_for) {
        // If auto_publish is true and no date is set, it should be scheduled for immediate publish or considered draft
        // For simplicity, let's treat it as draft and rely on backend to handle immediate publish if needed
        status = "draft" // Or handle as 'scheduled' for immediate publish
      } else if (!newPost.auto_publish && newPost.scheduled_for) {
        status = "scheduled"
      } else if (!newPost.auto_publish && !newPost.scheduled_for) {
        status = "pending_approval" // Default to pending if not auto-publishing and not scheduled
      }

      // If content is empty, set to draft
      if (!newPost.content) {
        status = "draft"
      }

      const response = await fetch("/api/social/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newPost,
          status,
          is_ai_generated: newPost.content.includes("#") && newPost.ai_topic !== "", // Simplified AI check
          ai_topic: newPost.ai_topic,
          image_url: newPost.image_url || null,
          target_accounts: newPost.target_accounts || [], // Ensure target_accounts is an array
        }),
      })

      if (!response.ok) throw new Error("Errore nel salvataggio")

      const savedPost = await response.json()
      setPosts((prev) => [savedPost, ...prev])
      setShowCreateDialog(false)
      setNewPost({
        content: "",
        platforms: ["facebook", "instagram", "linkedin"],
        auto_publish: false,
        scheduled_for: "",
        ai_topic: "",
        target_accounts: [],
        image_url: "",
        image_topic: "",
        image_style: "professional",
      })
      toast.success("Post salvato!")
      router.refresh()
    } catch (error) {
      console.error("Save post error:", error)
      toast.error("Errore nel salvataggio")
    }
  }

  const updatePost = async () => {
    if (!editingPost) return

    try {
      setIsGenerating(true)
      const response = await fetch("/api/social/posts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingPost.id,
          content: editingPost.content,
          platforms: editingPost.platforms,
          scheduled_for: editingPost.scheduled_for,
          image_url: editingPost.image_url,
          target_accounts: editingPost.target_accounts,
          status: editingPost.status,
        }),
      })

      if (!response.ok) throw new Error("Errore nell'aggiornamento")

      const updatedPost = await response.json()
      setPosts((prev) => prev.map((p) => (p.id === updatedPost.id ? updatedPost : p)))
      setShowEditDialog(false)
      setEditingPost(null)
      toast.success("Post aggiornato!")
      router.refresh()
    } catch (error) {
      toast.error("Errore nell'aggiornamento del post")
    } finally {
      setIsGenerating(false)
    }
  }

  const approvePost = async (postId: string) => {
    try {
      const response = await fetch(`/api/social/posts/${postId}/approve`, {
        method: "POST",
      })

      if (!response.ok) throw new Error("Errore nell'approvazione")

      setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, status: "approved" } : p)))
      toast.success("Post approvato!")
      router.refresh()
    } catch (error) {
      toast.error("Errore nell'approvazione")
    }
  }

  const rejectPost = async (postId: string) => {
    try {
      const response = await fetch(`/api/social/posts/${postId}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Errore nell'eliminazione")

      setPosts((prev) => prev.filter((p) => p.id !== postId))
      toast.success("Post eliminato")
      router.refresh()
    } catch (error) {
      toast.error("Errore nell'eliminazione")
    }
  }

  const publishNow = async (postId: string) => {
    try {
      const response = await fetch(`/api/social/posts/${postId}/publish`, {
        method: "POST",
      })

      if (!response.ok) throw new Error("Errore nella pubblicazione")

      const result = await response.json()
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, status: "published", published_at: new Date().toISOString() } : p)),
      )
      toast.success("Post pubblicato!")
      router.refresh()
    } catch (error) {
      toast.error("Errore nella pubblicazione")
    }
  }

  const saveSettings = async () => {
    try {
      const response = await fetch("/api/social/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      })

      if (!response.ok) throw new Error("Errore nel salvataggio")

      toast.success("Impostazioni salvate!")
      setShowSettingsDialog(false)
    } catch (error) {
      toast.error("Errore nel salvataggio delle impostazioni")
    }
  }

  const saveManualConnection = async (platform: string) => {
    if (!manualPageId || !manualPageName || !manualAccessToken) {
      toast.error("Compila tutti i campi")
      return
    }

    setIsSavingManual(true)
    try {
      const response = await fetch("/api/social/connect/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform,
          pageId: manualPageId,
          pageName: manualPageName,
          accessToken: manualAccessToken,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Errore durante il salvataggio")
      }

      const data = await response.json()
      toast.success(`Account ${platform} collegato con successo!`)

      // Refresh accounts
      setAccounts((prev) => {
        const filtered = prev.filter((a) => a.platform !== platform)
        return [...filtered, data.account]
      })

      setShowManualConnect(null)
      setManualPageId("")
      setManualPageName("")
      setManualAccessToken("")
      setShowConnectDialog(false)
    } catch (error) {
      console.error("Errore:", error)
      toast.error(error instanceof Error ? error.message : "Errore durante il salvataggio")
    } finally {
      setIsSavingManual(false)
    }
  }

  const openEditDialog = (post: SocialPost) => {
    setEditingPost({ ...post })
    setShowEditDialog(true)
  }

  const pendingApproval = posts.filter((p) => p.status === "pending_approval")
  const scheduled = posts.filter((p) => p.status === "scheduled" || p.status === "approved")
  const published = posts.filter((p) => p.status === "published")

  return (
    <div className="min-h-screen bg-background">
      <header
        className="sticky top-0 z-50 bg-background border-b border-border"
        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
      >
        <div className="container mx-auto px-3 sm:px-4 py-2 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Button variant="ghost" size="icon" asChild className="shrink-0 h-9 w-9">
                <a href="/admin">
                  <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                </a>
              </Button>
              <div className="min-w-0">
                <h1 className="text-base sm:text-2xl font-bold truncate">Social Media</h1>
                <p className="text-[10px] sm:text-sm text-muted-foreground truncate hidden sm:block">
                  Gestisci e programma i tuoi post
                </p>
              </div>
            </div>
            <div className="flex gap-1.5 sm:gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSettingsDialog(true)}
                className="h-8 w-8 sm:w-auto px-0 sm:px-3 bg-transparent"
              >
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline ml-2">Impostazioni</span>
              </Button>
              <Button size="sm" onClick={() => setShowCreateDialog(true)} className="h-8 px-2 sm:px-4">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline ml-2">Nuovo Post</span>
                <span className="sm:hidden ml-1 text-xs">Post</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main
        className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 space-y-4 sm:space-y-8"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 1rem)" }}
      >
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
          <Card>
            <CardContent className="p-2.5 sm:pt-6 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] sm:text-sm text-muted-foreground">Da Approvare</p>
                  <p className="text-lg sm:text-3xl font-bold text-yellow-500">{pendingApproval.length}</p>
                </div>
                <Clock className="h-5 w-5 sm:h-8 sm:w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-2.5 sm:pt-6 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] sm:text-sm text-muted-foreground">Programmati</p>
                  <p className="text-lg sm:text-3xl font-bold text-blue-500">{scheduled.length}</p>
                </div>
                <Calendar className="h-5 w-5 sm:h-8 sm:w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-2.5 sm:pt-6 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] sm:text-sm text-muted-foreground">Pubblicati</p>
                  <p className="text-lg sm:text-3xl font-bold text-emerald-500">{published.length}</p>
                </div>
                <CheckCircle2 className="h-5 w-5 sm:h-8 sm:w-8 text-emerald-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-2.5 sm:pt-6 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] sm:text-sm text-muted-foreground">Account</p>
                  <p className="text-lg sm:text-3xl font-bold">{accounts.filter((a) => a.is_active).length}</p>
                </div>
                <div className="flex -space-x-1">
                  {["facebook", "instagram", "linkedin"].map((platform) => {
                    const Icon = platformIcons[platform as keyof typeof platformIcons]
                    const isConnected = accounts.some((a) => a.platform === platform && a.is_active)
                    return (
                      <div
                        key={platform}
                        className={`w-4 h-4 sm:w-6 sm:h-6 rounded-full flex items-center justify-center ${
                          isConnected ? platformColors[platform as keyof typeof platformColors] : "bg-gray-300"
                        }`}
                      >
                        <Icon className="h-2 w-2 sm:h-3 sm:w-3 text-white" />
                      </div>
                    )
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="p-3 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <CardTitle className="text-sm sm:text-lg">Account Collegati</CardTitle>
                <CardDescription className="text-xs sm:text-sm hidden sm:block">
                  Collega i tuoi account per pubblicare
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowConnectDialog(true)}
                className="w-full sm:w-auto h-8 text-xs sm:text-sm"
              >
                <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5" />
                Collega
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
            <div className="flex flex-col gap-2 sm:grid sm:grid-cols-3 sm:gap-4">
              {["facebook", "instagram", "linkedin"].map((platform) => {
                const Icon = platformIcons[platform as keyof typeof platformIcons]
                const platformAccounts = accounts.filter((a) => a.platform === platform)
                const isConnected = platformAccounts.some((a) => a.is_active)
                const displayName =
                  platform === "linkedin" && isConnected
                    ? `${platformAccounts[0]?.account_name || platform} (Pagina)`
                    : platformAccounts[0]?.account_name || platform

                return (
                  <div
                    key={platform}
                    className={`flex items-center justify-between p-2.5 sm:p-4 rounded-lg border ${
                      isConnected ? "border-primary bg-primary/5" : "border-dashed"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className={`w-7 h-7 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0 ${
                          isConnected ? platformColors[platform as keyof typeof platformColors] : "bg-gray-200"
                        }`}
                      >
                        <Icon className={`h-3.5 w-3.5 sm:h-5 sm:w-5 ${isConnected ? "text-white" : "text-gray-500"}`} />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium capitalize text-xs sm:text-base">{platform}</p>
                        <p className="text-[10px] sm:text-sm text-muted-foreground truncate max-w-[100px] sm:max-w-none">
                          {isConnected ? displayName : "Non collegato"}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant={isConnected ? "outline" : "default"}
                      size="sm"
                      onClick={() => {
                        if (platform === "facebook") {
                          window.location.href = "/api/social/connect/facebook"
                        } else if (platform === "linkedin") {
                          window.location.href = "/api/social/connect/linkedin"
                        } else {
                          setShowConnectDialog(true)
                        }
                      }}
                      className="shrink-0 text-[10px] sm:text-sm h-7 sm:h-9 px-2 sm:px-3"
                    >
                      {isConnected ? "Riconn." : "Collega"}
                    </Button>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="w-full grid grid-cols-4 h-9 sm:h-10">
            <TabsTrigger value="pending" className="text-[10px] sm:text-sm py-1.5 px-1">
              Approv.
            </TabsTrigger>
            <TabsTrigger value="scheduled" className="text-[10px] sm:text-sm py-1.5 px-1">
              Progr.
            </TabsTrigger>
            <TabsTrigger value="published" className="text-[10px] sm:text-sm py-1.5 px-1">
              Pubbl.
            </TabsTrigger>
            <TabsTrigger value="all" className="text-[10px] sm:text-sm py-1.5 px-1">
              Tutti
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4 mt-4">
            {pendingApproval.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nessun post in attesa di approvazione</p>
                </CardContent>
              </Card>
            ) : (
              pendingApproval.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onApprove={() => approvePost(post.id)}
                  onReject={() => rejectPost(post.id)}
                  onPublish={() => publishNow(post.id)}
                  onEdit={() => openEditDialog(post)} // Added onEdit
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="scheduled" className="space-y-4 mt-4">
            {scheduled.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nessun post programmato</p>
                </CardContent>
              </Card>
            ) : (
              scheduled.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onPublish={() => publishNow(post.id)}
                  onReject={() => rejectPost(post.id)}
                  onEdit={() => openEditDialog(post)} // Added onEdit
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="published" className="space-y-4 mt-4">
            {published.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nessun post pubblicato</p>
                </CardContent>
              </Card>
            ) : (
              published.map((post) => <PostCard key={post.id} post={post} onEdit={() => openEditDialog(post)} />)
            )}
          </TabsContent>

          <TabsContent value="all" className="space-y-4 mt-4">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onApprove={post.status === "pending_approval" ? () => approvePost(post.id) : undefined}
                onReject={() => rejectPost(post.id)}
                onPublish={["approved", "scheduled"].includes(post.status) ? () => publishNow(post.id) : undefined}
                onEdit={() => openEditDialog(post)} // Added onEdit
              />
            ))}
          </TabsContent>
        </Tabs>
      </main>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[95vh] overflow-y-auto mx-2 sm:mx-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Crea Nuovo Post</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">Scrivi manualmente o genera con AI</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* AI Generation - Mobile optimized */}
            <div className="p-3 sm:p-4 bg-muted rounded-lg space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                <span className="font-medium text-sm sm:text-base">Genera con AI</span>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  placeholder="Argomento..."
                  value={newPost.ai_topic}
                  onChange={(e) => setNewPost((prev) => ({ ...prev, ai_topic: e.target.value }))}
                  className="text-sm"
                />
                <Button onClick={() => generateAIPost()} disabled={isGenerating} className="shrink-0">
                  {isGenerating ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  <span className="sm:hidden ml-2">Genera</span>
                </Button>
              </div>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {["Revenue", "Hotel Accelerator", "Manubot", "Hospitality"].map((topic) => (
                  <Button
                    key={topic}
                    variant="outline"
                    size="sm"
                    onClick={() => generateAIPost(topic)}
                    disabled={isGenerating}
                    className="text-xs sm:text-sm h-7 sm:h-8 px-2 sm:px-3"
                  >
                    {topic}
                  </Button>
                ))}
              </div>
            </div>

            {/* AI Image Generation - Mobile optimized */}
            <div className="p-3 sm:p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30 rounded-lg space-y-3 border border-purple-200 dark:border-purple-800">
              <div className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                <span className="font-medium text-sm sm:text-base">Genera Immagine AI</span>
              </div>
              <div className="flex flex-col gap-2">
                <Input
                  placeholder="Descrivi l'immagine..."
                  value={newPost.image_topic}
                  onChange={(e) => setNewPost((prev) => ({ ...prev, image_topic: e.target.value }))}
                  className="text-sm"
                />
                <div className="flex gap-2">
                  <Select
                    value={newPost.image_style}
                    onValueChange={(value) => setNewPost((prev) => ({ ...prev, image_style: value }))}
                  >
                    <SelectTrigger className="flex-1 text-sm">
                      <SelectValue placeholder="Stile" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional">Professionale</SelectItem>
                      <SelectItem value="creative">Creativo</SelectItem>
                      <SelectItem value="minimal">Minimale</SelectItem>
                      <SelectItem value="luxury">Lusso</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={generateAIImage}
                    disabled={isGeneratingImage}
                    variant="outline"
                    className="shrink-0 border-purple-300 hover:bg-purple-100 dark:border-purple-700 dark:hover:bg-purple-900/50 bg-transparent"
                  >
                    {isGeneratingImage ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <ImageIcon className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {newPost.image_url && (
                <div className="relative mt-2">
                  <img
                    src={newPost.image_url || "/placeholder.svg"}
                    alt="Immagine generata"
                    className="w-full h-32 sm:h-48 object-cover rounded-lg border"
                  />
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2 h-6 w-6 p-0"
                    onClick={() => setNewPost((prev) => ({ ...prev, image_url: "" }))}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>

            {/* Content textarea */}
            <div className="space-y-2">
              <Label className="text-sm">Contenuto</Label>
              <Textarea
                placeholder="Scrivi il contenuto del post..."
                value={newPost.content}
                onChange={(e) => setNewPost((prev) => ({ ...prev, content: e.target.value }))}
                rows={4}
                className="text-sm resize-none"
              />
              <p className="text-xs text-muted-foreground text-right">{newPost.content.length} / 2000 caratteri</p>
            </div>

            {/* Platform selection - Mobile optimized */}
            <div className="space-y-2">
              <Label className="text-sm">Piattaforme</Label>
              <div className="flex flex-wrap gap-2">
                {["facebook", "instagram", "linkedin"].map((platform) => {
                  const Icon = platformIcons[platform as keyof typeof platformIcons]
                  const isSelected = newPost.platforms.includes(platform)
                  const isAvailable = accounts.some((a) => a.platform === platform && a.is_active)

                  return (
                    <button
                      key={platform}
                      onClick={() => {
                        if (!isAvailable) return
                        setNewPost((prev) => ({
                          ...prev,
                          platforms: isSelected
                            ? prev.platforms.filter((p) => p !== platform)
                            : [...prev.platforms, platform],
                        }))
                      }}
                      disabled={!isAvailable}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs sm:text-sm transition-colors ${
                        isSelected
                          ? `${platformColors[platform as keyof typeof platformColors]} text-white border-transparent`
                          : isAvailable
                            ? "border-border hover:border-primary"
                            : "border-border opacity-50 cursor-not-allowed"
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      <span className="capitalize">{platform}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Target accounts selection for Facebook */}
            {newPost.platforms.includes("facebook") && (
              <div className="space-y-2">
                <Label className="text-sm">Pagine Facebook</Label>
                <p className="text-xs text-muted-foreground">Seleziona su quali pagine pubblicare</p>
                <div className="flex flex-wrap gap-2">
                  {accounts
                    .filter((a) => a.platform === "facebook" && a.is_active)
                    .map((account) => {
                      const isSelected = newPost.target_accounts?.includes(account.page_id || account.account_id || "")
                      return (
                        <button
                          key={account.id}
                          onClick={() => {
                            const accountId = account.page_id || account.account_id || ""
                            setNewPost((prev) => ({
                              ...prev,
                              target_accounts: isSelected
                                ? (prev.target_accounts || []).filter((id) => id !== accountId)
                                : [...(prev.target_accounts || []), accountId],
                            }))
                          }}
                          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs sm:text-sm transition-colors ${
                            isSelected
                              ? "bg-blue-600 text-white border-transparent"
                              : "border-border hover:border-primary"
                          }`}
                        >
                          <Facebook className="h-3.5 w-3.5" />
                          <span className="truncate max-w-[100px] sm:max-w-none">{account.account_name}</span>
                        </button>
                      )
                    })}
                </div>
              </div>
            )}

            {/* Schedule toggle */}
            <div className="flex items-center justify-between py-2">
              <div>
                <Label className="text-sm">Programma pubblicazione</Label>
                <p className="text-xs text-muted-foreground">Scegli data e ora</p>
              </div>
              <Switch
                checked={!!newPost.scheduled_for}
                onCheckedChange={(checked) =>
                  setNewPost((prev) => ({
                    ...prev,
                    scheduled_for: checked ? new Date().toISOString().slice(0, 16) : "",
                  }))
                }
              />
            </div>

            {newPost.scheduled_for && (
              <Input
                type="datetime-local"
                value={newPost.scheduled_for}
                onChange={(e) => setNewPost((prev) => ({ ...prev, scheduled_for: e.target.value }))}
                className="text-sm"
              />
            )}
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowCreateDialog(false)} className="w-full sm:w-auto">
              Annulla
            </Button>
            <Button
              onClick={savePost}
              disabled={!newPost.content || newPost.platforms.length === 0}
              className="w-full sm:w-auto"
            >
              <Send className="h-4 w-4 mr-2" />
              {newPost.scheduled_for ? "Programma" : "Salva Bozza"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Impostazioni Social Media</DialogTitle>
            <DialogDescription>Configura la generazione automatica dei post</DialogDescription>
          </DialogHeader>

          {settings && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Generazione automatica AI</p>
                  <p className="text-sm text-muted-foreground">
                    L'AI genera post ogni {settings.posting_frequency_days} giorni
                  </p>
                </div>
                <Switch
                  checked={settings.auto_generate_enabled}
                  onCheckedChange={(checked) =>
                    setSettings((prev) => (prev ? { ...prev, auto_generate_enabled: checked } : null))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Frequenza pubblicazione</Label>
                <Select
                  value={String(settings.posting_frequency_days)}
                  onValueChange={(value) =>
                    setSettings((prev) => (prev ? { ...prev, posting_frequency_days: Number.parseInt(value) } : null))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Ogni giorno</SelectItem>
                    <SelectItem value="2">Ogni 2 giorni</SelectItem>
                    <SelectItem value="3">Ogni 3 giorni</SelectItem>
                    <SelectItem value="7">Settimanale</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Tono dei post</Label>
                <Select
                  value={settings.tone}
                  onValueChange={(value) => setSettings((prev) => (prev ? { ...prev, tone: value } : null))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">Professionale</SelectItem>
                    <SelectItem value="casual">Casual</SelectItem>
                    <SelectItem value="inspirational">Inspirational</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Includi hashtag</p>
                  <p className="text-sm text-muted-foreground">Aggiungi hashtag automaticamente</p>
                </div>
                <Switch
                  checked={settings.include_hashtags}
                  onCheckedChange={(checked) =>
                    setSettings((prev) => (prev ? { ...prev, include_hashtags: checked } : null))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Hashtag di default</Label>
                <Input
                  placeholder="#4BID #RevenueManagement"
                  value={settings.default_hashtags.join(" ")}
                  onChange={(e) =>
                    setSettings((prev) =>
                      prev
                        ? {
                            ...prev,
                            default_hashtags: e.target.value.split(" ").filter((h) => h.startsWith("#")),
                          }
                        : null,
                    )
                  }
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSettingsDialog(false)}>
              Annulla
            </Button>
            <Button onClick={saveSettings}>Salva Impostazioni</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Connect Account Dialog */}
      <Dialog open={showConnectDialog} onOpenChange={setShowConnectDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Collega Account Social</DialogTitle>
            <DialogDescription>
              Per pubblicare automaticamente sui social, devi collegare i tuoi account.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {["facebook", "instagram", "linkedin"].map((platform) => {
              const Icon = platformIcons[platform as keyof typeof platformIcons]
              const account = accounts.find((a) => a.platform === platform)

              const connectUrls: Record<string, string> = {
                facebook: "/api/social/connect/facebook",
                instagram: "/api/social/connect/facebook", // Instagram usa Facebook OAuth
                linkedin: "/api/social/connect/linkedin",
              }

              return (
                <div key={platform} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center ${platformColors[platform as keyof typeof platformColors]}`}
                      >
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium capitalize">{platform}</p>
                        <p className="text-sm text-muted-foreground">
                          {account?.is_active ? account.account_name : "Non collegato"}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant={account?.is_active ? "outline" : "default"}
                      size="sm"
                      onClick={() => {
                        if (platform === "facebook") {
                          window.location.href = connectUrls.facebook
                        } else if (platform === "linkedin") {
                          window.location.href = connectUrls.linkedin
                        } else {
                          // For Instagram, direct to connect dialog as it uses Facebook OAuth
                          // Alternatively, you could redirect to Facebook OAuth if that's how it's handled
                          // For now, let's assume manual connection or a similar flow is desired if OAuth fails/isn't available
                          setShowManualConnect("instagram")
                        }
                      }}
                    >
                      {account?.is_active ? "Riconnetti" : "OAuth"}
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConnectDialog(false)}>
              Chiudi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manual Connect Dialog */}
      {showManualConnect && (
        <Dialog open={true} onOpenChange={() => setShowManualConnect(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Collega {showManualConnect} Manuale</DialogTitle>
              <DialogDescription>
                Inserisci i dettagli del tuo account {showManualConnect} per collegarlo manualmente.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>ID Pagina</Label>
                <Input placeholder="ID Pagina" value={manualPageId} onChange={(e) => setManualPageId(e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label>Nome Pagina</Label>
                <Input
                  placeholder="Nome Pagina"
                  value={manualPageName}
                  onChange={(e) => setManualPageName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Token di Accesso</Label>
                <Input
                  placeholder="Token di Accesso"
                  value={manualAccessToken}
                  onChange={(e) => setManualAccessToken(e.target.value)}
                  type="password"
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowManualConnect(null)}>
                Annulla
              </Button>
              <Button onClick={() => saveManualConnection(showManualConnect)}>
                {isSavingManual ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                Collega
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[95vh] overflow-y-auto mx-2 sm:mx-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>Modifica Post</DialogTitle>
            <DialogDescription>Modifica il contenuto, l'immagine o la programmazione del post</DialogDescription>
          </DialogHeader>

          {editingPost && (
            <div className="space-y-4">
              {/* Content */}
              <div className="space-y-2">
                <Label>Contenuto</Label>
                <Textarea
                  value={editingPost.content}
                  onChange={(e) => setEditingPost({ ...editingPost, content: e.target.value })}
                  rows={6}
                  className="resize-none"
                />
              </div>

              {/* Image */}
              <div className="space-y-2">
                <Label>Immagine</Label>
                {editingPost.image_url ? (
                  <div className="relative">
                    <img
                      src={editingPost.image_url || "/placeholder.svg"}
                      alt="Post image"
                      className="w-full max-h-48 object-cover rounded-lg"
                    />
                    <Button
                      size="sm"
                      variant="destructive"
                      className="absolute top-2 right-2"
                      onClick={() => setEditingPost({ ...editingPost, image_url: null })}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed rounded-lg p-4 text-center text-muted-foreground">
                    Nessuna immagine
                  </div>
                )}
              </div>

              {/* Platforms */}
              <div className="space-y-2">
                <Label>Piattaforme</Label>
                <div className="flex flex-wrap gap-2">
                  {["facebook", "instagram", "linkedin"].map((platform) => {
                    const Icon = platformIcons[platform as keyof typeof platformIcons]
                    const isSelected = editingPost.platforms.includes(platform)
                    const account = accounts.find((a) => a.platform === platform && a.is_active)
                    if (!account) return null
                    return (
                      <button
                        key={platform}
                        type="button"
                        onClick={() => {
                          const newPlatforms = isSelected
                            ? editingPost.platforms.filter((p) => p !== platform)
                            : [...editingPost.platforms, platform]
                          setEditingPost({ ...editingPost, platforms: newPlatforms })
                        }}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
                          isSelected
                            ? `${platformColors[platform as keyof typeof platformColors]} text-white border-transparent`
                            : "border-border hover:border-primary"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        <span className="capitalize text-sm">{platform}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Schedule */}
              <div className="space-y-2">
                <Label>Programmazione</Label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input
                    type="datetime-local"
                    value={editingPost.scheduled_for ? editingPost.scheduled_for.slice(0, 16) : ""}
                    onChange={(e) =>
                      setEditingPost({
                        ...editingPost,
                        scheduled_for: e.target.value ? new Date(e.target.value).toISOString() : null,
                        status: e.target.value ? "scheduled" : "draft",
                      })
                    }
                    className="flex-1"
                  />
                  {editingPost.scheduled_for && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setEditingPost({ ...editingPost, scheduled_for: null, status: "draft" })}
                    >
                      Rimuovi programmazione
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {editingPost.scheduled_for
                    ? `Programmato per: ${new Date(editingPost.scheduled_for).toLocaleString("it-IT")}`
                    : "Nessuna programmazione - il post rimarrà in bozza"}
                </p>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setShowEditDialog(false)} className="flex-1 sm:flex-none">
                  Annulla
                </Button>
                <Button onClick={updatePost} disabled={isGenerating} className="flex-1 sm:flex-none">
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Salvataggio...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Salva modifiche
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ... existing settings dialog and manual connect dialog ... */}
    </div>
  )
}

function PostCard({
  post,
  onApprove,
  onReject,
  onPublish,
  onEdit,
}: {
  post: SocialPost
  onApprove?: () => void
  onReject?: () => void
  onPublish?: () => void
  onEdit?: () => void
}) {
  const status = statusConfig[post.status] || statusConfig.draft
  const StatusIcon = status.icon
  const canEdit = ["draft", "scheduled", "pending_approval", "approved"].includes(post.status)

  return (
    <Card>
      <CardContent className="p-2.5 sm:p-6 sm:pt-6">
        <div className="space-y-2 sm:space-y-3">
          {/* Status & Platforms - compact on mobile */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              <Badge className={`${status.color} text-white text-[10px] sm:text-xs py-0 h-5`}>
                <StatusIcon className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
                {status.label}
              </Badge>
              {post.is_ai_generated && (
                <Badge
                  variant="outline"
                  className="bg-purple-500/10 text-purple-600 border-purple-500 text-[10px] sm:text-xs py-0 h-5"
                >
                  <Sparkles className="h-2.5 w-2.5 mr-0.5" />
                  AI
                </Badge>
              )}
            </div>
            <div className="flex gap-0.5">
              {post.platforms.map((platform) => {
                const Icon = platformIcons[platform as keyof typeof platformIcons]
                return (
                  <div
                    key={platform}
                    className={`w-5 h-5 rounded flex items-center justify-center ${platformColors[platform as keyof typeof platformColors]}`}
                  >
                    <Icon className="h-2.5 w-2.5 text-white" />
                  </div>
                )
              })}
            </div>
          </div>

          {/* Content - truncated on mobile */}
          <p className="text-xs sm:text-sm whitespace-pre-wrap line-clamp-3 sm:line-clamp-none">{post.content}</p>

          {/* Image - smaller on mobile */}
          {post.image_url && (
            <img
              src={post.image_url || "/placeholder.svg"}
              alt="Generated Image"
              className="w-full h-32 sm:h-48 object-cover rounded-lg"
            />
          )}

          {/* Meta - stacked on mobile */}
          <div className="text-[10px] sm:text-xs text-muted-foreground space-y-0.5 sm:space-y-0 sm:flex sm:gap-4">
            <span>{new Date(post.created_at).toLocaleDateString("it-IT")}</span>
            {post.scheduled_for && (
              <span className="text-blue-500 font-medium">
                Progr:{" "}
                {new Date(post.scheduled_for).toLocaleString("it-IT", { dateStyle: "short", timeStyle: "short" })}
              </span>
            )}
          </div>

          {/* Actions - full width buttons on mobile */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {canEdit && onEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={onEdit}
                className="flex-1 sm:flex-none h-7 text-[10px] sm:text-xs bg-transparent"
              >
                <Pencil className="h-3 w-3 mr-1" />
                Modifica
              </Button>
            )}
            {onApprove && (
              <Button
                variant="outline"
                size="sm"
                onClick={onApprove}
                className="flex-1 sm:flex-none h-7 text-[10px] sm:text-xs text-green-600 border-green-600 hover:bg-green-50 bg-transparent"
              >
                <Check className="h-3 w-3 mr-1" />
                Approva
              </Button>
            )}
            {onPublish && (
              <Button size="sm" onClick={onPublish} className="flex-1 sm:flex-none h-7 text-[10px] sm:text-xs">
                <Send className="h-3 w-3 mr-1" />
                Pubblica
              </Button>
            )}
            {onReject && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onReject}
                className="h-7 w-7 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
