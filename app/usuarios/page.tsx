"use client"

import { AppShell } from "@/components/app-shell"
import { UsersTable } from "@/components/users/users-table"
import { UserForm } from "@/components/users/user-form"
import { useAuth } from "@/lib/auth-context"

export default function UsuariosPage() {
  const { user } = useAuth()
  const isAdmin = user?.role === "admin"

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Usuários</h1>
            <p className="text-muted-foreground">
              {isAdmin
                ? "Gerencie os usuários que podem acessar a plataforma"
                : "Você não tem permissão para acessar esta página."}
            </p>
          </div>
          {isAdmin && (
            <div className="flex gap-2">
              <UserForm />
            </div>
          )}
        </div>

        {isAdmin ? <UsersTable /> : null}
      </div>
    </AppShell>
  )
}
