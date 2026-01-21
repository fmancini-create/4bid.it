import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server-admin"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createAdminClient()

  console.log("[v0] Financials GET - id:", id)

  const { data, error } = await supabase
    .from("business_plan_financials")
    .select("*")
    .eq("business_plan_id", id)
    .order("year", { ascending: true })

  console.log("[v0] Financials GET - data:", data?.length || 0, "records")

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Map year to year_number for compatibility with frontend
  const mappedData = data?.map(d => ({ ...d, year_number: d.year })) || []
  return NextResponse.json(mappedData)
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createAdminClient()
  const body = await request.json()

  // Use year from body (frontend sends year_number, we map it to year)
  const yearValue = body.year_number || body.year || 1

  const { data, error } = await supabase
    .from("business_plan_financials")
    .upsert(
      {
        business_plan_id: id,
        year: yearValue,
        occupancy_rate: body.occupancy_rate || 65.0,
        adr: body.adr || 180.0,
        // Room-related
        room_cost_pct: body.room_cost_pct || 25.0,
        // F&B
        fb_revenue_per_room_night: body.fb_revenue_per_room_night || 0,
        fb_cost_pct: body.fb_cost_pct || 35.0,
        fb_revenue_mode: body.fb_revenue_mode || 'pct_rooms',
        fb_internal_pct: body.fb_internal_pct || 50,
        fb_internal_avg_spend: body.fb_internal_avg_spend || 45,
        fb_external_covers: body.fb_external_covers || 30,
        fb_external_avg_spend: body.fb_external_avg_spend || 55,
        fb_revenue_absolute: body.fb_revenue_absolute || 0,
        // SPA
        spa_revenue_per_room_night: body.spa_revenue_per_room_night || 0,
        spa_cost_pct: body.spa_cost_pct || 40.0,
        spa_revenue_mode: body.spa_revenue_mode || 'pct_rooms',
        spa_treatments_internal_pct: body.spa_treatments_internal_pct || 15,
        spa_treatments_internal_avg: body.spa_treatments_internal_avg || 80,
        spa_treatments_external_clients: body.spa_treatments_external_clients || 10,
        spa_treatments_external_avg: body.spa_treatments_external_avg || 100,
        spa_entries_internal_pct: body.spa_entries_internal_pct || 20,
        spa_entries_internal_avg: body.spa_entries_internal_avg || 25,
        spa_entries_external_clients: body.spa_entries_external_clients || 15,
        spa_entries_external_avg: body.spa_entries_external_avg || 35,
        spa_revenue_absolute: body.spa_revenue_absolute || 0,
        spa_treatments_cost_pct: body.spa_treatments_cost_pct || 30,
        spa_entries_cost_pct: body.spa_entries_cost_pct || 15,
        // Congress
        congress_revenue_mode: body.congress_revenue_mode || 'detailed',
        congress_events_year: body.congress_events_year || 20,
        congress_avg_revenue: body.congress_avg_revenue || 5000,
        congress_revenue_absolute: body.congress_revenue_absolute || 0,
        // Bar
        bar_revenue_mode: body.bar_revenue_mode || 'detailed',
        bar_internal_pct: body.bar_internal_pct || 40,
        bar_internal_avg_spend: body.bar_internal_avg_spend || 15,
        bar_external_clients: body.bar_external_clients || 20,
        bar_external_avg_spend: body.bar_external_avg_spend || 20,
        bar_revenue_absolute: body.bar_revenue_absolute || 0,
        bar_cost_pct: body.bar_cost_pct || 30,
        // Bistrot
        bistrot_revenue_mode: body.bistrot_revenue_mode || 'detailed',
        bistrot_internal_pct: body.bistrot_internal_pct || 30,
        bistrot_internal_avg_spend: body.bistrot_internal_avg_spend || 25,
        bistrot_external_clients: body.bistrot_external_clients || 40,
        bistrot_external_avg_spend: body.bistrot_external_avg_spend || 30,
        bistrot_revenue_absolute: body.bistrot_revenue_absolute || 0,
        bistrot_cost_pct: body.bistrot_cost_pct || 35,
        // Gym
        gym_revenue_mode: body.gym_revenue_mode || 'detailed',
        gym_internal_pct: body.gym_internal_pct || 25,
        gym_internal_avg: body.gym_internal_avg || 10,
        gym_external_clients: body.gym_external_clients || 15,
        gym_external_avg: body.gym_external_avg || 15,
        gym_revenue_absolute: body.gym_revenue_absolute || 0,
        gym_cost_pct: body.gym_cost_pct || 20,
        // Pool
        pool_revenue_mode: body.pool_revenue_mode || 'detailed',
        pool_external_entries: body.pool_external_entries || 30,
        pool_external_avg: body.pool_external_avg || 20,
        pool_revenue_absolute: body.pool_revenue_absolute || 0,
        pool_cost_pct: body.pool_cost_pct || 25,
        pool_external_cost_pct: body.pool_external_cost_pct || 15,
        // Parking
        parking_revenue_mode: body.parking_revenue_mode || 'detailed',
        parking_internal_pct: body.parking_internal_pct || 60,
        parking_internal_avg: body.parking_internal_avg || 15,
        parking_external_spaces: body.parking_external_spaces || 10,
        parking_external_days: body.parking_external_days || 200,
        parking_external_avg: body.parking_external_avg || 20,
        parking_revenue_absolute: body.parking_revenue_absolute || 0,
        parking_cost_pct: body.parking_cost_pct || 10,
        // Laundry
        laundry_revenue_mode: body.laundry_revenue_mode || 'detailed',
        laundry_internal_pct: body.laundry_internal_pct || 20,
        laundry_internal_avg: body.laundry_internal_avg || 12,
        laundry_revenue_absolute: body.laundry_revenue_absolute || 0,
        laundry_cost_pct: body.laundry_cost_pct || 40,
        // Rentals
        rentals_revenue_mode: body.rentals_revenue_mode || 'detailed',
        rentals_internal_pct: body.rentals_internal_pct || 15,
        rentals_internal_avg: body.rentals_internal_avg || 30,
        rentals_external_clients: body.rentals_external_clients || 10,
        rentals_external_avg: body.rentals_external_avg || 40,
        rentals_revenue_absolute: body.rentals_revenue_absolute || 0,
        rentals_cost_pct: body.rentals_cost_pct || 25,
        // NCC
        ncc_revenue_mode: body.ncc_revenue_mode || 'detailed',
        ncc_internal_pct: body.ncc_internal_pct || 10,
        ncc_internal_avg: body.ncc_internal_avg || 50,
        ncc_external_trips: body.ncc_external_trips || 100,
        ncc_external_avg: body.ncc_external_avg || 80,
        ncc_revenue_absolute: body.ncc_revenue_absolute || 0,
        ncc_cost_pct: body.ncc_cost_pct || 45,
        // Rental income (affitti)
        restaurant_rental_income: body.restaurant_rental_income || 0,
        spa_rental_income: body.spa_rental_income || 0,
        congress_rental_income: body.congress_rental_income || 0,
        bar_rental_income: body.bar_rental_income || 0,
        bistrot_rental_income: body.bistrot_rental_income || 0,
        gym_rental_income: body.gym_rental_income || 0,
        pool_rental_income: body.pool_rental_income || 0,
        parking_rental_income: body.parking_rental_income || 0,
        laundry_rental_income: body.laundry_rental_income || 0,
        rentals_rental_income: body.rentals_rental_income || 0,
        ncc_rental_income: body.ncc_rental_income || 0,
        // Staff costs
        staff_cost_monthly: body.staff_cost_monthly || 0,
        // Fixed costs
        rent_cost_monthly: body.rent_cost_monthly || 15000,
        utilities_cost_monthly: body.utilities_cost_monthly || 10000,
        maintenance_cost_monthly: body.maintenance_cost_monthly || 5000,
        insurance_cost_monthly: body.insurance_cost_monthly || 3000,
        marketing_cost_monthly: body.marketing_cost_monthly || 7000,
        admin_cost_monthly: body.admin_cost_monthly || 4000,
        other_fixed_monthly: body.other_fixed_monthly || 2500,
        // OTA
        ota_commission_pct: body.ota_commission_pct || 15,
        ota_share_pct: body.ota_share_pct || 40,
        // Investment and depreciation
        initial_investment: body.initial_investment || 0,
        depreciation_years: body.depreciation_years || 20,
        loan_amount: body.loan_amount || 0,
        loan_interest_rate: body.loan_interest_rate || 4,
        loan_years: body.loan_years || 15,
      },
      {
        onConflict: "business_plan_id,year",
      },
    )
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Map year to year_number for compatibility
  return NextResponse.json({ ...data, year_number: data.year })
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createAdminClient()
  const body = await request.json()

  // Map year_number to year for database
  const yearValue = body.year_number || body.year || 1

  // Only include valid columns from business_plan_financials table
  const validFields: Record<string, unknown> = {
    business_plan_id: id,
    year: yearValue,
    // Core metrics
    occupancy_rate: body.occupancy_rate,
    adr: body.adr,
    room_cost_pct: body.room_cost_pct,
    // F&B
    fb_revenue_per_room_night: body.fb_revenue_per_room_night,
    fb_cost_pct: body.fb_cost_pct,
    fb_revenue_mode: body.fb_revenue_mode,
    fb_internal_pct: body.fb_internal_pct,
    fb_internal_avg_spend: body.fb_internal_avg_spend,
    fb_external_covers: body.fb_external_covers,
    fb_external_avg_spend: body.fb_external_avg_spend,
    fb_revenue_absolute: body.fb_revenue_absolute,
    // SPA
    spa_revenue_per_room_night: body.spa_revenue_per_room_night,
    spa_cost_pct: body.spa_cost_pct,
    spa_revenue_mode: body.spa_revenue_mode,
    spa_treatments_internal_pct: body.spa_treatments_internal_pct,
    spa_treatments_internal_avg: body.spa_treatments_internal_avg,
    spa_treatments_external_clients: body.spa_treatments_external_clients,
    spa_treatments_external_avg: body.spa_treatments_external_avg,
    spa_entries_internal_pct: body.spa_entries_internal_pct,
    spa_entries_internal_avg: body.spa_entries_internal_avg,
    spa_entries_external_clients: body.spa_entries_external_clients,
    spa_entries_external_avg: body.spa_entries_external_avg,
    spa_revenue_absolute: body.spa_revenue_absolute,
    spa_treatments_cost_pct: body.spa_treatments_cost_pct,
    spa_entries_cost_pct: body.spa_entries_cost_pct,
    // Congress
    congress_revenue_mode: body.congress_revenue_mode,
    congress_events_year: body.congress_events_year,
    congress_avg_revenue: body.congress_avg_revenue,
    congress_revenue_absolute: body.congress_revenue_absolute,
    // Bar
    bar_revenue_mode: body.bar_revenue_mode,
    bar_internal_pct: body.bar_internal_pct,
    bar_internal_avg_spend: body.bar_internal_avg_spend,
    bar_external_clients: body.bar_external_clients,
    bar_external_avg_spend: body.bar_external_avg_spend,
    bar_revenue_absolute: body.bar_revenue_absolute,
    bar_cost_pct: body.bar_cost_pct,
    // Bistrot
    bistrot_revenue_mode: body.bistrot_revenue_mode,
    bistrot_internal_pct: body.bistrot_internal_pct,
    bistrot_internal_avg_spend: body.bistrot_internal_avg_spend,
    bistrot_external_clients: body.bistrot_external_clients,
    bistrot_external_avg_spend: body.bistrot_external_avg_spend,
    bistrot_revenue_absolute: body.bistrot_revenue_absolute,
    bistrot_cost_pct: body.bistrot_cost_pct,
    // Gym
    gym_revenue_mode: body.gym_revenue_mode,
    gym_internal_pct: body.gym_internal_pct,
    gym_internal_avg: body.gym_internal_avg,
    gym_external_clients: body.gym_external_clients,
    gym_external_avg: body.gym_external_avg,
    gym_revenue_absolute: body.gym_revenue_absolute,
    gym_cost_pct: body.gym_cost_pct,
    // Pool
    pool_revenue_mode: body.pool_revenue_mode,
    pool_external_entries: body.pool_external_entries,
    pool_external_avg: body.pool_external_avg,
    pool_revenue_absolute: body.pool_revenue_absolute,
    pool_cost_pct: body.pool_cost_pct,
    pool_external_cost_pct: body.pool_external_cost_pct,
    // Parking
    parking_revenue_mode: body.parking_revenue_mode,
    parking_internal_pct: body.parking_internal_pct,
    parking_internal_avg: body.parking_internal_avg,
    parking_external_spaces: body.parking_external_spaces,
    parking_external_days: body.parking_external_days,
    parking_external_avg: body.parking_external_avg,
    parking_revenue_absolute: body.parking_revenue_absolute,
    parking_cost_pct: body.parking_cost_pct,
    // Laundry
    laundry_revenue_mode: body.laundry_revenue_mode,
    laundry_internal_pct: body.laundry_internal_pct,
    laundry_internal_avg: body.laundry_internal_avg,
    laundry_revenue_absolute: body.laundry_revenue_absolute,
    laundry_cost_pct: body.laundry_cost_pct,
    // Rentals
    rentals_revenue_mode: body.rentals_revenue_mode,
    rentals_internal_pct: body.rentals_internal_pct,
    rentals_internal_avg: body.rentals_internal_avg,
    rentals_external_clients: body.rentals_external_clients,
    rentals_external_avg: body.rentals_external_avg,
    rentals_revenue_absolute: body.rentals_revenue_absolute,
    rentals_cost_pct: body.rentals_cost_pct,
    // NCC
    ncc_revenue_mode: body.ncc_revenue_mode,
    ncc_internal_pct: body.ncc_internal_pct,
    ncc_internal_avg: body.ncc_internal_avg,
    ncc_external_trips: body.ncc_external_trips,
    ncc_external_avg: body.ncc_external_avg,
    ncc_revenue_absolute: body.ncc_revenue_absolute,
    ncc_cost_pct: body.ncc_cost_pct,
    // Rental income (affitti)
    restaurant_rental_income: body.restaurant_rental_income,
    spa_rental_income: body.spa_rental_income,
    congress_rental_income: body.congress_rental_income,
    bar_rental_income: body.bar_rental_income,
    bistrot_rental_income: body.bistrot_rental_income,
    gym_rental_income: body.gym_rental_income,
    pool_rental_income: body.pool_rental_income,
    parking_rental_income: body.parking_rental_income,
    laundry_rental_income: body.laundry_rental_income,
    rentals_rental_income: body.rentals_rental_income,
    ncc_rental_income: body.ncc_rental_income,
    // Staff costs
    staff_cost_monthly: body.staff_cost_monthly,
    staff_bar_cost: body.staff_bar_cost,
    staff_bistrot_cost: body.staff_bistrot_cost,
    staff_gym_cost: body.staff_gym_cost,
    staff_pool_cost: body.staff_pool_cost,
    staff_parking_cost: body.staff_parking_cost,
    staff_laundry_cost: body.staff_laundry_cost,
    staff_rentals_cost: body.staff_rentals_cost,
    staff_ncc_cost: body.staff_ncc_cost,
    // Fixed costs
    rent_cost_monthly: body.rent_cost_monthly,
    utilities_cost_monthly: body.utilities_cost_monthly,
    maintenance_cost_monthly: body.maintenance_cost_monthly,
    insurance_cost_monthly: body.insurance_cost_monthly,
    marketing_cost_monthly: body.marketing_cost_monthly,
    admin_cost_monthly: body.admin_cost_monthly,
    other_fixed_monthly: body.other_fixed_monthly,
    // OTA
    ota_commission_pct: body.ota_commission_pct,
    ota_share_pct: body.ota_share_pct,
    // Investment and depreciation
    initial_investment: body.initial_investment,
    depreciation_years: body.depreciation_years,
    loan_amount: body.loan_amount,
    loan_interest_rate: body.loan_interest_rate,
    loan_years: body.loan_years,
  }

  // Remove undefined values
  const cleanedFields = Object.fromEntries(
    Object.entries(validFields).filter(([, v]) => v !== undefined)
  )

  const { data, error } = await supabase
    .from("business_plan_financials")
    .upsert(cleanedFields)
    .select()
    .single()

  if (error) {
    console.error("[v0] Error saving financials:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Map year to year_number for compatibility with frontend
  return NextResponse.json({ ...data, year_number: data.year })
}
