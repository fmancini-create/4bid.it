import {
  TrendingUp,
  BarChart3,
  Tag,
  Share2,
  Server,
  Brain,
  ShoppingCart,
  Workflow,
  FileText,
  BookOpen,
  type LucideIcon,
} from "lucide-react"

// Mappa nome→componente per le icone usate nella tassonomia KB.
const ICONS: Record<string, LucideIcon> = {
  TrendingUp,
  BarChart3,
  Tag,
  Share2,
  Server,
  Brain,
  ShoppingCart,
  Workflow,
  FileText,
  BookOpen,
}

export function KBIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICONS[name] ?? BookOpen
  return <Icon className={className} aria-hidden="true" />
}
