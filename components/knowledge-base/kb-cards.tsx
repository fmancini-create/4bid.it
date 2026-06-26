import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { KB_BASE_PATH, type KBCategory } from "@/lib/knowledge-base"
import { KBIcon } from "./kb-icon"

/** Card di una categoria nella home della Knowledge Base. */
export function KBCategoryCard({ category }: { category: KBCategory }) {
  return (
    <Link
      href={`${KB_BASE_PATH}/${category.slug}`}
      className="group flex flex-col gap-3 rounded-xl border border-border bg-card p-6 transition-colors hover:border-primary-blue hover:bg-muted/40"
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary-blue/10 text-primary-blue">
        <KBIcon name={category.icon} className="h-5 w-5" />
      </span>
      <span className="flex items-center justify-between gap-2 text-lg font-semibold text-foreground">
        {category.name}
        <ArrowRight className="h-4 w-4 flex-shrink-0 text-primary-blue transition-transform group-hover:translate-x-1" />
      </span>
      <span className="text-sm text-muted-foreground leading-relaxed">{category.short}</span>
      <span className="mt-1 text-xs text-muted-foreground">
        {category.subcategories.length}{" "}
        {category.subcategories.length === 1 ? "sottocategoria" : "sottocategorie"}
      </span>
    </Link>
  )
}
