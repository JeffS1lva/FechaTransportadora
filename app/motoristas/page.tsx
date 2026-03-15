"use client"

import { AppShell } from "@/components/app-shell"
import { DriversTable } from "@/components/drivers/drivers-table"
import { DriverForm } from "@/components/drivers/driver-form"
import { ImportDriverDialog } from "@/components/drivers/import-driver-dialog"
import { useAuth } from "@/lib/auth-context"

export default function MotoristasPage() {
  const { user } = useAuth()
  const canManage = user?.role === "admin" || user?.role === "editor"

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Motoristas</h1>
            <p className="text-muted-foreground">
              Gerencie os motoristas cadastrados
            </p>
          </div>
          {canManage && (
            <div className="flex gap-2">
              <ImportDriverDialog />
              <DriverForm />
            </div>
          )}
        </div>

        <DriversTable />
      </div>
    </AppShell>
  )
}
