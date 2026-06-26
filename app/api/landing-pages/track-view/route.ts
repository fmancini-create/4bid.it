import { NextResponse } from "next/server"

// Non-critical tracking endpoint — always returns 200
export async function POST() {
  return NextResponse.json({ success: true })
}
