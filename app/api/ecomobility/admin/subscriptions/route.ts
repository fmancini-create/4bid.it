import { createAdminClient } from "@/lib/supabase/server-admin"
import { NextRequest, NextResponse } from "next/server"

export async function GET() {
  const supabase = createAdminClient()
  
  const { data, error } = await supabase
    .from("ecomobility_subscriptions")
    .select(`
      *,
      structure:ecomobility_structures(id, name, slug),
      plan:ecomobility_subscription_plans(*)
    `)
    .order("created_at", { ascending: false })
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { structure_id, plan_id, billing_cycle, status } = body
  
  if (!structure_id || !plan_id) {
    return NextResponse.json({ error: "Struttura e piano sono obbligatori" }, { status: 400 })
  }
  
  const supabase = createAdminClient()
  
  // Calcola periodo
  const now = new Date()
  const periodEnd = new Date(now)
  if (billing_cycle === "annual") {
    periodEnd.setFullYear(periodEnd.getFullYear() + 1)
  } else {
    periodEnd.setMonth(periodEnd.getMonth() + 1)
  }
  
  // Verifica se esiste già un abbonamento per questa struttura
  const { data: existing } = await supabase
    .from("ecomobility_subscriptions")
    .select("id")
    .eq("structure_id", structure_id)
    .limit(1)
  
  let data, error
  
  if (existing && existing.length > 0) {
    // Aggiorna esistente
    const result = await supabase
      .from("ecomobility_subscriptions")
      .update({
        plan_id,
        billing_cycle: billing_cycle || "monthly",
        status: status || "active",
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
        updated_at: now.toISOString()
      })
      .eq("structure_id", structure_id)
      .select(`
        *,
        plan:ecomobility_subscription_plans(*)
      `)
      .single()
    
    data = result.data
    error = result.error
  } else {
    // Crea nuovo
    const result = await supabase
      .from("ecomobility_subscriptions")
      .insert({
        structure_id,
        plan_id,
        billing_cycle: billing_cycle || "monthly",
        status: status || "active",
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString()
      })
      .select(`
        *,
        plan:ecomobility_subscription_plans(*)
      `)
      .single()
    
    data = result.data
    error = result.error
  }
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json(data)
}

export async function PUT(request: NextRequest) {
  const body = await request.json()
  const { id, ...updates } = body
  
  if (!id) {
    return NextResponse.json({ error: "ID abbonamento mancante" }, { status: 400 })
  }
  
  const supabase = createAdminClient()
  
  const { data, error } = await supabase
    .from("ecomobility_subscriptions")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select(`
      *,
      plan:ecomobility_subscription_plans(*)
    `)
    .single()
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json(data)
}
