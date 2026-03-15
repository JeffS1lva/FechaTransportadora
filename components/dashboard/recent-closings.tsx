"use client"

import { useData } from "@/lib/data-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const statusConfig = {
  pending: { label: "Pendente", variant: "secondary" as const },
  approved: { label: "Aprovado", variant: "default" as const },
  paid: { label: "Pago", variant: "outline" as const },
}

export function RecentClosings() {
  const { closings } = useData()

  const recentClosings = closings
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)

  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle>Fechamentos Recentes</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentClosings.map((closing) => {
            const status = statusConfig[closing.status]
            return (
              <div
                key={closing.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
              >
                <div className="flex-1">
                  <p className="font-medium">{closing.driverName}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(closing.period.start).toLocaleDateString("pt-BR")} -{" "}
                    {new Date(closing.period.end).toLocaleDateString("pt-BR")}
                  </p>
                </div>
                <div className="text-right mr-4">
                  <p className="font-medium">
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(closing.financial.netValue)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {closing.deliveries.completed} entregas
                  </p>
                </div>
                <Badge variant={status.variant}>{status.label}</Badge>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
