import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getFederatedCatalog } from "@/lib/quotes/catalog"

const SUPER_ADMIN_EMAIL = "f.mancini@4bid.it"

function clampPct(value: unknown) {
  const pct = Number(value)
  if (!Number.isFinite(pct)) return null
  return Math.min(100, Math.max(0, Math.round(pct * 100) / 100))
}

function annualDiscountPct(item: any) {
  const explicit = clampPct(
    item?.alternative_period?.discount_pct
      ?? item?.configuration_schema?.annual_discount_pct
      ?? item?.raw_snapshot?.annual_discount_pct,
  )
  if (explicit != null) return explicit

  if (item?.billing_period !== "monthly" || item?.alternative_period?.billing_period !== "yearly") return 0
  const monthly = Number(item.unit_amount)
  const yearly = Number(item.alternative_period.unit_amount)
  if (!(monthly > 0) || !Number.isFinite(yearly) || yearly < 0) return 0
  return clampPct((1 - yearly / (monthly * 12)) * 100) ?? 0
}

function withAnnualDefaults(project: any) {
  return {
    ...project,
    items: (project.items || []).map((item: any) => {
      const pct = annualDiscountPct(item)
      const configuration = item.configuration_schema && typeof item.configuration_schema === "object"
        ? item.configuration_schema
        : {}
      const commercial = configuration.commercial && typeof configuration.commercial === "object"
        ? configuration.commercial
        : {}
      return {
        ...item,
        configuration_schema: {
          ...configuration,
          commercial: {
            ...commercial,
            annual_plan_discount_pct: pct,
          },
        },
      }
    }),
  }
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== SUPER_ADMIN_EMAIL) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
  }

  try {
    const projects = (await getFederatedCatalog()).map(withAnnualDefaults)
    return NextResponse.json({
      projects,
      items: projects.flatMap(project => project.items),
    })
  } catch (cause: any) {
    console.error("[quotes] Federated catalog error", cause)
    return NextResponse.json({ error: cause?.message ?? "Errore catalogo" }, { status: 500 })
  }
}
