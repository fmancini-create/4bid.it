"use client"

import { useEffect, useState } from "react"
import { useParams, useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Lock, AlertCircle, CheckCircle2 } from "lucide-react"
import Link from "next/link"

type TokenInfo =
  | { valid: true; type: "invite" | "reset"; operator: { email: string; name?: string; structure_name?: string } }
  | { valid: false; reason?: string }

export default function ResetPasswordPage() {
  const params = useParams<{ slug: string }>()
  const slug = params?.slug
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get("token") || ""

  const [info, setInfo] = useState<TokenInfo | null>(null)
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (!token) {
      setInfo({ valid: false })
      return
    }
    fetch(`/api/ecomobility/tenant/password/confirm?token=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then(setInfo)
      .catch(() => setInfo({ valid: false }))
  }, [token])

  async function submit() {
    setError(null)
    if (password.length < 8) {
      setError("La password deve essere di almeno 8 caratteri")
      return
    }
    if (password !== confirm) {
      setError("Le password non coincidono")
      return
    }
    setSubmitting(true)
    try {
      const r = await fetch("/api/ecomobility/tenant/password/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      })
      const j = await r.json()
      if (!r.ok) {
        setError(j.error || "Errore")
      } else {
        setDone(true)
        setTimeout(() => router.push(`/ecomobility/${slug}/admin`), 2000)
      }
    } catch (e: any) {
      setError(e?.message || "Errore di rete")
    } finally {
      setSubmitting(false)
    }
  }

  if (info === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted">
        <p className="text-muted-foreground">Verifica del link in corso...</p>
      </div>
    )
  }

  if (!info.valid) {
    const reason =
      info.reason === "expired"
        ? "Il link è scaduto"
        : info.reason === "used"
        ? "Il link è già stato utilizzato"
        : "Link non valido"
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <span className="font-medium">{reason}</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Richiedi un nuovo link dalla pagina di recupero password.
            </p>
            <Link
              href={`/ecomobility/${slug}/admin/forgot-password`}
              className="text-sm text-primary inline-block"
            >
              Richiedi nuovo link
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{info.type === "invite" ? "Imposta password" : "Reimposta password"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {done ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-medium">Password salvata</span>
              </div>
              <p className="text-sm text-muted-foreground">Reindirizzamento al login...</p>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Ciao {info.operator.name || info.operator.email}, scegli una nuova password per accedere a{" "}
                <strong>{info.operator.structure_name}</strong>.
              </p>
              <div>
                <Label>Nuova password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="password"
                    className="pl-10"
                    placeholder="Almeno 8 caratteri"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <Label>Conferma password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="password"
                    className="pl-10"
                    placeholder="Ripeti password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && submit()}
                  />
                </div>
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button className="w-full" onClick={submit} disabled={submitting || !password || !confirm}>
                {submitting ? "Salvataggio..." : "Salva password"}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
