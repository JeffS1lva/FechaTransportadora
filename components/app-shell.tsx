"use client"

import { useAuth } from "@/lib/auth-context"
import { LoginForm } from "./login-form"
import { AppSidebar } from "./app-sidebar"
import { Spinner } from "@/components/ui/spinner"

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!user) {
    return <LoginForm />
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-6">{children}</div>
      </main>
    </div>
  )
}
