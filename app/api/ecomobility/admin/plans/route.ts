import { createAdminClient } from "@/lib/supabase/server-admin"
import { NextRequest, NextResponse } from "next/server"

export async function GET() {
  const supabase = createAdminClient()
  
  const { data, error } = await supabase
    .from("ecomobility_subscription_plans")
    .select("*")
    .order("monthly_fee", { ascending: true })
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { name, description, monthly_fee, annual_fee, device_fee_monthly, transaction_fee_pct, max_vehicles, max_devices, features, is_active } = body
  
  if (!name || !monthly_fee) {
    return NextResponse.json({ error: "Nome e canone mensile sono obbligatori" }, { status: 400 })
  }
  
  const supabase = createAdminClient()
  
  const { data, error } = await supabase
    .from("ecomobility_subscription_plans")
    .insert({
      name,
      description,
      monthly_fee,
      annual_fee: annual_fee || monthly_fee * 10,
      device_fee_monthly: device_fee_monthly || 5,
      transaction_fee_pct: transaction_fee_pct || 5,
      max_vehicles: max_vehicles || null,
      max_devices: max_devices || null,
      features: features || [],
      is_active: is_active !== false
    })
    .select()
    .single()
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json(data)
}

export async function PUT(request: NextRequest) {
  const body = await request.json()
  const { id, ...updates } = body
  
  if (!id) {
    return NextResponse.json({ error: "ID piano mancante" }, { status: 400 })
  }
  
  const supabase = createAdminClient()
  
  const { data, error } = await supabase
    .from("ecomobility_subscription_plans")
    .update(updates)
    .eq("id", id)
    .select()
    .single()
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json(data)
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")
  
  if (!id) {
    return NextResponse.json({ error: "ID piano mancante" }, { status: 400 })
  }
  
  const supabase = createAdminClient()
  
  // Verifica se ci sono abbonamenti attivi con questo piano
  const { data: subs } = await supabase
    .from("ecomobility_subscriptions")
    .select("id")
    .eq("plan_id", id)
    .eq("status", "active")
    .limit(1)
  
  if (subs && subs.length > 0) {
    return NextResponse.json({ error: "Impossibile eliminare: ci sono abbonamenti attivi con questo piano" }, { status: 400 })
  }
  
  const { error } = await supabase
    .from("ecomobility_subscription_plans")
    .delete()
    .eq("id", id)
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json({ success: true })
}
