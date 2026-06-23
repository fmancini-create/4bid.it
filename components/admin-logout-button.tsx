"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"

export default function AdminLogoutButton() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogout = async () => {
    setIsLoading(true)
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
      router.push("/admin/login")
      router.refresh()
    } catch (error) {
      console.error("[v0] Admin logout error:", error)
      setIsLoading(false)
    }
  }

  return (
    <Button
      type="button"
      onClick={handleLogout}
      disabled={isLoading}
      variant="destructive"
      size="sm"
      className="h-8 w-8 sm:w-auto px-0 sm:px-3"
    >
      <span className="hidden sm:inline">{isLoading ? "Uscita..." : "Esci"}</span>
      <span className="sm:hidden text-xs">X</span>
    </Button>
  )
}
