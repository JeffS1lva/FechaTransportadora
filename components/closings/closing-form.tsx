"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
import { toast } from "sonner"
import { useData } from "@/lib/data-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Progress } from "@/components/ui/progress"
import { Plus, Package, DollarSign, Clock, TrendingUp, AlertCircle, CheckCircle2, Calculator, Info } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ClosingFormData } from "@/lib/types"

// Formatador de moeda BRL
const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

// Formatador de números (km, unidades)
const numberFormatter = new Intl.NumberFormat("pt-BR", {
  maximumFractionDigits: 0,
})

// Hook personalizado para input de moeda
function useCurrencyInput(initialValue: number = 0) {
  const [displayValue, setDisplayValue] = useState("")
  const [numericValue, setNumericValue] = useState(initialValue)

  useEffect(() => {
    if (numericValue === 0 && displayValue === "") return
    setDisplayValue(currencyFormatter.format(numericValue).replace("R$", "").trim())
  }, [])

  const handleChange = useCallback((value: string) => {
    // Remove tudo exceto dígitos
    const digits = value.replace(/\D/g, "")
    const numeric = Number(digits) / 100
    setNumericValue(numeric)
    setDisplayValue(currencyFormatter.format(numeric).replace("R$", "").trim())
    return numeric
  }, [])

  const setValue = useCallback((value: number) => {
    setNumericValue(value)
    setDisplayValue(value === 0 ? "" : currencyFormatter.format(value).replace("R$", "").trim())
  }, [])

  return { displayValue, numericValue, handleChange, setValue }
}

// Componente de Input de Moeda
interface CurrencyInputProps {
  value: number
  onChange: (value: number) => void
  label: string
  error?: string
  min?: number
  max?: number
  placeholder?: string
  disabled?: boolean
  hint?: string
  id?: string
}

function CurrencyInput({ 
  value, 
  onChange, 
  label, 
  error, 
  min = 0, 
  max, 
  placeholder = "0,00", 
  disabled,
  hint,
  id 
}: CurrencyInputProps) {
  const [isFocused, setIsFocused] = useState(false)
  const { displayValue, numericValue, handleChange, setValue } = useCurrencyInput(value)

  useEffect(() => {
    if (value !== numericValue) {
      setValue(value)
    }
  }, [value])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = handleChange(e.target.value)
    onChange(newValue)
  }

  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
        {label}
      </label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
          R$
        </span>
        <Input
          id={id}
          type="text"
          inputMode="numeric"
          value={isFocused ? displayValue.replace(/\./g, "").replace(",", ".") : displayValue}
          onChange={handleInputChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={cn(
            "pl-10 text-right font-mono",
            error && "border-destructive focus-visible:ring-destructive"
          )}
          placeholder={placeholder}
          disabled={disabled}
        />
      </div>
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

// Componente de Input Numérico Formatado
interface NumberInputProps {
  value: number
  onChange: (value: number) => void
  label: string
  error?: string
  min?: number
  max?: number
  suffix?: string
  placeholder?: string
  disabled?: boolean
  hint?: string
  id?: string
}

function NumberInput({ 
  value, 
  onChange, 
  label, 
  error, 
  min = 0, 
  max, 
  suffix, 
  placeholder = "0",
  disabled,
  hint,
  id
}: NumberInputProps) {
  const [displayValue, setDisplayValue] = useState(value.toString())

  useEffect(() => {
    setDisplayValue(value === 0 ? "" : numberFormatter.format(value))
  }, [value])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\./g, "").replace(/,/g, "")
    const numeric = parseInt(raw) || 0
    onChange(numeric)
  }

  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
        {label}
      </label>
      <div className="relative">
        <Input
          id={id}
          type="text"
          inputMode="numeric"
          value={displayValue}
          onChange={handleChange}
          className={cn(
            "text-right font-mono",
            suffix && "pr-8",
            error && "border-destructive focus-visible:ring-destructive"
          )}
          placeholder={placeholder}
          disabled={disabled}
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
            {suffix}
          </span>
        )}
      </div>
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

export function ClosingForm() {
  const { drivers, addClosing } = useData()
  const [open, setOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("deliveries")
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set())

  const activeDrivers = useMemo(() => 
    drivers.filter((d) => d.status === "active"),
    [drivers]
  )

  const getDefaultPeriod = () => {
    const today = new Date()
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    return {
      periodStart: startOfMonth.toISOString().slice(0, 10),
      periodEnd: today.toISOString().slice(0, 10),
    }
  }

  const getInitialFormData = (): ClosingFormData => ({
    driverId: "",
    ...getDefaultPeriod(),
    totalDeliveries: 0,
    completedDeliveries: 0,
    canceledDeliveries: 0,
    kmDriven: 0,
    grossValue: 0,
    commissionRate: 15,
    fuelCost: 0,
    advances: 0,
    discounts: 0,
    regularHours: 176,
    overtimeHours: 0,
  })

  const [formData, setFormData] = useState<ClosingFormData>(getInitialFormData())

  // Cálculos inteligentes
  const calculations = useMemo(() => {
    const commission = formData.grossValue * (formData.commissionRate / 100)
    const netValue = formData.grossValue - commission - formData.fuelCost - formData.advances - formData.discounts
    const deliveryRate = formData.completedDeliveries > 0 ? formData.grossValue / formData.completedDeliveries : 0
    const kmRate = formData.kmDriven > 0 ? formData.grossValue / formData.kmDriven : 0
    const completionRate = formData.totalDeliveries > 0 
      ? (formData.completedDeliveries / formData.totalDeliveries) * 100 
      : 0
    const suggestedCanceled = Math.max(0, formData.totalDeliveries - formData.completedDeliveries)

    return {
      commission,
      netValue,
      deliveryRate,
      kmRate,
      completionRate,
      suggestedCanceled,
      totalDeductions: commission + formData.fuelCost + formData.advances + formData.discounts,
    }
  }, [formData])

  // Atualização automática de entregas canceladas
  useEffect(() => {
    if (!touchedFields.has("canceledDeliveries")) {
      setFormData(prev => ({
        ...prev,
        canceledDeliveries: calculations.suggestedCanceled
      }))
    }
  }, [formData.totalDeliveries, formData.completedDeliveries, calculations.suggestedCanceled, touchedFields])

  const updateField = <K extends keyof ClosingFormData>(
    key: K,
    value: ClosingFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [key]: value }))
    setTouchedFields(prev => new Set(prev).add(key))
  }

  // Validações avançadas
  const validation = useMemo(() => {
    const errors: Record<string, string> = {}
    const warnings: Record<string, string> = {}

    // Validações críticas
    if (!formData.driverId) {
      errors.driverId = "Selecione um motorista"
    }

    if (!formData.periodStart || !formData.periodEnd) {
      errors.period = "Preencha o período completo"
    } else if (formData.periodEnd < formData.periodStart) {
      errors.period = "Data final deve ser igual ou posterior à inicial"
    }

    if (formData.totalDeliveries < 0) {
      errors.totalDeliveries = "Total não pode ser negativo"
    }

    if (formData.completedDeliveries > formData.totalDeliveries) {
      errors.completedDeliveries = "Concluídas não pode exceder o total"
    }

    if (formData.canceledDeliveries > formData.totalDeliveries) {
      errors.canceledDeliveries = "Canceladas não pode exceder o total"
    }

    const sumDeliveries = formData.completedDeliveries + formData.canceledDeliveries
    if (sumDeliveries > formData.totalDeliveries) {
      errors.deliveriesSum = "Soma de concluídas + canceladas excede o total"
    }

    if (formData.commissionRate < 0 || formData.commissionRate > 100) {
      errors.commissionRate = "Comissão deve estar entre 0% e 100%"
    }

    if (formData.grossValue > 0 && formData.completedDeliveries === 0) {
      warnings.noDeliveries = "Valor bruto preenchido sem entregas concluídas"
    }

    if (calculations.netValue < 0) {
      warnings.negativeNet = "Valor líquido negativo - verifique descontos"
    }

    if (formData.kmDriven > 0 && formData.kmDriven / formData.completedDeliveries > 100) {
      warnings.highKm = "Média de KM por entrega parece alta (>100km)"
    }

    return { errors, warnings, isValid: Object.keys(errors).length === 0 }
  }, [formData, calculations])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!validation.isValid) {
      const errorMessages = Object.values(validation.errors)
      toast.error(errorMessages[0], {
        description: "Corrija os campos destacados antes de continuar",
        icon: <AlertCircle className="h-4 w-4" />
      })
      return
    }

    // Verificar warnings antes de submit
    const warningMessages = Object.values(validation.warnings)
    if (warningMessages.length > 0) {
      const confirm = window.confirm(
        `Atenção: ${warningMessages.join("\n")}\n\nDeseja continuar mesmo assim?`
      )
      if (!confirm) return
    }

    addClosing(formData)
    setOpen(false)
    setTouchedFields(new Set())
    setFormData(getInitialFormData())
    setActiveTab("deliveries")

    toast.success("Fechamento criado com sucesso!", {
      description: `${currencyFormatter.format(calculations.netValue)} líquido para ${activeDrivers.find(d => d.id === formData.driverId)?.name}`,
      icon: <CheckCircle2 className="h-4 w-4" />
    })
  }

  const hasErrors = Object.keys(validation.errors).length > 0
  const hasWarnings = Object.keys(validation.warnings).length > 0

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Fechamento
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-2xl max-h-[95vh] overflow-y-auto p-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Calculator className="h-5 w-5 text-primary" />
            Novo Fechamento
          </DialogTitle>
          <DialogDescription>
            Preencha os dados do período para calcular automaticamente os valores.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 px-6 pb-6">
          {/* Header com seleção de motorista e período */}
          <Card className="border-border/50">
            <CardContent className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-1 space-y-1.5">
                  <label className="text-sm font-medium">Motorista</label>
                  <Select
                    value={formData.driverId}
                    onValueChange={(value) => updateField("driverId", value)}
                  >
                    <SelectTrigger className={cn(
                      validation.errors.driverId && "border-destructive"
                    )}>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {activeDrivers.map((driver) => (
                        <SelectItem key={driver.id} value={driver.id}>
                          <div className="flex items-center gap-2">
                            <span>{driver.name}</span>
                            {driver.vehicle && (
                              <Badge variant="secondary" className="text-xs">
                                {driver.vehicle}
                              </Badge>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {validation.errors.driverId && (
                    <p className="text-xs text-destructive">{validation.errors.driverId}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Início do Período</label>
                  <Input
                    type="date"
                    value={formData.periodStart}
                    onChange={(e) => updateField("periodStart", e.target.value)}
                    className={cn(
                      validation.errors.period && "border-destructive"
                    )}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Fim do Período</label>
                  <Input
                    type="date"
                    value={formData.periodEnd}
                    onChange={(e) => updateField("periodEnd", e.target.value)}
                    className={cn(
                      validation.errors.period && "border-destructive"
                    )}
                  />
                </div>
              </div>
              
              {validation.errors.period && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {validation.errors.period}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Tabs com conteúdo */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 h-11">
              <TabsTrigger value="deliveries" className="gap-2 data-[state=active]:bg-primary/10">
                <Package className="h-4 w-4" />
                <span className="hidden sm:inline">Entregas</span>
                <span className="sm:hidden">Entregas</span>
              </TabsTrigger>
              <TabsTrigger value="financial" className="gap-2 data-[state=active]:bg-primary/10">
                <DollarSign className="h-4 w-4" />
                <span className="hidden sm:inline">Financeiro</span>
                <span className="sm:hidden">Finan.</span>
              </TabsTrigger>
              <TabsTrigger value="hours" className="gap-2 data-[state=active]:bg-primary/10">
                <Clock className="h-4 w-4" />
                <span className="hidden sm:inline">Horas</span>
                <span className="sm:hidden">Horas</span>
              </TabsTrigger>
            </TabsList>

            {/* Tab Entregas */}
            <TabsContent value="deliveries" className="mt-4 space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      <Package className="h-4 w-4 text-primary" />
                      Dados de Entregas
                    </CardTitle>
                    {calculations.completionRate > 0 && (
                      <Badge variant={calculations.completionRate >= 90 ? "default" : calculations.completionRate >= 70 ? "secondary" : "destructive"}>
                        {calculations.completionRate.toFixed(1)}% concluídas
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <NumberInput
                      id="totalDeliveries"
                      label="Total de Entregas"
                      value={formData.totalDeliveries}
                      onChange={(v) => updateField("totalDeliveries", v)}
                      error={validation.errors.totalDeliveries}
                      hint="Programadas no período"
                    />
                    <NumberInput
                      id="completedDeliveries"
                      label="Entregas Concluídas"
                      value={formData.completedDeliveries}
                      onChange={(v) => updateField("completedDeliveries", v)}
                      error={validation.errors.completedDeliveries}
                      hint="Realizadas com sucesso"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <NumberInput
                      id="canceledDeliveries"
                      label="Entregas Canceladas"
                      value={formData.canceledDeliveries}
                      onChange={(v) => {
                        setTouchedFields(prev => new Set(prev).add("canceledDeliveries"))
                        updateField("canceledDeliveries", v)
                      }}
                      error={validation.errors.canceledDeliveries || validation.errors.deliveriesSum}
                      hint={!touchedFields.has("canceledDeliveries") ? "Calculado automaticamente" : "Editado manualmente"}
                    />
                    <NumberInput
                      id="kmDriven"
                      label="Quilometragem"
                      value={formData.kmDriven}
                      onChange={(v) => updateField("kmDriven", v)}
                      suffix="km"
                      hint="Total percorrido"
                    />
                  </div>

                  {formData.kmDriven > 0 && formData.completedDeliveries > 0 && (
                    <div className="rounded-lg bg-muted/50 p-3 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Média por entrega:</span>
                        <span className="font-medium font-mono">
                          {(formData.kmDriven / formData.completedDeliveries).toFixed(1)} km
                        </span>
                      </div>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-muted-foreground">Receita por km:</span>
                        <span className="font-medium font-mono text-primary">
                          {currencyFormatter.format(calculations.kmRate)}/km
                        </span>
                      </div>
                    </div>
                  )}

                  {validation.warnings.highKm && (
                    <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 p-2 rounded-md">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      {validation.warnings.highKm}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab Financeiro */}
            <TabsContent value="financial" className="mt-4 space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-primary" />
                    Dados Financeiros
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <CurrencyInput
                      id="grossValue"
                      label="Valor Bruto"
                      value={formData.grossValue}
                      onChange={(v) => updateField("grossValue", v)}
                      hint="Receita total do período"
                    />
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Taxa de Comissão</label>
                      <div className="relative">
                        <Input
                          type="number"
                          value={formData.commissionRate}
                          onChange={(e) => updateField("commissionRate", Number(e.target.value))}
                          min={0}
                          max={100}
                          className={cn(
                            "pr-8 text-right font-mono",
                            validation.errors.commissionRate && "border-destructive"
                          )}
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                          %
                        </span>
                      </div>
                      {validation.errors.commissionRate && (
                        <p className="text-xs text-destructive">{validation.errors.commissionRate}</p>
                      )}
                      {!validation.errors.commissionRate && (
                        <p className="text-xs text-muted-foreground">Percentual sobre o bruto</p>
                      )}
                    </div>
                  </div>

                  <Separator className="my-4" />

                  <div className="grid grid-cols-3 gap-3">
                    <CurrencyInput
                      id="fuelCost"
                      label="Combustível"
                      value={formData.fuelCost}
                      onChange={(v) => updateField("fuelCost", v)}
                      hint="Abastecimento"
                    />
                    <CurrencyInput
                      id="advances"
                      label="Adiantamentos"
                      value={formData.advances}
                      onChange={(v) => updateField("advances", v)}
                      hint="Vales/adiant."
                    />
                    <CurrencyInput
                      id="discounts"
                      label="Descontos"
                      value={formData.discounts}
                      onChange={(v) => updateField("discounts", v)}
                      hint="Outros descontos"
                    />
                  </div>

                  {/* Resumo Financeiro */}
                  <div className="rounded-lg bg-muted/50 p-4 space-y-3">
                    <h4 className="text-sm font-semibold flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Resumo do Cálculo
                    </h4>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between text-muted-foreground">
                        <span>Valor Bruto:</span>
                        <span className="font-mono">{currencyFormatter.format(formData.grossValue)}</span>
                      </div>
                      <div className="flex justify-between text-destructive">
                        <span>Comissão ({formData.commissionRate}%):</span>
                        <span className="font-mono">-{currencyFormatter.format(calculations.commission)}</span>
                      </div>
                      <div className="flex justify-between text-destructive">
                        <span>Combustível:</span>
                        <span className="font-mono">-{currencyFormatter.format(formData.fuelCost)}</span>
                      </div>
                      <div className="flex justify-between text-destructive">
                        <span>Adiantamentos:</span>
                        <span className="font-mono">-{currencyFormatter.format(formData.advances)}</span>
                      </div>
                      <div className="flex justify-between text-destructive">
                        <span>Descontos:</span>
                        <span className="font-mono">-{currencyFormatter.format(formData.discounts)}</span>
                      </div>
                      
                      <Separator />
                      
                      <div className="flex justify-between font-semibold text-base pt-1">
                        <span>Valor Líquido:</span>
                        <span className={cn(
                          "font-mono",
                          calculations.netValue >= 0 ? "text-primary" : "text-destructive"
                        )}>
                          {currencyFormatter.format(calculations.netValue)}
                        </span>
                      </div>
                    </div>

                    {/* Barra de progresso visual */}
                    {formData.grossValue > 0 && (
                      <div className="space-y-1 pt-2">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Retenções</span>
                          <span>{((calculations.totalDeductions / formData.grossValue) * 100).toFixed(1)}%</span>
                        </div>
                        <Progress 
                          value={(calculations.netValue / formData.grossValue) * 100} 
                          className="h-2"
                        />
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Líquido</span>
                          <span className="text-muted-foreground">Bruto</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {validation.warnings.negativeNet && (
                    <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/10 p-2 rounded-md">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      {validation.warnings.negativeNet}
                    </div>
                  )}

                  {validation.warnings.noDeliveries && (
                    <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 p-2 rounded-md">
                      <Info className="h-4 w-4 shrink-0" />
                      {validation.warnings.noDeliveries}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab Horas */}
            <TabsContent value="hours" className="mt-4 space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    Controle de Horas
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <NumberInput
                      id="regularHours"
                      label="Horas Regulares"
                      value={formData.regularHours}
                      onChange={(v) => updateField("regularHours", v)}
                      suffix="h"
                      hint="Padrão: 176h/mês"
                    />
                    <NumberInput
                      id="overtimeHours"
                      label="Horas Extras"
                      value={formData.overtimeHours}
                      onChange={(v) => updateField("overtimeHours", v)}
                      suffix="h"
                      hint="50% ou 100%"
                    />
                  </div>

                  <div className="rounded-lg bg-muted/50 p-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Total de Horas:</span>
                      <span className="text-lg font-semibold font-mono">
                        {formData.regularHours + formData.overtimeHours}h
                      </span>
                    </div>
                    <Progress 
                      value={Math.min(((formData.regularHours + formData.overtimeHours) / 220) * 100, 100)} 
                      className="h-2 mt-2"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Referência: 220h (limite mensal CLT)
                    </p>
                  </div>

                  {formData.overtimeHours > 40 && (
                    <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 p-2 rounded-md">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      Alto volume de horas extras - verificar conforme CLT
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Alertas globais */}
          {(hasErrors || hasWarnings) && (
            <div className={cn(
              "rounded-lg p-3 text-sm flex items-start gap-2",
              hasErrors ? "bg-destructive/10 text-destructive" : "bg-amber-50 text-amber-700"
            )}>
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">
                  {hasErrors ? "Corrija os erros antes de salvar:" : "Atenção:"}
                </p>
                <ul className="list-disc list-inside text-xs mt-1 space-y-0.5">
                  {Object.values(validation.errors).map((err, i) => (
                    <li key={`err-${i}`}>{err}</li>
                  ))}
                  {Object.values(validation.warnings).map((warn, i) => (
                    <li key={`warn-${i}`}>{warn}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Footer com ações */}
          <div className="flex justify-between items-center pt-2 border-t">
            <div className="text-sm text-muted-foreground">
              {formData.driverId && (
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-primary" />
                  Motorista selecionado
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      type="submit" 
                      disabled={!validation.isValid}
                      className="gap-2"
                    >
                      <Calculator className="h-4 w-4" />
                      Criar Fechamento
                    </Button>
                  </TooltipTrigger>
                  {!validation.isValid && (
                    <TooltipContent>
                      <p>Preencha todos os campos obrigatórios</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}