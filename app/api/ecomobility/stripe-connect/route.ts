import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { createAdminClient } from "@/lib/supabase/server"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

// GET: Ottieni stato connessione Stripe della struttura
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const structureId = searchParams.get("structure_id")

  if (!structureId) {
    return NextResponse.json({ error: "structure_id richiesto" }, { status: 400 })
  }

  const supabase = createAdminClient()

  const { data: structure } = await supabase
    .from("ecomobility_structures")
    .select("stripe_account_id, stripe_onboarding_complete")
    .eq("id", structureId)
    .single()

  if (!structure) {
    return NextResponse.json({ error: "Struttura non trovata" }, { status: 404 })
  }

  // Se ha un account Stripe, verifica lo stato
  if (structure.stripe_account_id) {
    try {
      const account = await stripe.accounts.retrieve(structure.stripe_account_id)
      return NextResponse.json({
        connected: true,
        account_id: structure.stripe_account_id,
        charges_enabled: account.charges_enabled,
        payouts_enabled: account.payouts_enabled,
        details_submitted: account.details_submitted,
        business_name: account.business_profile?.name || account.settings?.dashboard?.display_name,
      })
    } catch (error) {
      return NextResponse.json({ connected: false, account_id: null })
    }
  }

  return NextResponse.json({ connected: false, account_id: null })
}

// POST: Crea account Stripe Connect e genera link onboarding
export async function POST(request: NextRequest) {
  const body = await request.json()
  const { structure_id, structure_name, structure_email } = body

  if (!structure_id) {
    return NextResponse.json({ error: "structure_id richiesto" }, { status: 400 })
  }

  const supabase = createAdminClient()

  // Verifica se la struttura ha già un account Stripe
  const { data: structure } = await supabase
    .from("ecomobility_structures")
    .select("stripe_account_id, name, email")
    .eq("id", structure_id)
    .single()

  if (!structure) {
    return NextResponse.json({ error: "Struttura non trovata" }, { status: 404 })
  }

  let accountId = structure.stripe_account_id

  // Se non ha un account, crealo
  if (!accountId) {
    const account = await stripe.accounts.create({
      type: "express", // Express è più semplice per le strutture
      country: "IT",
      email: structure_email || structure.email,
      business_type: "company",
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_profile: {
        name: structure_name || structure.name,
        mcc: "7011", // Hotels and motels
      },
      metadata: {
        structure_id: structure_id,
        platform: "4bid_ecomobility",
      },
    })

    accountId = account.id

    // Salva l'account ID nella struttura
    await supabase
      .from("ecomobility_structures")
      .update({ 
        stripe_account_id: accountId,
        stripe_onboarding_complete: false,
      })
      .eq("id", structure_id)
  }

  // Genera link di onboarding
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://4bid.it"
  
  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${baseUrl}/admin/ecomobility?tab=settings&stripe_refresh=true`,
    return_url: `${baseUrl}/admin/ecomobility?tab=settings&stripe_success=true`,
    type: "account_onboarding",
  })

  return NextResponse.json({
    account_id: accountId,
    onboarding_url: accountLink.url,
  })
}

// DELETE: Scollega account Stripe
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const structureId = searchParams.get("structure_id")

  if (!structureId) {
    return NextResponse.json({ error: "structure_id richiesto" }, { status: 400 })
  }

  const supabase = createAdminClient()

  // Rimuovi il collegamento (non elimina l'account Stripe, solo il riferimento)
  await supabase
    .from("ecomobility_structures")
    .update({ 
      stripe_account_id: null,
      stripe_onboarding_complete: false,
    })
    .eq("id", structureId)

  return NextResponse.json({ success: true })
}
