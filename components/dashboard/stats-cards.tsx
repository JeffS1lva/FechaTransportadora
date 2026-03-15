"use client"

import { useData } from "@/lib/data-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, FileText, TrendingUp, Clock } from "lucide-react"

export function StatsCards() {
  const { drivers, closings } = useData()

  const activeDrivers = drivers.filter((d) => d.status === "active").length
  const pendingClosings = closings.filter((c) => c.status === "pending").length
  const totalNetValue = closings.reduce(
    (sum, c) => sum + c.financial.netValue,
    0
  )
  const totalHours = closings.reduce((sum, c) => sum + c.hours.total, 0)

  const stats = [
    {
      title: "Motoristas Ativos",
      value: activeDrivers,
      icon: Users,
      description: `${drivers.length} cadastrados`,
    },
    {
      title: "Fechamentos Pendentes",
      value: pendingClosings,
      icon: FileText,
      description: `${closings.length} total`,
    },
    {
      title: "Valor Líquido Total",
      value: new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(totalNetValue),
      icon: TrendingUp,
      description: "Todos os fechamentos",
    },
    {
      title: "Horas Trabalhadas",
      value: `${totalHours}h`,
      icon: Clock,
      description: "Total acumulado",
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground">{stat.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
