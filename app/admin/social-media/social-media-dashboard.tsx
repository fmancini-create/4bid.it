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
  Trash2,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  ImageIcon,
  Loader2,
  Pencil,
  FileText,
  ExternalLink,
  Eye,
  Link2,
  LinkIcon,
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  formatDateOnlyIT,
  formatDateTimeIT,
  localDatetimeToUTC,
  utcToLocalDatetime,
  nowAsLocalDatetime,
} from "@/lib/date-utils"

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
  status: "draft" | "pending_approval" | "approved" | "scheduled" | "published" | "failed" | "pending_review"
  is_ai_generated: boolean
  ai_topic: string | null
  platforms: string[]
  auto_publish: boolean
  requires_approval: boolean
  error_message: string | null
  created_at: string
  target_accounts?: string[] // Added target_accounts
  link_url?: string | null // Added link_url
  media_priority: "image" | "link" // Added media_priority
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

interface TopicRule {
  id: string
  topic_name: string
  platforms: string[]
  time_windows: { start: string; end: string }[]
  frequency_days: number
  exclude_weekdays: number[]
  min_queue_pending: number
  batch_size: number
  tone: string
  include_hashtags: boolean
  default_hashtags: string[]
  link_url: string | null
  image_style_prompt: string | null
  target_accounts: string[]
  is_active: boolean
  created_at: string
  updated_at: string
}

interface Props {
  initialAccounts?: SocialAccount[]
  initialPosts?: SocialPost[]
  initialSettings?: SocialSettings | null
  initialTopicRules?: TopicRule[]
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
  draft: { label: "Bozza", color: "bg-gray-500", icon: FileText }, // Changed icon to FileText for drafts
  scheduled: { label: "Programmato", color: "bg-blue-500", icon: Calendar },
  published: { label: "Pubblicato", color: "bg-emerald-500", icon: CheckCircle2 },
  failed: { label: "Errore", color: "bg-red-500", icon: AlertCircle },
  pending_approval: { label: "In attesa approvazione", color: "bg-yellow-500", icon: Clock }, // Added pending_approval status
}

export default function SocialMediaDashboard({
  initialAccounts = [],
  initialPosts = [],
  initialSettings,
  initialTopicRules = [],
  userEmail,
}: Props) {
  const router = useRouter()
  const [accounts, setAccounts] = useState<SocialAccount[]>(initialAccounts)
  const [posts, setPosts] = useState<SocialPost[]>(initialPosts)
  const [settings, setSettings] = useState<SocialSettings | null>(initialSettings)
  const [topicRules, setTopicRules] = useState<TopicRule[]>(initialTopicRules)
  const [isGenerating, setIsGenerating] = useState(false)
  const [showConnectDialog, setShowConnectDialog] = useState(false)
  const [showSettingsDialog, setShowSettingsDialog] = useState(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingPost, setEditingPost] = useState<SocialPost | null>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Topic rules state
  const [showTopicRuleDialog, setShowTopicRuleDialog] = useState(false)
  const [editingTopicRule, setEditingTopicRule] = useState<Partial<TopicRule> | null>(null)
  const [isSavingTopicRule, setIsSavingTopicRule] = useState(false)
  const [topicFilter, setTopicFilter] = useState<string>("all")
  const [selectedPostIds, setSelectedPostIds] = useState<Set<string>>(new Set())
  const [isBulkApproving, setIsBulkApproving] = useState(false)
  const [isGeneratingBatch, setIsGeneratingBatch] = useState<string | null>(null)
  const [regeneratingPostId, setRegeneratingPostId] = useState<string | null>(null)

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
    link_url: "", // Added link_url
    media_priority: "image" as "image" | "link", // "image" = usa immagine caricata, "link" = usa anteprima link
  })

  const [isGeneratingImage, setIsGeneratingImage] = useState(false)

  const [publishConfirmPost, setPublishConfirmPost] = useState<SocialPost | null>(null)
  const [isPublishing, setIsPublishing] = useState(false)

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
    if (!newPost.content || newPost.platforms.length === 0) return

    setIsLoading(true)
    try {
      const scheduledForUTC = newPost.scheduled_for ? localDatetimeToUTC(newPost.scheduled_for) : null

      const status = scheduledForUTC ? "scheduled" : "draft"

      const postData = {
        content: newPost.content,
        platforms: newPost.platforms,
        status,
        scheduled_for: scheduledForUTC,
        auto_publish: newPost.auto_publish,
        link_url: newPost.link_url || null,
        image_url: newPost.image_url || null,
        target_accounts: newPost.target_accounts.length > 0 ? newPost.target_accounts : null,
        media_priority: newPost.media_priority,
      }

      const response = await fetch("/api/social/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(postData),
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
        link_url: "", // Reset link_url
        media_priority: "image",
      })
      toast.success("Post salvato!")
      router.refresh()
    } catch (error) {
      console.error("Save post error:", error)
      toast.error("Errore nel salvataggio")
    } finally {
      setIsLoading(false)
    }
  }

  const updatePost = async () => {
    if (!editingPost || !editingPost.content || editingPost.platforms.length === 0) return

    setIsLoading(true)
    try {
      const scheduledForUTC = editingPost.scheduled_for ? localDatetimeToUTC(editingPost.scheduled_for) : null

      // Determine status: if has scheduled_for -> scheduled, otherwise keep as draft
      let newStatus = editingPost.status
      if (scheduledForUTC && editingPost.status === "draft") {
        newStatus = "scheduled"
      } else if (!scheduledForUTC && editingPost.status === "scheduled") {
        newStatus = "draft"
      }

      // If this is a repost (id is empty), create a new post
      if (!editingPost.id) {
        const postData = {
          content: editingPost.content,
          platforms: editingPost.platforms,
          status: scheduledForUTC ? "scheduled" : "draft",
          scheduled_for: scheduledForUTC,
          auto_publish: editingPost.auto_publish,
          link_url: editingPost.link_url || null,
          image_url: editingPost.image_url || null,
          target_accounts:
            editingPost.target_accounts && editingPost.target_accounts.length > 0 ? editingPost.target_accounts : null,
          media_priority: editingPost.media_priority || "image",
        }

        const response = await fetch("/api/social/posts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(postData),
        })

        if (!response.ok) throw new Error("Errore nel salvataggio")

        const savedPost = await response.json()
        setPosts((prev) => [savedPost, ...prev])
        setShowEditDialog(false)
        setEditingPost(null)
        toast.success(scheduledForUTC ? "Post programmato!" : "Bozza salvata!")
        return
      }

      const postData = {
        id: editingPost.id,
        content: editingPost.content,
        platforms: editingPost.platforms,
        status: newStatus,
        scheduled_for: scheduledForUTC,
        auto_publish: editingPost.auto_publish,
        link_url: editingPost.link_url || null,
        image_url: editingPost.image_url || null,
        target_accounts:
          editingPost.target_accounts && editingPost.target_accounts.length > 0 ? editingPost.target_accounts : null,
        media_priority: editingPost.media_priority || "image",
      }

      const response = await fetch("/api/social/posts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(postData),
      })

      if (!response.ok) throw new Error("Errore nel salvataggio")

      const updatedPost = await response.json()
      setPosts((prev) => prev.map((p) => (p.id === updatedPost.id ? updatedPost : p)))
      setShowEditDialog(false)
      setEditingPost(null)
      toast.success(scheduledForUTC ? "Post programmato!" : "Bozza aggiornata!")
    } catch (error) {
      toast.error("Errore nel salvataggio del post")
    } finally {
      setIsLoading(false)
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

  const openPublishConfirm = (post: SocialPost) => {
    setPublishConfirmPost(post)
  }

  const publishNow = async (postId: string) => {
    const post = posts.find((p) => p.id === postId)
    if (post) {
      openPublishConfirm(post)
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

  const drafts = posts.filter((p) => p.status === "draft")
  const pendingApproval = posts.filter((p) => p.status === "pending_approval") // Added pendingApproval filter
  const scheduled = posts.filter((p) => p.status === "scheduled")
  const published = posts.filter((p) => p.status === "published" || p.status === "failed")
  const allPosts = posts

  const repostPost = async (postToRepost: SocialPost) => {
    setEditingPost({
      ...postToRepost,
      id: "", // New post ID
      status: "draft", // Reset status to draft
      scheduled_for: postToRepost.scheduled_for, // Keep original schedule
      published_at: null, // Clear published date
      created_at: new Date().toISOString(), // Reset creation date
    })
    setShowEditDialog(true)
    toast.info("Modifica il post e salva. Puoi mantenere o cambiare la data di programmazione.")
  }

  // --- Topic Rules CRUD ---
  const saveTopicRule = async () => {
    if (!editingTopicRule?.topic_name) return
    setIsSavingTopicRule(true)
    try {
      const isEditing = !!editingTopicRule.id
      const response = await fetch("/api/social/topic-rules", {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingTopicRule),
      })
      if (!response.ok) throw new Error("Errore nel salvataggio")
      const saved = await response.json()
      if (isEditing) {
        setTopicRules((prev) => prev.map((r) => (r.id === saved.id ? saved : r)))
      } else {
        setTopicRules((prev) => [saved, ...prev])
      }
      setShowTopicRuleDialog(false)
      setEditingTopicRule(null)
      toast.success(isEditing ? "Tema aggiornato!" : "Tema creato!")
    } catch {
      toast.error("Errore nel salvataggio del tema")
    } finally {
      setIsSavingTopicRule(false)
    }
  }

  const deleteTopicRule = async (id: string) => {
    try {
      const response = await fetch(`/api/social/topic-rules/${id}`, { method: "DELETE" })
      if (!response.ok) throw new Error("Errore")
      setTopicRules((prev) => prev.filter((r) => r.id !== id))
      toast.success("Tema eliminato")
    } catch {
      toast.error("Errore nell'eliminazione")
    }
  }

  const generateBatchForTopic = async (ruleId: string) => {
    setIsGeneratingBatch(ruleId)
    try {
      const response = await fetch(`/api/social/topic-rules/${ruleId}/generate`, { method: "POST" })
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        throw new Error(errData.error || "Errore nella generazione")
      }
      const data = await response.json()
      if (data.generated === 0) {
        toast.info(data.message || "Nessun post generato - coda gia' piena")
      } else {
        toast.success(`Generati ${data.generated} post per "${data.message?.match(/"([^"]+)"/)?.[1] || "tema"}"!`)
      }
      router.refresh()
    } catch (err) {
      console.log("[v0] Generate error:", err)
      toast.error(err instanceof Error ? err.message : "Errore nella generazione batch")
    } finally {
      setIsGeneratingBatch(null)
    }
  }

  // --- Bulk Actions ---
  const togglePostSelection = (postId: string) => {
    setSelectedPostIds((prev) => {
      const next = new Set(prev)
      if (next.has(postId)) next.delete(postId)
      else next.add(postId)
      return next
    })
  }

  const selectAllPending = () => {
    const filtered = topicFilter === "all"
      ? pendingApproval
      : pendingApproval.filter((p) => p.ai_topic === topicFilter)
    setSelectedPostIds(new Set(filtered.map((p) => p.id)))
  }

  const deselectAll = () => setSelectedPostIds(new Set())

  const bulkApprove = async () => {
    if (selectedPostIds.size === 0) return
    setIsBulkApproving(true)
    try {
      const response = await fetch("/api/social/posts/bulk-approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postIds: Array.from(selectedPostIds) }),
      })
      if (!response.ok) throw new Error("Errore")
      const data = await response.json()
      toast.success(data.message || `${data.results?.filter((r: { success: boolean }) => r.success).length || 0} post approvati e programmati!`)
      setSelectedPostIds(new Set())
      router.refresh()
    } catch {
      toast.error("Errore nell'approvazione batch")
    } finally {
      setIsBulkApproving(false)
    }
  }

  const bulkReject = async () => {
    if (selectedPostIds.size === 0) return
    if (!confirm(`Eliminare ${selectedPostIds.size} post selezionati?`)) return
    for (const postId of selectedPostIds) {
      await rejectPost(postId)
    }
    setSelectedPostIds(new Set())
  }

  const regeneratePost = async (postId: string) => {
    setRegeneratingPostId(postId)
    try {
      const response = await fetch(`/api/social/posts/${postId}/regenerate`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "both" }) })
      if (!response.ok) throw new Error("Errore")
      const data = await response.json()
      setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, content: data.content, image_url: data.image_url || p.image_url } : p)))
      toast.success("Post rigenerato!")
    } catch {
      toast.error("Errore nella rigenerazione")
    } finally {
      setRegeneratingPostId(null)
    }
  }

  const getTargetAccountNames = (post: SocialPost) => {
    if (!post.target_accounts || post.target_accounts.length === 0) {
      // All accounts for selected platforms
      return accounts
        .filter((a) => post.platforms.includes(a.platform) && a.is_active)
        .map((a) => ({ name: a.account_name, platform: a.platform }))
    }
    return accounts
      .filter((a) => post.target_accounts?.includes(a.id))
      .map((a) => ({ name: a.account_name, platform: a.platform }))
  }

  const confirmPublish = async () => {
    if (!publishConfirmPost) return

    setIsPublishing(true)
    try {
      const response = await fetch(`/api/social/posts/${publishConfirmPost.id}/publish`, {
        method: "POST",
      })

      const result = await response.json()

      if (!response.ok) throw new Error(result.error || "Errore nella pubblicazione")

      setPosts((prev) =>
        prev.map((p) =>
          p.id === publishConfirmPost.id ? { ...p, status: "published", published_at: new Date().toISOString() } : p,
        ),
      )
      toast.success("Post pubblicato!")
      setPublishConfirmPost(null)
      router.refresh()
    } catch (error) {
      console.error("[v0] publish error:", error)
      toast.error("Errore nella pubblicazione")
    } finally {
      setIsPublishing(false)
    }
  }

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
                const activeAccounts = platformAccounts.filter((a) => a.is_active)
                const isConnected = activeAccounts.length > 0

                return (
                  <div
                    key={platform}
                    className={`flex flex-col gap-1.5 p-2.5 sm:p-4 rounded-lg border ${
                      isConnected ? "border-primary bg-primary/5" : "border-dashed"
                    }`}
                  >
                    {/* Header piattaforma */}
                    <div className="flex items-center justify-between">
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
                          {!isConnected && platform === "instagram" && (
                            <p className="text-[9px] text-muted-foreground mt-0.5">Collega Facebook per scoprire IG</p>
                          )}
                          {!isConnected && platform !== "instagram" && (
                            <p className="text-[10px] text-muted-foreground">Non collegato</p>
                          )}
                        </div>
                      </div>
                      <Button
                        variant={isConnected ? "outline" : "default"}
                        size="sm"
                        onClick={() => {
                          if (platform === "facebook" || platform === "instagram") {
                            window.location.href = "/api/social/connect/facebook"
                          } else if (platform === "linkedin") {
                            window.location.href = "/api/social/connect/linkedin"
                          }
                        }}
                        className="shrink-0 text-[10px] sm:text-sm h-7 sm:h-9 px-2 sm:px-3"
                      >
                        {isConnected ? "Riconn." : "Collega"}
                      </Button>
                    </div>

                    {/* Lista account connessi */}
                    {activeAccounts.length > 0 && (
                      <div className="flex flex-col gap-1 ml-9 sm:ml-12">
                        {activeAccounts.map((acc) => (
                          <div key={acc.id} className="flex items-center justify-between">
                            <p className="text-[10px] sm:text-xs text-muted-foreground truncate max-w-[120px] sm:max-w-none">
                              {acc.account_name}
                              {platform === "instagram" && !acc.account_id && (
                                <span className="text-amber-600 ml-1">(ig_user_id mancante)</span>
                              )}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Bottone aggiungi altro account (solo FB e IG) */}
                    {isConnected && (platform === "facebook" || platform === "instagram") && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="ml-9 sm:ml-12 h-6 text-[9px] sm:text-xs text-muted-foreground justify-start px-1 hover:text-foreground"
                        onClick={() => {
                          window.location.href = "/api/social/connect/facebook?new=1"
                        }}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Aggiungi altro account FB/IG
                      </Button>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="w-full grid grid-cols-5 h-9 sm:h-10">
            <TabsTrigger value="pending" className="text-[10px] sm:text-sm py-1.5 px-1">
              Approvare {pendingApproval.length > 0 && <Badge variant="secondary" className="ml-1 h-4 text-[9px] px-1">{pendingApproval.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="scheduled" className="text-[10px] sm:text-sm py-1.5 px-1">
              Programmati
            </TabsTrigger>
            <TabsTrigger value="published" className="text-[10px] sm:text-sm py-1.5 px-1">
              Pubblicati
            </TabsTrigger>
            <TabsTrigger value="topics" className="text-[10px] sm:text-sm py-1.5 px-1">
              Temi
            </TabsTrigger>
            <TabsTrigger value="all" className="text-[10px] sm:text-sm py-1.5 px-1">
              Tutti
            </TabsTrigger>
          </TabsList>

          {/* TAB: Da Approvare con filtro tema e bulk actions */}
          <TabsContent value="pending" className="space-y-4 mt-4">
            {pendingApproval.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nessun post in attesa di approvazione</p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Barra filtro + bulk actions */}
                <Card>
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <Label className="text-xs sm:text-sm shrink-0">Filtra tema:</Label>
                        <Select value={topicFilter} onValueChange={(v) => { setTopicFilter(v); setSelectedPostIds(new Set()) }}>
                          <SelectTrigger className="h-8 text-xs sm:text-sm w-full sm:w-[200px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Tutti i temi</SelectItem>
                            {Array.from(new Set(pendingApproval.map((p) => p.ai_topic).filter(Boolean))).map((topic) => (
                              <SelectItem key={topic!} value={topic!}>{topic}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                        <Button variant="outline" size="sm" onClick={selectAllPending} className="h-7 text-xs px-2 bg-transparent">
                          Seleziona tutti
                        </Button>
                        {selectedPostIds.size > 0 && (
                          <>
                            <Button variant="outline" size="sm" onClick={deselectAll} className="h-7 text-xs px-2 bg-transparent">
                              Deseleziona ({selectedPostIds.size})
                            </Button>
                            <Button size="sm" onClick={bulkApprove} disabled={isBulkApproving} className="h-7 text-xs px-2 bg-emerald-600 hover:bg-emerald-700 text-white">
                              {isBulkApproving ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Check className="h-3 w-3 mr-1" />}
                              Approva {selectedPostIds.size}
                            </Button>
                            <Button variant="destructive" size="sm" onClick={bulkReject} className="h-7 text-xs px-2">
                              <Trash2 className="h-3 w-3 mr-1" />
                              Elimina {selectedPostIds.size}
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
                {(topicFilter === "all" ? pendingApproval : pendingApproval.filter((p) => p.ai_topic === topicFilter)).map((post) => (
                  <div key={post.id} className="flex items-start gap-2">
                    <div className="pt-4 shrink-0">
                      <input
                        type="checkbox"
                        checked={selectedPostIds.has(post.id)}
                        onChange={() => togglePostSelection(post.id)}
                        className="h-4 w-4 rounded border-border accent-primary"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <PostCard
                        post={post}
                        onApprove={() => approvePost(post.id)}
                        onPublish={() => publishNow(post.id)}
                        onReject={() => rejectPost(post.id)}
                        onEdit={() => openEditDialog(post)}
                        onRegenerate={() => regeneratePost(post.id)}
                        isRegenerating={regeneratingPostId === post.id}
                      />
                    </div>
                  </div>
                ))}
              </>
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
                  onEdit={() => openEditDialog(post)}
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
              published.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onEdit={() => openEditDialog(post)}
                  onRepost={() => repostPost(post)}
                />
              ))
            )}
          </TabsContent>
          {/* TAB: Temi (Topic Rules CRUD) */}
          <TabsContent value="topics" className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Configura i temi per la generazione automatica dei post</p>
              <Button size="sm" onClick={() => {
                setEditingTopicRule({
                  topic_name: "", image_style_prompt: "", platforms: ["facebook", "linkedin"],
                  time_windows: [{ start: "09:00", end: "12:00" }, { start: "17:00", end: "20:00" }],
                  frequency_days: 3, exclude_weekdays: [0, 6], min_queue_pending: 5, batch_size: 5,
                  tone: "professional", include_hashtags: true, default_hashtags: [],
                  link_url: null, target_accounts: [], is_active: true,
                })
                setShowTopicRuleDialog(true)
              }}>
                <Plus className="h-4 w-4 mr-1" /> Nuovo Tema
              </Button>
            </div>
            {topicRules.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nessun tema configurato</p>
                </CardContent>
              </Card>
            ) : (
              topicRules.map((rule) => {
                const queueCount = posts.filter((p) => p.ai_topic === rule.topic_name && (p.status === "pending_approval" || p.status === "scheduled")).length
                return (
                  <Card key={rule.id} className={!rule.is_active ? "opacity-60" : ""}>
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-sm sm:text-base">{rule.topic_name}</h3>
                            <Badge variant={rule.is_active ? "default" : "secondary"} className="text-[10px]">
                              {rule.is_active ? "Attivo" : "Disattivato"}
                            </Badge>
                            <Badge variant="outline" className="text-[10px]">
                              Coda: {queueCount} post
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2">{rule.image_style_prompt}</p>
                          <div className="flex flex-wrap gap-1.5">
                            {rule.platforms.map((p) => {
                              const Icon = platformIcons[p as keyof typeof platformIcons]
                              return Icon ? (
                                <Badge key={p} variant="outline" className="text-[10px] gap-1">
                                  <Icon className="h-2.5 w-2.5" /> {p}
                                </Badge>
                              ) : null
                            })}
                            <Badge variant="outline" className="text-[10px]">Ogni {rule.frequency_days}gg</Badge>
                            <Badge variant="outline" className="text-[10px]">Batch: {rule.batch_size}</Badge>
                            {rule.time_windows.map((tw) => {
                              const label = typeof tw === "string" ? tw : `${tw.start}-${tw.end}`
                              return (
                                <Badge key={label} variant="outline" className="text-[10px]">{label}</Badge>
                              )
                            })}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button variant="outline" size="sm"
                            onClick={() => generateBatchForTopic(rule.id)}
                            disabled={isGeneratingBatch === rule.id}
                            className="h-7 text-xs px-2 bg-transparent"
                          >
                            {isGeneratingBatch === rule.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                            <span className="hidden sm:inline ml-1">Genera</span>
                          </Button>
                          <Button variant="outline" size="sm" className="h-7 text-xs px-2 bg-transparent" onClick={() => {
                            setEditingTopicRule({ ...rule })
                            setShowTopicRuleDialog(true)
                          }}>
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button variant="outline" size="sm" className="h-7 text-xs px-2 text-destructive hover:text-destructive bg-transparent" onClick={() => {
                            if (confirm(`Eliminare il tema "${rule.topic_name}"?`)) deleteTopicRule(rule.id)
                          }}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            )}
          </TabsContent>

          <TabsContent value="all" className="space-y-4 mt-4">
            {allPosts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onPublish={["draft", "scheduled"].includes(post.status) ? () => publishNow(post.id) : undefined}
                onEdit={() => openEditDialog(post)}
                onRepost={post.status === "published" || post.status === "failed" ? () => repostPost(post) : undefined}
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

            {/* Link URL input */}
            <div className="space-y-2">
              <Label className="text-sm">Link (Opzionale)</Label>
              <Input
                placeholder="https://example.com"
                value={newPost.link_url}
                onChange={(e) => setNewPost((prev) => ({ ...prev, link_url: e.target.value }))}
                className="text-sm"
              />
            </div>

            {newPost.image_url && newPost.link_url && (
              <div className="space-y-2 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
                <Label className="text-sm font-medium">Priorità Media</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Hai inserito sia un'immagine che un link. Cosa vuoi mostrare nel post?
                </p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={newPost.media_priority === "image" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setNewPost((prev) => ({ ...prev, media_priority: "image" }))}
                    className="flex-1"
                  >
                    <ImageIcon className="h-4 w-4 mr-2" />
                    Usa mia immagine
                  </Button>
                  <Button
                    type="button"
                    variant={newPost.media_priority === "link" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setNewPost((prev) => ({ ...prev, media_priority: "link" }))}
                    className="flex-1"
                  >
                    <LinkIcon className="h-4 w-4 mr-2" />
                    Anteprima link
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {newPost.media_priority === "image"
                    ? "Il link verrà aggiunto nel testo del post"
                    : "Facebook mostrerà l'anteprima del sito linkato"}
                </p>
              </div>
            )}

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
                    scheduled_for: checked ? nowAsLocalDatetime() : "",
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
              disabled={!newPost.content || newPost.platforms.length === 0 || isLoading}
              className="w-full sm:w-auto"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvataggio...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  {newPost.scheduled_for ? "Programma" : "Salva Bozza"}
                </>
              )}
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
            <ScrollArea className="h-[60vh] pr-4">
              <div className="space-y-4 pr-4">
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
            </ScrollArea>
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
            <ScrollArea className="h-[75vh] pr-4">
              <div className="space-y-4 pr-4">
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

                {/* Link URL */}
                <div className="space-y-2">
                  <Label>Link</Label>
                  <Input
                    placeholder="https://example.com"
                    value={editingPost.link_url || ""}
                    onChange={(e) => setEditingPost({ ...editingPost, link_url: e.target.value })}
                    className="text-sm"
                  />
                </div>

                {editingPost.image_url && editingPost.link_url && (
                  <div className="space-y-2 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
                    <Label className="text-sm font-medium">Priorità Media</Label>
                    <p className="text-xs text-muted-foreground mb-2">
                      Hai inserito sia un'immagine che un link. Cosa vuoi mostrare nel post?
                    </p>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant={editingPost.media_priority === "image" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setEditingPost({ ...editingPost, media_priority: "image" })}
                        className="flex-1"
                      >
                        <ImageIcon className="h-4 w-4 mr-2" />
                        Usa mia immagine
                      </Button>
                      <Button
                        type="button"
                        variant={editingPost.media_priority === "link" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setEditingPost({ ...editingPost, media_priority: "link" })}
                        className="flex-1"
                      >
                        <LinkIcon className="h-4 w-4 mr-2" />
                        Anteprima link
                      </Button>
                    </div>
                  </div>
                )}

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
                      value={editingPost.scheduled_for ? utcToLocalDatetime(editingPost.scheduled_for) : ""}
                      onChange={(e) =>
                        setEditingPost({
                          ...editingPost,
                          scheduled_for: e.target.value ? localDatetimeToUTC(e.target.value) : null,
                        })
                      }
                      className="flex-1"
                    />
                    {editingPost.scheduled_for && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setEditingPost({ ...editingPost, scheduled_for: null })}
                      >
                        Rimuovi programmazione
                      </Button>
                    )}
                  </div>
                  {editingPost.scheduled_for && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {editingPost.scheduled_for
                        ? `Programmato per: ${formatDateTimeIT(editingPost.scheduled_for)}`
                        : "Non programmato"}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t">
                  <Button variant="outline" onClick={() => setShowEditDialog(false)} className="flex-1 sm:flex-none">
                    Annulla
                  </Button>
                  <Button onClick={updatePost} disabled={isLoading} className="flex-1 sm:flex-none">
                    {isLoading ? (
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
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>

      {/* Publish Confirmation Dialog */}
      <AlertDialog open={!!publishConfirmPost} onOpenChange={(open) => !open && setPublishConfirmPost(null)}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Conferma Pubblicazione
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4 pt-2">
                <p className="text-sm text-muted-foreground">Stai per pubblicare questo post. Verifica i dettagli:</p>

                {publishConfirmPost && (
                  <div className="space-y-3 rounded-lg border p-3 bg-muted/30">
                    {/* Content preview */}
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Contenuto:</p>
                      <p className="text-sm line-clamp-3">{publishConfirmPost.content}</p>
                    </div>

                    {/* Target channels */}
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Canali di pubblicazione:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {getTargetAccountNames(publishConfirmPost).map((account, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs flex items-center gap-1">
                            {account.platform === "facebook" && <Facebook className="h-3 w-3" />}
                            {account.platform === "instagram" && <Instagram className="h-3 w-3" />}
                            {account.platform === "linkedin" && <Linkedin className="h-3 w-3" />}
                            {account.name}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Image */}
                    {publishConfirmPost.image_url && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">Immagine:</p>
                        <Badge variant="outline" className="text-xs">
                          <ImageIcon className="h-3 w-3 mr-1" />
                          Allegata
                        </Badge>
                      </div>
                    )}

                    {/* Link */}
                    {publishConfirmPost.link_url && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">Link:</p>
                        <p className="text-xs text-blue-600 truncate">{publishConfirmPost.link_url}</p>
                      </div>
                    )}

                    {/* Scheduled time if present */}
                    {publishConfirmPost.scheduled_for && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">Data programmata:</p>
                        <Badge variant="outline" className="text-xs">
                          <Clock className="h-3 w-3 mr-1" />
                          {formatDateTimeIT(publishConfirmPost.scheduled_for)}
                        </Badge>
                      </div>
                    )}

                    {/* Immediate publish notice */}
                    {!publishConfirmPost.scheduled_for && (
                      <div className="flex items-center gap-2 text-amber-600 bg-amber-50 rounded p-2">
                        <AlertCircle className="h-4 w-4 flex-shrink-0" />
                        <p className="text-xs">Il post verrà pubblicato immediatamente</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel disabled={isPublishing}>Annulla</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmPublish}
              disabled={isPublishing}
              className="bg-green-600 hover:bg-green-700"
            >
              {isPublishing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Pubblicazione...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Pubblica Ora
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ... existing settings dialog and manual connect dialog ... */}

      {/* Dialog Tema (Topic Rule) */}
      <Dialog open={showTopicRuleDialog} onOpenChange={setShowTopicRuleDialog}>
        <DialogContent className="max-w-lg max-h-[95vh] overflow-y-auto mx-2 sm:mx-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>{editingTopicRule?.id ? "Modifica Tema" : "Nuovo Tema"}</DialogTitle>
            <DialogDescription>Configura un tema per la generazione automatica dei post</DialogDescription>
          </DialogHeader>
          {editingTopicRule && (
            <div className="space-y-4">
              <div>
                <Label className="text-sm">Nome tema *</Label>
                <Input
                  value={editingTopicRule.topic_name || ""}
                  onChange={(e) => setEditingTopicRule((prev) => prev ? { ...prev, topic_name: e.target.value } : prev)}
                  placeholder="Es: Revenue Management Tips"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-sm">Stile immagine AI</Label>
                <Textarea
                  value={editingTopicRule.image_style_prompt || ""}
                  onChange={(e) => setEditingTopicRule((prev) => prev ? { ...prev, image_style_prompt: e.target.value } : prev)}
                  placeholder="Es: professional hotel marketing, luxury resort photography..."
                  className="mt-1"
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-sm">Frequenza (giorni)</Label>
                  <Input
                    type="number" min={1} max={30}
                    value={editingTopicRule.frequency_days || 3}
                    onChange={(e) => setEditingTopicRule((prev) => prev ? { ...prev, frequency_days: Number(e.target.value) } : prev)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm">Batch size</Label>
                  <Input
                    type="number" min={1} max={30}
                    value={editingTopicRule.batch_size || 5}
                    onChange={(e) => setEditingTopicRule((prev) => prev ? { ...prev, batch_size: Number(e.target.value) } : prev)}
                    className="mt-1"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-sm">Min coda pending</Label>
                  <Input
                    type="number" min={1} max={50}
                    value={editingTopicRule.min_queue_pending || 5}
                    onChange={(e) => setEditingTopicRule((prev) => prev ? { ...prev, min_queue_pending: Number(e.target.value) } : prev)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm">Piattaforme</Label>
                  <div className="flex gap-2 mt-1.5">
                    {(["facebook", "linkedin", "instagram"] as const).map((p) => {
                      const Icon = platformIcons[p]
                      const selected = editingTopicRule.platforms?.includes(p) || false
                      return (
                        <Button key={p} variant={selected ? "default" : "outline"} size="sm" className={`h-8 px-2 ${!selected ? 'bg-transparent' : ''}`}
                          onClick={() => {
                            setEditingTopicRule((prev) => {
                              if (!prev) return prev
                              const platforms = prev.platforms || []
                              return { ...prev, platforms: selected ? platforms.filter((x) => x !== p) : [...platforms, p] }
                            })
                          }}
                        >
                          <Icon className="h-3 w-3" />
                        </Button>
                      )
                    })}
                  </div>
                </div>
              </div>
              {/* Selezione account target */}
              {accounts.filter((a) => editingTopicRule.platforms?.includes(a.platform)).length > 0 && (
                <div>
                  <Label className="text-sm">Account destinatari <span className="text-muted-foreground font-normal">(vuoto = tutti gli account attivi)</span></Label>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {accounts
                      .filter((a) => a.is_active && editingTopicRule.platforms?.includes(a.platform))
                      .map((a) => {
                        const Icon = platformIcons[a.platform as keyof typeof platformIcons]
                        const selected = editingTopicRule.target_accounts?.includes(a.id) || false
                        return (
                          <Button
                            key={a.id}
                            variant={selected ? "default" : "outline"}
                            size="sm"
                            className={`h-7 text-[10px] px-2 ${!selected ? 'bg-transparent' : ''}`}
                            onClick={() => {
                              setEditingTopicRule((prev) => {
                                if (!prev) return prev
                                const targets = prev.target_accounts || []
                                return {
                                  ...prev,
                                  target_accounts: selected
                                    ? targets.filter((id) => id !== a.id)
                                    : [...targets, a.id],
                                }
                              })
                            }}
                          >
                            <Icon className="h-2.5 w-2.5 mr-1" />
                            {a.account_name}
                          </Button>
                        )
                      })}
                  </div>
                </div>
              )}
              <div>
                <Label className="text-sm">Fasce orarie (una per riga, formato HH:MM-HH:MM)</Label>
                <Textarea
                  value={(editingTopicRule.time_windows || []).map((tw) => typeof tw === "string" ? tw : `${tw.start}-${tw.end}`).join("\n")}
                  onChange={(e) => setEditingTopicRule((prev) => {
                    if (!prev) return prev
                    const parsed = e.target.value.split("\n").map(s => s.trim()).filter(Boolean).map(line => {
                      const [start, end] = line.split("-")
                      return start && end ? { start: start.trim(), end: end.trim() } : null
                    }).filter((x): x is { start: string; end: string } => x !== null)
                    return { ...prev, time_windows: parsed }
                  })}
                  placeholder={"09:00-12:00\n17:00-20:00"}
                  className="mt-1 font-mono text-sm"
                  rows={3}
                />
              </div>
              <div>
                <Label className="text-sm">Giorni esclusi dalla pubblicazione <span className="text-muted-foreground font-normal">(clicca per escludere)</span></Label>
                <div className="flex gap-1.5 mt-1.5">
                  {["Dom", "Lun", "Mar", "Mer", "Gio", "Ven", "Sab"].map((day, idx) => {
                    const selected = editingTopicRule.exclude_weekdays?.includes(idx) || false
                    return (
                      <Button key={idx} variant={selected ? "destructive" : "outline"} size="sm" className={`h-7 w-9 text-xs px-0 ${!selected ? 'bg-transparent' : ''}`}
                        onClick={() => {
                          setEditingTopicRule((prev) => {
                            if (!prev) return prev
                            const days = prev.exclude_weekdays || []
                            return { ...prev, exclude_weekdays: selected ? days.filter((d) => d !== idx) : [...days, idx] }
                          })
                        }}
                      >
                        {day}
                      </Button>
                    )
                  })}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-sm">Tono</Label>
                  <Select
                    value={editingTopicRule.tone || "professional"}
                    onValueChange={(v) => setEditingTopicRule((prev) => prev ? { ...prev, tone: v } : prev)}
                  >
                    <SelectTrigger className="mt-1 h-8 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional">Professionale</SelectItem>
                      <SelectItem value="friendly">Amichevole</SelectItem>
                      <SelectItem value="informative">Informativo</SelectItem>
                      <SelectItem value="engaging">Coinvolgente</SelectItem>
                      <SelectItem value="authoritative">Autorevole</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm">Link predefinito</Label>
                  <Input
                    value={editingTopicRule.link_url || ""}
                    onChange={(e) => setEditingTopicRule((prev) => prev ? { ...prev, link_url: e.target.value || null } : prev)}
                    placeholder="https://4bid.it/..."
                    className="mt-1"
                  />
                </div>
              </div>
              <div>
                <Label className="text-sm">Hashtag predefiniti (separati da spazio)</Label>
                <Input
                  value={(editingTopicRule.default_hashtags || []).join(" ")}
                  onChange={(e) => setEditingTopicRule((prev) => prev ? { ...prev, default_hashtags: e.target.value.split(/\s+/).filter(Boolean) } : prev)}
                  placeholder="#revenuemanagement #hotel #hospitality"
                  className="mt-1"
                />
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={editingTopicRule.include_hashtags ?? true}
                    onCheckedChange={(v) => setEditingTopicRule((prev) => prev ? { ...prev, include_hashtags: v } : prev)}
                  />
                  <Label className="text-sm">Includi hashtag</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={editingTopicRule.is_active ?? true}
                    onCheckedChange={(v) => setEditingTopicRule((prev) => prev ? { ...prev, is_active: v } : prev)}
                  />
                  <Label className="text-sm">Tema attivo</Label>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowTopicRuleDialog(false); setEditingTopicRule(null) }} className="bg-transparent">
              Annulla
            </Button>
            <Button onClick={saveTopicRule} disabled={isSavingTopicRule || !editingTopicRule?.topic_name}>
              {isSavingTopicRule ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {editingTopicRule?.id ? "Salva Modifiche" : "Crea Tema"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function PostCard({
  post,
  onApprove,
  onReject,
  onPublish,
  onEdit,
  onRepost,
  onRegenerate,
  isRegenerating,
}: {
  post: SocialPost
  onApprove?: () => void
  onReject?: () => void
  onPublish?: () => void
  onEdit?: () => void
  onRepost?: () => void
  onRegenerate?: () => void
  isRegenerating?: boolean
}) {
  const status = statusConfig[post.status] || statusConfig.draft
  const StatusIcon = status.icon
  const canEdit = ["draft", "pending_approval", "scheduled"].includes(post.status)
  const canRepost = post.status === "published" || post.status === "failed"

  const handlePublish = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (onPublish) {
      onPublish()
    }
  }

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

          {/* Link */}
          {post.link_url && (
            <a
              href={post.link_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-sm text-primary hover:underline"
            >
              <Link2 className="h-3.5 w-3.5" />
              {post.link_url.replace(/https?:\/\//, "").split("/")[0]}
              <ExternalLink className="h-3 w-3" />
            </a>
          )}

          {/* Meta - stacked on mobile */}
          <div className="text-[10px] sm:text-xs text-muted-foreground space-y-0.5 sm:space-y-0 sm:flex sm:gap-4">
            <span>{formatDateOnlyIT(post.created_at)}</span>
            {post.scheduled_for && (
              <span className="flex items-center gap-1 text-amber-600">
                <Clock className="h-3 w-3" />
                {formatDateTimeIT(post.scheduled_for)}
              </span>
            )}
            {post.status === "published" && post.published_at && (
              <span className="flex items-center gap-1 text-emerald-600">
                <CheckCircle2 className="h-3 w-3" />
                Pubblicato: {formatDateTimeIT(post.published_at)}
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
            {canRepost && onRepost && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRepost}
                className="flex-1 sm:flex-none h-7 text-[10px] sm:text-xs text-blue-600 border-blue-600 hover:bg-blue-50 bg-transparent"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Modifica e Ripubblica
              </Button>
            )}
            {onRegenerate && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRegenerate}
                disabled={isRegenerating}
                className="h-7 text-[10px] sm:text-xs bg-transparent"
              >
                {isRegenerating ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <RefreshCw className="h-3 w-3 mr-1" />}
                Rigenera
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
              <Button
                size="sm"
                onClick={handlePublish}
                onTouchEnd={handlePublish}
                className="flex-1 sm:flex-none h-7 text-[10px] sm:text-xs touch-manipulation"
              >
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
            {post.status === "failed" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => alert(`Errore: ${post.error_message}`)}
                className="h-7 w-7 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
              >
                <Eye className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
