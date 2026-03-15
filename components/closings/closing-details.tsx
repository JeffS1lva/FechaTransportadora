"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Package, DollarSign, Clock, Calendar } from "lucide-react"
import type { Closing } from "@/lib/types"

const statusConfig = {
  pending: { label: "Pendente", variant: "secondary" as const },
  approved: { label: "Aprovado", variant: "default" as const },
  paid: { label: "Pago", variant: "outline" as const },
}

interface ClosingDetailsProps {
  closing: Closing | null
  onClose: () => void
}

export function ClosingDetails({ closing, onClose }: ClosingDetailsProps) {
  if (!closing) return null

  const status = statusConfig[closing.status]

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)

  return (
    <Dialog open={!!closing} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-150 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Detalhes do Fechamento</DialogTitle>
            <Badge variant={status.variant}>{status.label}</Badge>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Informações Gerais
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Motorista</p>
                <p className="font-medium">{closing.driverName}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Período</p>
                <p className="font-medium">
                  {new Date(closing.period.start).toLocaleDateString("pt-BR")} -{" "}
                  {new Date(closing.period.end).toLocaleDateString("pt-BR")}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Criado em</p>
                <p className="font-medium">
                  {new Date(closing.createdAt).toLocaleDateString("pt-BR")}
                </p>
              </div>
              {closing.approvedAt && (
                <div>
                  <p className="text-muted-foreground">Aprovado em</p>
                  <p className="font-medium">
                    {new Date(closing.approvedAt).toLocaleDateString("pt-BR")}
                    {closing.approvedBy && ` por ${closing.approvedBy}`}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="h-4 w-4" />
                Entregas
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Total de Entregas</p>
                <p className="font-medium">{closing.deliveries.total}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Concluídas</p>
                <p className="font-medium text-primary">
                  {closing.deliveries.completed}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Canceladas</p>
                <p className="font-medium text-destructive">
                  {closing.deliveries.canceled}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Km Rodados</p>
                <p className="font-medium">{closing.deliveries.kmDriven} km</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Financeiro
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Valor Bruto</span>
                <span className="font-medium">
                  {formatCurrency(closing.financial.grossValue)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Comissão</span>
                <span className="text-destructive">
                  - {formatCurrency(closing.financial.commission)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Combustível</span>
                <span className="text-destructive">
                  - {formatCurrency(closing.financial.fuelCost)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Adiantamentos</span>
                <span className="text-destructive">
                  - {formatCurrency(closing.financial.advances)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Descontos</span>
                <span className="text-destructive">
                  - {formatCurrency(closing.financial.discounts)}
                </span>
              </div>
              <div className="flex justify-between pt-3 border-t border-border">
                <span className="font-medium">Valor Líquido</span>
                <span className="font-bold text-primary">
                  {formatCurrency(closing.financial.netValue)}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Horas Trabalhadas
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Regulares</p>
                <p className="font-medium">{closing.hours.regular}h</p>
              </div>
              <div>
                <p className="text-muted-foreground">Extras</p>
                <p className="font-medium">{closing.hours.overtime}h</p>
              </div>
              <div>
                <p className="text-muted-foreground">Total</p>
                <p className="font-medium text-primary">{closing.hours.total}h</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}
