"use client"

import { AppShell } from "@/components/app-shell"
import { UsersTable } from "@/components/users/users-table"
import { UserForm } from "@/components/users/user-form"
import { useAuth } from "@/lib/auth-context"
import { Shield, Users } from "lucide-react"

export default function UsuariosPage() {
  const { user } = useAuth()
  const isAdmin = user?.role === "admin"

  return (
    <AppShell>
      <div className="space-y-4 sm:space-y-6 ">
        {/* Header Responsivo */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
          <div className="min-w-0 pt-15 sm:pt-15 md:pt-15 lg:p-0">
            <div className="flex items-center gap-2 sm:gap-3 mb-1 ">
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Users className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              </div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold truncate">Usuários</h1>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground pl-10 sm:pl-13">
              {isAdmin
                ? "Gerencie os usuários que podem acessar a plataforma"
                : "Você não tem permissão para acessar esta página."}
            </p>
          </div>
          
          {isAdmin && (
            <div className="flex justify-end sm:justify-start  sm:pl-0">
              <UserForm />
            </div>
          )}
        </div>

        {/* Mensagem de acesso negado responsiva */}
        {!isAdmin && (
          <div className="flex flex-col items-center justify-center gap-3 sm:gap-4 py-12 sm:py-20 px-4">
            <div className="h-14 w-14 sm:h-20 sm:w-20 rounded-full bg-muted flex items-center justify-center">
              <Shield className="h-7 w-7 sm:h-10 sm:w-10 text-muted-foreground" />
            </div>
            <div className="text-center">
              <h3 className="text-base sm:text-lg font-semibold">Acesso restrito</h3>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                Apenas administradores podem visualizar esta página.
              </p>
            </div>
          </div>
        )}

        {/* Tabela/Cards de usuários */}
        {isAdmin ? <UsersTable /> : null}
      </div>
    </AppShell>
  )
}