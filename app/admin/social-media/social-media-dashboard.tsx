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
}

interface SocialPost {
  id: string
  content: string
  image_url: string | null
  post_type: string
  hashtags: string[] | null
  scheduled_for: string | null
  published_at: string | null
  status: string
  is_ai_generated: boolean
  ai_topic: string | null
  platforms: string[]
  auto_publish: boolean
  requires_approval: boolean
  error_message: string | null
  created_at: string
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
  initialAccounts: SocialAccount[]
  initialPosts: SocialPost[]
  initialSettings: SocialSettings | null
  userEmail: string
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

export default function SocialMediaDashboard({ initialAccounts, initialPosts, initialSettings, userEmail }: Props) {
  const router = useRouter()
  const [accounts, setAccounts] = useState(initialAccounts)
  const [posts, setPosts] = useState(initialPosts)
  const [settings, setSettings] = useState<SocialSettings | null>(initialSettings)
  const [isGenerating, setIsGenerating] = useState(false)
  const [showNewPostDialog, setShowNewPostDialog] = useState(false)
  const [showSettingsDialog, setShowSettingsDialog] = useState(false)
  const [showConnectDialog, setShowConnectDialog] = useState(false)
  const [selectedPost, setSelectedPost] = useState<SocialPost | null>(null)

  // New post form state
  const [newPost, setNewPost] = useState({
    content: "",
    platforms: ["facebook", "instagram", "linkedin"] as string[],
    auto_publish: false,
    scheduled_for: "",
    ai_topic: "",
  })

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

  const savePost = async (status: "draft" | "pending_approval" | "scheduled") => {
    try {
      const response = await fetch("/api/social/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newPost,
          status,
          is_ai_generated: newPost.content.includes("#") && newPost.ai_topic !== "",
          ai_topic: newPost.ai_topic,
        }),
      })

      if (!response.ok) throw new Error("Errore nel salvataggio")

      const savedPost = await response.json()
      setPosts((prev) => [savedPost, ...prev])
      setShowNewPostDialog(false)
      setNewPost({
        content: "",
        platforms: ["facebook", "instagram", "linkedin"],
        auto_publish: false,
        scheduled_for: "",
        ai_topic: "",
      })
      toast.success("Post salvato!")
      router.refresh()
    } catch (error) {
      toast.error("Errore nel salvataggio")
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

  const pendingApproval = posts.filter((p) => p.status === "pending_approval")
  const scheduled = posts.filter((p) => p.status === "scheduled" || p.status === "approved")
  const published = posts.filter((p) => p.status === "published")

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" asChild>
                <a href="/admin">
                  <ArrowLeft className="h-5 w-5" />
                </a>
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Gestione Social Media</h1>
                <p className="text-sm text-muted-foreground">Genera e pubblica contenuti con AI</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setShowSettingsDialog(true)}>
                <Settings className="h-4 w-4 mr-2" />
                Impostazioni
              </Button>
              <Button onClick={() => setShowNewPostDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Nuovo Post
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Da Approvare</p>
                  <p className="text-3xl font-bold text-yellow-500">{pendingApproval.length}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Programmati</p>
                  <p className="text-3xl font-bold text-blue-500">{scheduled.length}</p>
                </div>
                <Calendar className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pubblicati</p>
                  <p className="text-3xl font-bold text-emerald-500">{published.length}</p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-emerald-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Account Connessi</p>
                  <p className="text-3xl font-bold">{accounts.filter((a) => a.is_active).length}</p>
                </div>
                <div className="flex -space-x-2">
                  {["facebook", "instagram", "linkedin"].map((platform) => {
                    const Icon = platformIcons[platform as keyof typeof platformIcons]
                    const isConnected = accounts.some((a) => a.platform === platform && a.is_active)
                    return (
                      <div
                        key={platform}
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          isConnected ? platformColors[platform as keyof typeof platformColors] : "bg-gray-300"
                        }`}
                      >
                        <Icon className="h-4 w-4 text-white" />
                      </div>
                    )
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Connected Accounts */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Account Social Collegati</CardTitle>
                <CardDescription>Collega i tuoi account per pubblicare automaticamente</CardDescription>
              </div>
              <Button variant="outline" onClick={() => setShowConnectDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Collega Account
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {["facebook", "instagram", "linkedin"].map((platform) => {
                const Icon = platformIcons[platform as keyof typeof platformIcons]
                const account = accounts.find((a) => a.platform === platform)

                return (
                  <div
                    key={platform}
                    className={`p-4 rounded-lg border-2 ${
                      account?.is_active
                        ? "border-green-500 bg-green-500/10"
                        : "border-dashed border-muted-foreground/30"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-12 h-12 rounded-lg flex items-center justify-center ${platformColors[platform as keyof typeof platformColors]}`}
                      >
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold capitalize">{platform}</p>
                        {account?.is_active ? (
                          <p className="text-sm text-green-600">{account.account_name}</p>
                        ) : (
                          <p className="text-sm text-muted-foreground">Non collegato</p>
                        )}
                      </div>
                      {account?.is_active && (
                        <Badge variant="outline" className="bg-green-500/20 text-green-600 border-green-500">
                          Attivo
                        </Badge>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Posts Tabs */}
        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="pending" className="relative">
              Da Approvare
              {pendingApproval.length > 0 && (
                <span className="ml-2 bg-yellow-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {pendingApproval.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="scheduled">Programmati</TabsTrigger>
            <TabsTrigger value="published">Pubblicati</TabsTrigger>
            <TabsTrigger value="all">Tutti</TabsTrigger>
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
              published.map((post) => <PostCard key={post.id} post={post} />)
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
              />
            ))}
          </TabsContent>
        </Tabs>
      </main>

      {/* New Post Dialog */}
      <Dialog open={showNewPostDialog} onOpenChange={setShowNewPostDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Crea Nuovo Post</DialogTitle>
            <DialogDescription>Scrivi manualmente o genera con AI</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* AI Generation */}
            <div className="p-4 bg-muted rounded-lg space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <span className="font-medium">Genera con AI</span>
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Argomento (es: revenue management, Hotel Accelerator...)"
                  value={newPost.ai_topic}
                  onChange={(e) => setNewPost((prev) => ({ ...prev, ai_topic: e.target.value }))}
                />
                <Button onClick={() => generateAIPost()} disabled={isGenerating}>
                  {isGenerating ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {["Revenue Management", "Hotel Accelerator", "Manubot", "Hospitality Trends", "Tips Hotel"].map(
                  (topic) => (
                    <Button
                      key={topic}
                      variant="outline"
                      size="sm"
                      onClick={() => generateAIPost(topic)}
                      disabled={isGenerating}
                    >
                      {topic}
                    </Button>
                  ),
                )}
              </div>
            </div>

            {/* Content */}
            <div className="space-y-2">
              <Label>Contenuto</Label>
              <Textarea
                placeholder="Scrivi il tuo post..."
                value={newPost.content}
                onChange={(e) => setNewPost((prev) => ({ ...prev, content: e.target.value }))}
                rows={6}
              />
              <p className="text-xs text-muted-foreground text-right">{newPost.content.length} caratteri</p>
            </div>

            {/* Platforms */}
            <div className="space-y-2">
              <Label>Piattaforme</Label>
              <div className="flex gap-4">
                {["facebook", "instagram", "linkedin"].map((platform) => {
                  const Icon = platformIcons[platform as keyof typeof platformIcons]
                  const isSelected = newPost.platforms.includes(platform)

                  return (
                    <button
                      key={platform}
                      onClick={() => {
                        setNewPost((prev) => ({
                          ...prev,
                          platforms: isSelected
                            ? prev.platforms.filter((p) => p !== platform)
                            : [...prev.platforms, platform],
                        }))
                      }}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all ${
                        isSelected ? "border-primary bg-primary/10" : "border-muted hover:border-muted-foreground/50"
                      }`}
                    >
                      <Icon className={`h-5 w-5 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                      <span className="capitalize">{platform}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Schedule */}
            <div className="space-y-2">
              <Label>Programma pubblicazione (opzionale)</Label>
              <Input
                type="datetime-local"
                value={newPost.scheduled_for}
                onChange={(e) => setNewPost((prev) => ({ ...prev, scheduled_for: e.target.value }))}
              />
            </div>

            {/* Auto-publish toggle */}
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div>
                <p className="font-medium">Pubblicazione automatica</p>
                <p className="text-sm text-muted-foreground">Pubblica senza approvazione manuale</p>
              </div>
              <Switch
                checked={newPost.auto_publish}
                onCheckedChange={(checked) => setNewPost((prev) => ({ ...prev, auto_publish: checked }))}
              />
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setShowNewPostDialog(false)}>
              Annulla
            </Button>
            <Button variant="secondary" onClick={() => savePost("draft")} disabled={!newPost.content}>
              Salva Bozza
            </Button>
            {newPost.auto_publish ? (
              <Button onClick={() => savePost("scheduled")} disabled={!newPost.content}>
                <Send className="h-4 w-4 mr-2" />
                Programma
              </Button>
            ) : (
              <Button onClick={() => savePost("pending_approval")} disabled={!newPost.content}>
                <Clock className="h-4 w-4 mr-2" />
                Invia per Approvazione
              </Button>
            )}
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
        <DialogContent>
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
                <div key={platform} className="flex items-center justify-between p-4 border rounded-lg">
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
                    onClick={() => (window.location.href = connectUrls[platform])}
                  >
                    {account?.is_active ? "Riconnetti" : "Collega"}
                  </Button>
                </div>
              )
            })}

            <p className="text-xs text-muted-foreground">
              Nota: Instagram richiede un account business collegato a una pagina Facebook.
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConnectDialog(false)}>
              Chiudi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Post Card Component
function PostCard({
  post,
  onApprove,
  onReject,
  onPublish,
}: {
  post: SocialPost
  onApprove?: () => void
  onReject?: () => void
  onPublish?: () => void
}) {
  const status = statusConfig[post.status] || statusConfig.draft
  const StatusIcon = status.icon

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex gap-4">
          <div className="flex-1 space-y-3">
            {/* Status & Platforms */}
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className={`${status.color} text-white`}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {status.label}
              </Badge>
              {post.is_ai_generated && (
                <Badge variant="outline" className="bg-purple-500/10 text-purple-600 border-purple-500">
                  <Sparkles className="h-3 w-3 mr-1" />
                  AI Generated
                </Badge>
              )}
              <div className="flex gap-1 ml-auto">
                {post.platforms.map((platform) => {
                  const Icon = platformIcons[platform as keyof typeof platformIcons]
                  return (
                    <div
                      key={platform}
                      className={`w-6 h-6 rounded flex items-center justify-center ${platformColors[platform as keyof typeof platformColors]}`}
                    >
                      <Icon className="h-3 w-3 text-white" />
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Content */}
            <p className="text-sm whitespace-pre-wrap">{post.content}</p>

            {/* Meta */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>Creato: {new Date(post.created_at).toLocaleString("it-IT")}</span>
              {post.scheduled_for && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Programmato: {new Date(post.scheduled_for).toLocaleString("it-IT")}
                </span>
              )}
              {post.published_at && (
                <span className="flex items-center gap-1 text-green-600">
                  <CheckCircle2 className="h-3 w-3" />
                  Pubblicato: {new Date(post.published_at).toLocaleString("it-IT")}
                </span>
              )}
            </div>

            {/* Error */}
            {post.error_message && (
              <div className="p-2 bg-red-500/10 border border-red-500/30 rounded text-sm text-red-600">
                {post.error_message}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2">
            {onApprove && (
              <Button
                size="sm"
                variant="outline"
                className="text-green-600 border-green-600 bg-transparent"
                onClick={onApprove}
              >
                <Check className="h-4 w-4" />
              </Button>
            )}
            {onPublish && (
              <Button size="sm" onClick={onPublish}>
                <Send className="h-4 w-4" />
              </Button>
            )}
            {onReject && (
              <Button
                size="sm"
                variant="outline"
                className="text-red-600 border-red-600 bg-transparent"
                onClick={onReject}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
