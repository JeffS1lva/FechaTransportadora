// app/page.tsx (HomePage)
"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { LoginForm } from "@/components/login-form"
import { Spinner } from "@/components/ui/spinner"

export default function HomePage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && user) {
      router.push("/dashboard")
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background p-4">
        <div className="flex flex-col items-center gap-4">
          <Spinner size="lg" />
          <p className="text-sm text-muted-foreground animate-pulse">
            Carregando...
          </p>
        </div>
      </div>
    )
  }

  if (user) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background p-4">
        <div className="flex flex-col items-center gap-4">
          <Spinner size="lg" />
          <p className="text-sm text-muted-foreground">
            Redirecionando...
          </p>
        </div>
      </div>
    )
  }

  return (
    <main className="flex-1 flex items-center justify-center bg-background p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-100 mx-auto">
        <LoginForm />
      </div>
    </main>
  )
}