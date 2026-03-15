"use client"

import { AppShell } from "@/components/app-shell"
import { StatsCards } from "@/components/dashboard/stats-cards"
import { DeliveriesChart, FinancialChart, StatusDonutChart, HoursChart } from "@/components/dashboard/charts"
import { RecentClosings } from "@/components/dashboard/recent-closings"

export default function DashboardPage() {
  return (
    <AppShell>
      <div className="space-y-6 pt-15 sm:pt-15 md:pt-15 lg:p-0">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground pt-3">
            Visão geral dos fechamentos e métricas
          </p>
        </div>

        <StatsCards />

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <DeliveriesChart />
          <FinancialChart />
        </div>



        <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
          <StatusDonutChart />
          <HoursChart />
          <div className="col-span-1 lg:col-span-2">
            <RecentClosings />
          </div>
        </div>
      </div>
    </AppShell>
  )
}
