"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Package, DollarSign, Clock, Calendar, User, CheckCircle2, Banknote, TrendingUp, Timer, Receipt, Fuel, AlertCircle, X } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Closing } from "@/lib/types"
import { Separator } from "../ui/separator"

const statusConfig = {
  pending: { 
    label: "Pendente", 
    variant: "secondary" as const,
    bg: "bg-amber-100",
    text: "text-amber-700",
    border: "border-amber-200"
  },
  approved: { 
    label: "Aprovado", 
    variant: "default" as const,
    bg: "bg-blue-100",
    text: "text-blue-700",
    border: "border-blue-200"
  },
  paid: { 
    label: "Pago", 
    variant: "outline" as const,
    bg: "bg-emerald-100",
    text: "text-emerald-700",
    border: "border-emerald-200"
  },
}

interface ClosingDetailsProps {
  closing: Closing | null
  onClose: () => void
  onApprove?: (id: string) => void
  onMarkPaid?: (id: string) => void
  canManage?: boolean
}

export function ClosingDetails({ closing, onClose, onApprove, onMarkPaid, canManage }: ClosingDetailsProps) {
  if (!closing) return null

  const status = statusConfig[closing.status]

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)

  const formatDate = (date: string) => 
    new Date(date).toLocaleDateString("pt-BR")

  return (
    <Dialog open={!!closing} onOpenChange={onClose}>
      <DialogContent className="w-[calc(100vw-1rem)] sm:w-[calc(100vw-2rem)] md:max-w-2xl max-h-[95vh] overflow-y-auto p-0">
        {/* Header Mobile-First */}
        <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4 border-b">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className={cn(
                "h-10 w-10 sm:h-12 sm:w-12 rounded-full flex items-center justify-center text-sm sm:text-base font-bold shrink-0",
                status.bg,
                status.text
              )}>
                {closing.driverName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <DialogTitle className="text-base sm:text-lg leading-tight truncate">
                  {closing.driverName}
                </DialogTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge 
                    variant={status.variant}
                    className={cn(
                      "text-[10px] sm:text-xs px-2 py-0.5",
                      closing.status === "paid" && "bg-emerald-100 text-emerald-700 border-emerald-200",
                      closing.status === "approved" && "bg-blue-100 text-blue-700 border-blue-200",
                      closing.status === "pending" && "bg-amber-100 text-amber-700 border-amber-200"
                    )}
                  >
                    <span className={cn(
                      "w-1 h-1 rounded-full mr-1",
                      closing.status === "paid" ? "bg-emerald-500" : 
                      closing.status === "approved" ? "bg-blue-500" : "bg-amber-500"
                    )} />
                    {status.label}
                  </Badge>
                </div>
              </div>
            </div>
            
            {/* Ações rápidas - visíveis apenas se canManage */}
            {canManage && (
              <div className="flex gap-2">
                {closing.status === "pending" && onApprove && (
                  <Button
                    size="sm"
                    className="h-8 sm:h-9 text-xs bg-blue-600 hover:bg-blue-700"
                    onClick={() => onApprove(closing.id)}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                    <span className="hidden sm:inline">Aprovar</span>
                    <span className="sm:hidden">Aprovar</span>
                  </Button>
                )}
                {closing.status === "approved" && onMarkPaid && (
                  <Button
                    size="sm"
                    className="h-8 sm:h-9 text-xs bg-emerald-600 hover:bg-emerald-700"
                    onClick={() => onMarkPaid(closing.id)}
                  >
                    <Banknote className="h-3.5 w-3.5 mr-1.5" />
                    <span className="hidden sm:inline">Marcar Pago</span>
                    <span className="sm:hidden">Pagar</span>
                  </Button>
                )}
              </div>
            )}
          </div>
        </DialogHeader>

        <div className="px-4 sm:px-6 py-4 space-y-4 sm:space-y-6">
          {/* Card de Informações Gerais */}
          <Card className="border-border/50">
            <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-4">
              <CardTitle className="text-sm sm:text-base font-semibold flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                Informações Gerais
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0 sm:pt-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="p-2.5 sm:p-3 bg-muted/50 rounded-lg">
                  <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wide mb-1">
                    Período
                  </p>
                  <p className="text-sm sm:text-base font-medium">
                    {formatDate(closing.period.start)} - {formatDate(closing.period.end)}
                  </p>
                </div>
                <div className="p-2.5 sm:p-3 bg-muted/50 rounded-lg">
                  <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wide mb-1">
                    Criado em
                  </p>
                  <p className="text-sm sm:text-base font-medium">
                    {formatDate(closing.createdAt)}
                  </p>
                </div>
                {closing.approvedAt && (
                  <div className="p-2.5 sm:p-3 bg-muted/50 rounded-lg sm:col-span-2">
                    <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wide mb-1">
                      Aprovado em
                    </p>
                    <p className="text-sm sm:text-base font-medium">
                      {formatDate(closing.approvedAt)}
                      {closing.approvedBy && (
                        <span className="text-muted-foreground text-xs sm:text-sm ml-2">
                          por {closing.approvedBy}
                        </span>
                      )}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Card de Entregas */}
          <Card className="border-border/50">
            <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-4">
              <CardTitle className="text-sm sm:text-base font-semibold flex items-center gap-2">
                <Package className="h-4 w-4 text-primary" />
                Entregas
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0 sm:pt-0">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                <div className="p-2.5 sm:p-3 bg-muted/50 rounded-lg text-center sm:text-left">
                  <p className="text-[10px] sm:text-xs text-muted-foreground mb-1">Total</p>
                  <p className="text-lg sm:text-xl font-bold">{closing.deliveries.total}</p>
                </div>
                <div className="p-2.5 sm:p-3 bg-emerald-50 rounded-lg text-center sm:text-left border border-emerald-100">
                  <p className="text-[10px] sm:text-xs text-emerald-600 mb-1">Concluídas</p>
                  <p className="text-lg sm:text-xl font-bold text-emerald-700">
                    {closing.deliveries.completed}
                  </p>
                </div>
                <div className="p-2.5 sm:p-3 bg-red-50 rounded-lg text-center sm:text-left border border-red-100">
                  <p className="text-[10px] sm:text-xs text-red-600 mb-1">Canceladas</p>
                  <p className="text-lg sm:text-xl font-bold text-red-700">
                    {closing.deliveries.canceled}
                  </p>
                </div>
                <div className="p-2.5 sm:p-3 bg-muted/50 rounded-lg text-center sm:text-left">
                  <p className="text-[10px] sm:text-xs text-muted-foreground mb-1">KM Rodados</p>
                  <p className="text-lg sm:text-xl font-bold">
                    {closing.deliveries.kmDriven}
                    <span className="text-xs sm:text-sm font-normal text-muted-foreground ml-1">km</span>
                  </p>
                </div>
              </div>

              {/* Estatísticas adicionais */}
              {closing.deliveries.completed > 0 && (
                <div className="mt-3 sm:mt-4 p-2.5 sm:p-3 bg-primary/5 rounded-lg border border-primary/10">
                  <div className="flex flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm">
                    <div className="flex items-center gap-1.5">
                      <TrendingUp className="h-3.5 w-3.5 text-primary" />
                      <span className="text-muted-foreground">Taxa de conclusão:</span>
                      <span className="font-semibold">
                        {((closing.deliveries.completed / closing.deliveries.total) * 100).toFixed(1)}%
                      </span>
                    </div>
                    {closing.deliveries.kmDriven > 0 && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-muted-foreground">Média/entrega:</span>
                        <span className="font-semibold">
                          {(closing.deliveries.kmDriven / closing.deliveries.completed).toFixed(1)} km
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Card Financeiro */}
          <Card className="border-border/50">
            <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-4">
              <CardTitle className="text-sm sm:text-base font-semibold flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-primary" />
                Financeiro
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0 sm:pt-0 space-y-2 sm:space-y-3">
              {/* Valor Bruto */}
              <div className="flex justify-between items-center p-2.5 sm:p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm sm:text-base text-muted-foreground">Valor Bruto</span>
                </div>
                <span className="text-sm sm:text-base font-medium font-mono">
                  {formatCurrency(closing.financial.grossValue)}
                </span>
              </div>

              {/* Descontos */}
              <div className="space-y-1.5 sm:space-y-2">
                <div className="flex justify-between items-center text-xs sm:text-sm px-2">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Comissão</span>
                  </div>
                  <span className="text-destructive font-mono">
                    - {formatCurrency(closing.financial.commission)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs sm:text-sm px-2">
                  <div className="flex items-center gap-2">
                    <Fuel className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">Combustível</span>
                  </div>
                  <span className="text-destructive font-mono">
                    - {formatCurrency(closing.financial.fuelCost)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs sm:text-sm px-2">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Adiantamentos</span>
                  </div>
                  <span className="text-destructive font-mono">
                    - {formatCurrency(closing.financial.advances)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs sm:text-sm px-2">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Descontos</span>
                  </div>
                  <span className="text-destructive font-mono">
                    - {formatCurrency(closing.financial.discounts)}
                  </span>
                </div>
              </div>

              <Separator className="my-2" />

              {/* Valor Líquido - Destaque */}
              <div className={cn(
                "flex justify-between items-center p-3 sm:p-4 rounded-lg border-2",
                closing.financial.netValue >= 0 
                  ? "bg-emerald-50 border-emerald-200" 
                  : "bg-red-50 border-red-200"
              )}>
                <div>
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">Valor Líquido</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">
                    Após todos os descontos
                  </p>
                </div>
                <span className={cn(
                  "text-lg sm:text-xl font-bold font-mono",
                  closing.financial.netValue >= 0 ? "text-emerald-700" : "text-red-700"
                )}>
                  {formatCurrency(closing.financial.netValue)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Card de Horas */}
          <Card className="border-border/50">
            <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-4">
              <CardTitle className="text-sm sm:text-base font-semibold flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                Horas Trabalhadas
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0 sm:pt-0">
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                <div className="p-2.5 sm:p-3 bg-muted/50 rounded-lg text-center">
                  <p className="text-[10px] sm:text-xs text-muted-foreground mb-1">Regulares</p>
                  <p className="text-base sm:text-lg font-bold">{closing.hours.regular}h</p>
                </div>
                <div className="p-2.5 sm:p-3 bg-amber-50 rounded-lg text-center border border-amber-100">
                  <p className="text-[10px] sm:text-xs text-amber-600 mb-1">Extras</p>
                  <p className="text-base sm:text-lg font-bold text-amber-700">{closing.hours.overtime}h</p>
                </div>
                <div className={cn(
                  "p-2.5 sm:p-3 rounded-lg text-center border",
                  closing.hours.total > 220 
                    ? "bg-red-50 border-red-200" 
                    : "bg-primary/5 border-primary/10"
                )}>
                  <p className={cn(
                    "text-[10px] sm:text-xs mb-1",
                    closing.hours.total > 220 ? "text-red-600" : "text-primary"
                  )}>Total</p>
                  <p className={cn(
                    "text-base sm:text-lg font-bold",
                    closing.hours.total > 220 ? "text-red-700" : "text-primary"
                  )}>
                    {closing.hours.total}h
                  </p>
                </div>
              </div>

              {closing.hours.total > 220 && (
                <div className="mt-3 flex items-center gap-2 text-xs text-red-600 bg-red-50 p-2 rounded-lg border border-red-100">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>Total excede limite CLT mensal (220h)</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Footer com ações */}
          <div className="flex flex-col-reverse sm:flex-row justify-between items-center gap-3 pt-2 border-t">
            <Button 
              variant="outline" 
              onClick={onClose}
              className="w-full sm:w-auto h-10 sm:h-11"
            >
              <X className="h-4 w-4 mr-2" />
              Fechar
            </Button>
            
            {canManage && (
              <div className="flex gap-2 w-full sm:w-auto">
                {closing.status === "pending" && onApprove && (
                  <Button
                    className="flex-1 sm:flex-none h-10 sm:h-11 bg-blue-600 hover:bg-blue-700"
                    onClick={() => onApprove(closing.id)}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Aprovar Fechamento
                  </Button>
                )}
                {closing.status === "approved" && onMarkPaid && (
                  <Button
                    className="flex-1 sm:flex-none h-10 sm:h-11 bg-emerald-600 hover:bg-emerald-700"
                    onClick={() => onMarkPaid(closing.id)}
                  >
                    <Banknote className="h-4 w-4 mr-2" />
                    Marcar como Pago
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}