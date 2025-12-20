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
      const contactElement = document.getElementById("contact")
      if (contactElement) {
        contactElement.scrollIntoView({ behavior: "smooth", block: "start" })
      }
    } else {
      router.push("/#contact")
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
