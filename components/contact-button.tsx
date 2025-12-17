"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import type { ComponentProps } from "react"

interface ContactButtonProps extends Omit<ComponentProps<typeof Button>, "onClick"> {
  children: React.ReactNode
}

export function ContactButton({ children, ...props }: ContactButtonProps) {
  const router = useRouter()

  const handleClick = () => {
    if (window.location.pathname === "/") {
      // Already on homepage, just scroll to contact
      const contactElement = document.getElementById("contact")
      if (contactElement) {
        contactElement.scrollIntoView({ behavior: "smooth", block: "start" })
      }
    } else {
      // Navigate to homepage first, then scroll
      router.push("/#contact")
      // Wait for navigation and scroll
      setTimeout(() => {
        const contactElement = document.getElementById("contact")
        if (contactElement) {
          contactElement.scrollIntoView({ behavior: "smooth", block: "start" })
        }
      }, 100)
    }
  }

  return (
    <Button {...props} onClick={handleClick}>
      {children}
    </Button>
  )
}
