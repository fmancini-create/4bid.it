"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Mail, ArrowLeft, CheckCircle2 } from "lucide-react"
import Link from "next/link"

export default function ForgotPasswordPage() {
  const params = useParams<{ slug: string }>()
  const slug = params?.slug
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  async function submit() {
    if (!email) return
    setLoading(true)
    try {
      await fetch("/api/ecomobility/tenant/password/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, email }),
      })
      setDone(true)
    } catch (e) {
      setDone(true) // sempre done per non rivelare presenza email
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-muted flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Recupera password</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {done ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-medium">Richiesta ricevuta</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Se l&apos;email è registrata, riceverai un link per reimpostare la password. Il link scade tra 24 ore.
                Controlla anche la cartella spam.
              </p>
              <Link href={`/ecomobility/${slug}/admin`} className="text-sm text-primary inline-flex items-center gap-1">
                <ArrowLeft className="h-3 w-3" /> Torna al login
              </Link>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Inserisci la tua email. Ti invieremo un link per reimpostare la password.
              </p>
              <div>
                <Label>Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="operatore@esempio.it"
                    className="pl-10"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && submit()}
                  />
                </div>
              </div>
              <Button className="w-full" onClick={submit} disabled={loading || !email}>
                {loading ? "Invio..." : "Invia link"}
              </Button>
              <Link
                href={`/ecomobility/${slug}/admin`}
                className="block text-center text-sm text-muted-foreground hover:text-foreground"
              >
                Torna al login
              </Link>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
