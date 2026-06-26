import { createAdminClient } from "@/lib/supabase/server-admin"
import { NextRequest, NextResponse } from "next/server"

export async function GET() {
  const supabase = createAdminClient()
  
  const { data, error } = await supabase
    .from("ecomobility_invoices")
    .select(`
      *,
      structure:ecomobility_structures(id, name, slug, email)
    `)
    .order("created_at", { ascending: false })
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { structure_id, period_start, period_end, platform_fee, devices_fee, transactions_fee, notes } = body
  
  if (!structure_id || !period_start || !period_end) {
    return NextResponse.json({ error: "Struttura e periodo sono obbligatori" }, { status: 400 })
  }
  
  const supabase = createAdminClient()
  
  // Genera numero fattura
  const year = new Date().getFullYear()
  const { count } = await supabase
    .from("ecomobility_invoices")
    .select("*", { count: "exact", head: true })
  
  const invoiceNumber = `ECO-${year}-${String((count || 0) + 1).padStart(5, "0")}`
  
  // Calcola totali
  const subtotal = (platform_fee || 0) + (devices_fee || 0) + (transactions_fee || 0)
  const vatRate = 22
  const vatAmount = subtotal * (vatRate / 100)
  const total = subtotal + vatAmount
  
  // Data scadenza: 30 giorni da oggi
  const dueDate = new Date()
  dueDate.setDate(dueDate.getDate() + 30)
  
  const { data, error } = await supabase
    .from("ecomobility_invoices")
    .insert({
      structure_id,
      invoice_number: invoiceNumber,
      period_start,
      period_end,
      platform_fee: platform_fee || 0,
      devices_fee: devices_fee || 0,
      transactions_fee: transactions_fee || 0,
      subtotal,
      vat_rate: vatRate,
      vat_amount: vatAmount,
      total,
      status: "draft",
      due_date: dueDate.toISOString().split("T")[0],
      notes
    })
    .select(`
      *,
      structure:ecomobility_structures(id, name, slug, email)
    `)
    .single()
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json(data)
}

export async function PUT(request: NextRequest) {
  const body = await request.json()
  const { id, status, ...updates } = body
  
  if (!id) {
    return NextResponse.json({ error: "ID fattura mancante" }, { status: 400 })
  }
  
  const supabase = createAdminClient()
  
  const updateData: Record<string, unknown> = { ...updates }
  
  if (status) {
    updateData.status = status
    if (status === "paid") {
      updateData.paid_at = new Date().toISOString()
    }
  }
  
  const { data, error } = await supabase
    .from("ecomobility_invoices")
    .update(updateData)
    .eq("id", id)
    .select(`
      *,
      structure:ecomobility_structures(id, name, slug, email)
    `)
    .single()
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json(data)
}
