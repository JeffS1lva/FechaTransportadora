"use client"

import { useState, useEffect } from "react"
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover"
import { format, isValid, parseISO } from "date-fns"
import { CalendarIcon, Pencil } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Closing, ClosingFormData, Driver } from "@/lib/types"

interface ClosingEditDialogProps {
  closing: Closing | null
  open: boolean
  onOpenChange: (open: boolean) => void
  drivers: Driver[]
  onSave: (id: string, data: Partial<ClosingFormData>) => void
  canManage: boolean
}

// Função auxiliar para parsear data de forma segura
function safeParseDate(dateString: string | undefined): Date | undefined {
  if (!dateString) return undefined
  try {
    const parsed = parseISO(dateString)
    return isValid(parsed) ? parsed : undefined
  } catch {
    return undefined
  }
}

export function ClosingEditDialog({
  closing,
  open,
  onOpenChange,
  drivers,
  onSave,
  canManage,
}: ClosingEditDialogProps) {
  const [formData, setFormData] = useState<Partial<ClosingFormData>>({})
  const [startDate, setStartDate] = useState<Date | undefined>(undefined)
  const [endDate, setEndDate] = useState<Date | undefined>(undefined)

  useEffect(() => {
    if (closing) {
      setFormData({
        driverId: closing.driverId,
        periodStart: closing.period.start,
        periodEnd: closing.period.end,
        totalDeliveries: closing.deliveries.total,
        completedDeliveries: closing.deliveries.completed,
        canceledDeliveries: closing.deliveries.canceled,
        kmDriven: closing.deliveries.kmDriven,
        grossValue: closing.financial.grossValue,
        commissionRate: closing.financial.grossValue > 0 
          ? (closing.financial.commission / closing.financial.grossValue) * 100 
          : 0,
        fuelCost: closing.financial.fuelCost,
        advances: closing.financial.advances,
        discounts: closing.financial.discounts,
        regularHours: closing.hours.regular,
        overtimeHours: closing.hours.overtime,
      })
      setStartDate(safeParseDate(closing.period.start))
      setEndDate(safeParseDate(closing.period.end))
    }
  }, [closing])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!closing) return
    
    onSave(closing.id, formData)
    onOpenChange(false)
  }

  const updateField = <K extends keyof ClosingFormData>(field: K, value: ClosingFormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const isDisabled = !canManage || closing?.status === "paid"

  // Função segura para formatar data
  const formatDateSafe = (date: Date | undefined): string => {
    if (!date || !isValid(date)) return "Selecionar"
    try {
      return format(date, "dd/MM/yyyy")
    } catch {
      return "Selecionar"
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-[calc(100vw-2rem)] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="h-5 w-5" />
            Editar Fechamento
          </DialogTitle>
          <DialogDescription>
            Modifique os dados do fechamento. Fechamentos pagos não podem ser editados.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="driver">Motorista</Label>
            <Select 
              value={formData.driverId} 
              onValueChange={(v) => updateField("driverId", v)}
              disabled={isDisabled}
            >
              <SelectTrigger id="driver" className="w-full">
                <SelectValue placeholder="Selecione o motorista" />
              </SelectTrigger>
              <SelectContent>
                {drivers.map(d => (
                  <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Data Início</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                    disabled={isDisabled}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formatDateSafe(startDate)}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(d) => {
                      setStartDate(d)
                      if (d && isValid(d)) {
                        updateField("periodStart", d.toISOString().split("T")[0])
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Data Fim</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                    disabled={isDisabled}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formatDateSafe(endDate)}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={(d) => {
                      setEndDate(d)
                      if (d && isValid(d)) {
                        updateField("periodEnd", d.toISOString().split("T")[0])
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-medium text-sm text-muted-foreground uppercase">Entregas</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="total">Total</Label>
                <Input
                  id="total"
                  type="number"
                  value={formData.totalDeliveries || ""}
                  onChange={(e) => updateField("totalDeliveries", parseInt(e.target.value) || 0)}
                  disabled={isDisabled}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="completed">Completadas</Label>
                <Input
                  id="completed"
                  type="number"
                  value={formData.completedDeliveries || ""}
                  onChange={(e) => updateField("completedDeliveries", parseInt(e.target.value) || 0)}
                  disabled={isDisabled}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="canceled">Canceladas</Label>
                <Input
                  id="canceled"
                  type="number"
                  value={formData.canceledDeliveries || ""}
                  onChange={(e) => updateField("canceledDeliveries", parseInt(e.target.value) || 0)}
                  disabled={isDisabled}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="km">KM Rodados</Label>
                <Input
                  id="km"
                  type="number"
                  value={formData.kmDriven || ""}
                  onChange={(e) => updateField("kmDriven", parseInt(e.target.value) || 0)}
                  disabled={isDisabled}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-medium text-sm text-muted-foreground uppercase">Financeiro</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="gross">Valor Bruto (R$)</Label>
                <Input
                  id="gross"
                  type="number"
                  step="0.01"
                  value={formData.grossValue || ""}
                  onChange={(e) => updateField("grossValue", parseFloat(e.target.value) || 0)}
                  disabled={isDisabled}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="commission">Taxa Comissão (%)</Label>
                <Input
                  id="commission"
                  type="number"
                  step="0.01"
                  value={formData.commissionRate || ""}
                  onChange={(e) => updateField("commissionRate", parseFloat(e.target.value) || 0)}
                  disabled={isDisabled}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fuel">Combustível (R$)</Label>
                <Input
                  id="fuel"
                  type="number"
                  step="0.01"
                  value={formData.fuelCost || ""}
                  onChange={(e) => updateField("fuelCost", parseFloat(e.target.value) || 0)}
                  disabled={isDisabled}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="advances">Adiantamentos (R$)</Label>
                <Input
                  id="advances"
                  type="number"
                  step="0.01"
                  value={formData.advances || ""}
                  onChange={(e) => updateField("advances", parseFloat(e.target.value) || 0)}
                  disabled={isDisabled}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="discounts">Descontos (R$)</Label>
                <Input
                  id="discounts"
                  type="number"
                  step="0.01"
                  value={formData.discounts || ""}
                  onChange={(e) => updateField("discounts", parseFloat(e.target.value) || 0)}
                  disabled={isDisabled}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-medium text-sm text-muted-foreground uppercase">Horas Trabalhadas</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="regular">Normais</Label>
                <Input
                  id="regular"
                  type="number"
                  value={formData.regularHours || ""}
                  onChange={(e) => updateField("regularHours", parseInt(e.target.value) || 0)}
                  disabled={isDisabled}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="overtime">Extras</Label>
                <Input
                  id="overtime"
                  type="number"
                  value={formData.overtimeHours || ""}
                  onChange={(e) => updateField("overtimeHours", parseInt(e.target.value) || 0)}
                  disabled={isDisabled}
                />
              </div>
            </div>
          </div>

          {closing?.status === "paid" && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
              Este fechamento já foi pago e não pode ser editado.
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={isDisabled}
              className={closing?.status === "paid" ? "opacity-50 cursor-not-allowed" : ""}
            >
              Salvar Alterações
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}