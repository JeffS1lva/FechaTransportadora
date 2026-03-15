"use client"

import { AppShell } from "@/components/app-shell"
import { ClosingsTable } from "@/components/closings/closings-table"
import { ClosingForm } from "@/components/closings/closing-form"
import { ImportDialog } from "@/components/closings/import-dialog"
import { useAuth } from "@/lib/auth-context"
import { Calculator, Eye, FileText } from "lucide-react"

export default function FechamentosPage() {
  const { user } = useAuth()
  const canManage = user?.role === "admin" || user?.role === "editor"

  return (
    <AppShell>
      <div className="space-y-4 sm:space-y-6  min-[1300px]:px-0">
        {/* Header responsivo */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-0">
          <div className="space-y-1  pt-15 sm:pt-15 md:pt-15 lg:p-0">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Calculator className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              </div>
              <h1 className="text-xl sm:text-2xl min-[1300px]:text-3xl font-bold">Fechamentos</h1>
            </div>
            <p className="text-sm text-muted-foreground pl-10 sm:pl-12">
              {canManage
                ? "Gerencie os fechamentos dos motoristas"
                : "Visualize os fechamentos dos motoristas"}
            </p>
          </div>

          {/* Ações - responsivas */}
          {canManage && (
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
              {/* Mobile: botões full width */}
              <div className="contents sm:hidden">
                <ImportDialog />
                <ClosingForm />
              </div>

              {/* Desktop: botões padrão */}
              <div className="hidden sm:flex gap-2">
                <ImportDialog />
                <ClosingForm />
              </div>
            </div>
          )}

          {/* View-only indicator para não-admins */}
          {!canManage && (
            <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg text-xs text-muted-foreground sm:ml-auto w-fit">
              <Eye className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">Modo visualização</span>
              <span className="sm:hidden">Somente visualização</span>
            </div>
          )}
        </div>

        {/* Tabela/Conteúdo */}
        <div className=" overflow-hidden">
          <ClosingsTable />
        </div>
      </div>
    </AppShell>
  )
}