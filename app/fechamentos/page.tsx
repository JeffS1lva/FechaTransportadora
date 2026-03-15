"use client"

import { AppShell } from "@/components/app-shell"
import { ClosingsTable } from "@/components/closings/closings-table"
import { ClosingForm } from "@/components/closings/closing-form"
import { ImportDialog } from "@/components/closings/import-dialog"
import { useAuth } from "@/lib/auth-context"

export default function FechamentosPage() {
  const { user } = useAuth()
  const canManage = user?.role === "admin" || user?.role === "editor"

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Fechamentos</h1>
            <p className="text-muted-foreground">
              {canManage
                ? "Gerencie os fechamentos dos motoristas"
                : "Visualize os fechamentos dos motoristas"}
            </p>
          </div>
          {canManage && (
            <div className="flex gap-2">
              <ImportDialog />
              <ClosingForm />
            </div>
          )}
        </div>

        <ClosingsTable />
      </div>
    </AppShell>
  )
}
