"use client"

import { quoteBrand } from "@/lib/quotes/branding"

export function ProjectBrand({ project, compact = false }: { project?: string | null; compact?: boolean }) {
  const brand = quoteBrand(project)
  return (
    <div className="flex min-w-0 items-center gap-3">
      {brand.logo ? (
        <img
          src={brand.logo}
          alt={brand.name}
          className={compact ? "h-7 w-auto max-w-[126px] object-contain" : "h-9 w-auto max-w-[170px] object-contain"}
        />
      ) : (
        <div className={`${compact ? "h-7 w-7 text-[10px]" : "h-9 w-9 text-xs"} flex shrink-0 items-center justify-center rounded-lg border bg-background font-black tracking-tight shadow-sm`}>
          {brand.short}
        </div>
      )}
      {!brand.logo ? <span className={`${compact ? "text-xs" : "text-sm"} truncate font-bold`}>{brand.name}</span> : null}
    </div>
  )
}
