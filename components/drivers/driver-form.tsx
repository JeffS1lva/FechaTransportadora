"use client"

import { useEffect, useMemo, useState } from "react"
import { useData } from "@/lib/data-context"
import { toast } from "sonner"
import { fetchViaCEP, isValidCNH, isValidCPF } from "@/lib/api"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MapPin, Plus, Truck, User, CheckCircle2, AlertCircle } from "lucide-react"
import type { Driver } from "@/lib/types"
import { cn } from "@/lib/utils"

interface DriverFormProps {
  driver?: Driver
  cloneFrom?: Driver
  onClose?: () => void
  trigger?: React.ReactNode | null
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

const defaultFormValues = {
  name: "",
  cpf: "",
  cnh: "",
  cep: "",
  street: "",
  number: "",
  complement: "",
  neighborhood: "",
  city: "",
  state: "",
  phone: "",
  vehicle: "",
  licensePlate: "",
  status: "active" as "active" | "inactive",
}

export function DriverForm({
  driver,
  cloneFrom,
  onClose,
  trigger,
  open: openProp,
  onOpenChange,
}: DriverFormProps) {
  const { addDriver, updateDriver } = useData()
  const [internalOpen, setInternalOpen] = useState(false)

  const isControlled = openProp !== undefined && onOpenChange !== undefined
  const open = isControlled ? openProp : internalOpen
  const setOpen = (value: boolean) => {
    if (isControlled) {
      onOpenChange?.(value)
    } else {
      setInternalOpen(value)
    }

    if (!value) {
      onClose?.()
    }
  }

  const [formData, setFormData] = useState({ ...defaultFormValues })

  useEffect(() => {
    if (!open) return

    const source = cloneFrom ?? driver

    setFormData({
      ...defaultFormValues,
      name: source?.name ?? "",
      cpf: source?.cpf ?? "",
      cnh: source?.cnh ?? "",
      cep: source?.cep ?? "",
      street: source?.street ?? "",
      number: source?.number ?? "",
      complement: source?.complement ?? "",
      neighborhood: source?.neighborhood ?? "",
      city: source?.city ?? "",
      state: source?.state ?? "",
      phone: source?.phone ?? "",
      vehicle: source?.vehicle ?? "",
      licensePlate: source?.licensePlate ?? "",
      status: source?.status ?? "active",
    })
  }, [cloneFrom, driver, open])

  const preview = useMemo(() => {
    return {
      name: formData.name || "—",
      cpf: formData.cpf || "—",
      phone: formData.phone || "—",
      vehicle: formData.vehicle || "—",
      licensePlate: formData.licensePlate || "—",
      status: formData.status,
      address:
        formData.street || formData.neighborhood || formData.city
          ? `${formData.street || ""}${formData.number ? `, ${formData.number}` : ""}${formData.neighborhood ? ` • ${formData.neighborhood}` : ""
          } ${formData.city ? `• ${formData.city}` : ""}${formData.state ? ` / ${formData.state}` : ""
          }`
          : "—",
    }
  }, [formData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const enriched = { ...formData }

    if (enriched.cep && (!enriched.street || !enriched.city || !enriched.state)) {
      try {
        const result = await fetchViaCEP(enriched.cep)
        Object.assign(enriched, {
          cep: result.cep,
          street: result.logradouro,
          complement: result.complemento,
          neighborhood: result.bairro,
          city: result.localidade,
          state: result.uf,
        })
      } catch {
        // ignore; user can proceed with manual address entry
      }
    }

    const isClone = Boolean(cloneFrom)
    const isEditing = Boolean(driver) && !isClone

    if (isEditing) {
      updateDriver(driver!.id, enriched)
      toast.success("Motorista atualizado", {
        description: "Os dados do motorista foram atualizados com sucesso.",
      })
    } else {
      addDriver(enriched as Omit<Driver, "id" | "createdAt">)
      toast.success(isClone ? "Motorista importado" : "Motorista cadastrado", {
        description: isClone
          ? "Os dados foram copiados para um novo cadastro."
          : "O motorista foi adicionado com sucesso.",
      })
    }

    setOpen(false)

    if (!driver) {
      setFormData({ ...defaultFormValues })
    }
  }

  const triggerButton = (
    <Button className="w-full sm:w-auto h-10 sm:h-11 cursor-pointer">
      <Plus className="h-4 w-4 mr-2" />
      Novo Motorista
    </Button>
  )

  const shouldRenderTrigger = trigger !== null

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {shouldRenderTrigger ? (
        <DialogTrigger asChild>
          {trigger ?? triggerButton}
        </DialogTrigger>
      ) : null}
      
      <DialogContent className="w-[calc(100vw-1rem)] sm:w-[calc(100vw-2rem)] md:max-w-4xl max-h-[95vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader className="space-y-2">
          <DialogTitle className="text-lg sm:text-xl">
            {cloneFrom
              ? "Importar Motorista"
              : driver
                ? "Editar Motorista"
                : "Novo Motorista"}
          </DialogTitle>
          <DialogDescription className="text-sm">
            Preencha os dados abaixo para {cloneFrom ? "importar" : driver ? "atualizar" : "cadastrar"} o
            motorista.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4 lg:grid-cols-3 lg:gap-6 mt-4">
          {/* Formulário principal - ocupa 2/3 em desktop, 100% em mobile */}
          <div className="lg:col-span-2 space-y-4">
            <Tabs defaultValue="personal" className="w-full">
              <TabsList className="w-full grid grid-cols-2 h-auto p-1">
                <TabsTrigger value="personal" className="text-xs sm:text-sm py-2.5">
                  <User className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Dados pessoais</span>
                  <span className="sm:hidden">Pessoal</span>
                </TabsTrigger>
                <TabsTrigger value="vehicle" className="text-xs sm:text-sm py-2.5">
                  <Truck className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  Veículo
                </TabsTrigger>
              </TabsList>

              <TabsContent value="personal" className="space-y-4 mt-4">
                <FieldGroup className="space-y-4">
                  <Field>
                    <FieldLabel className="text-xs sm:text-sm">Nome completo</FieldLabel>
                    <Input
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="Nome do motorista"
                      className="h-10 sm:h-11"
                      required
                    />
                  </Field>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <Field>
                      <FieldLabel className="text-xs sm:text-sm">CPF</FieldLabel>
                      <Input
                        value={formData.cpf}
                        onChange={(e) =>
                          setFormData({ ...formData, cpf: e.target.value })
                        }
                        onBlur={(e) => {
                          const value = e.currentTarget.value
                          if (value && !isValidCPF(value)) {
                            toast.error("CPF inválido", {
                              description:
                                "Digite um CPF válido para continuar.",
                            })
                          }
                        }}
                        placeholder="000.000.000-00"
                        className="h-10 sm:h-11"
                        required
                      />
                    </Field>
                    <Field>
                      <FieldLabel className="text-xs sm:text-sm">Telefone</FieldLabel>
                      <Input
                        value={formData.phone}
                        onChange={(e) =>
                          setFormData({ ...formData, phone: e.target.value })
                        }
                        placeholder="(00) 00000-0000"
                        className="h-10 sm:h-11"
                        required
                      />
                    </Field>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <Field>
                      <FieldLabel className="text-xs sm:text-sm">CNH</FieldLabel>
                      <Input
                        value={formData.cnh}
                        onChange={(e) =>
                          setFormData({ ...formData, cnh: e.target.value })
                        }
                        onBlur={(e) => {
                          const value = e.currentTarget.value
                          if (value && !isValidCNH(value)) {
                            toast.error("CNH inválida", {
                              description:
                                "Digite uma CNH válida para continuar.",
                            })
                          }
                        }}
                        placeholder="00000000000"
                        className="h-10 sm:h-11"
                        required
                      />
                    </Field>
                    <Field>
                      <FieldLabel className="text-xs sm:text-sm">CEP</FieldLabel>
                      <Input
                        value={formData.cep}
                        onChange={(e) =>
                          setFormData({ ...formData, cep: e.target.value })
                        }
                        onBlur={async (e) => {
                          const value = e.currentTarget.value
                          if (!value) return
                          try {
                            const result = await fetchViaCEP(value)
                            setFormData((prev) => ({
                              ...prev,
                              cep: result.cep,
                              street: result.logradouro,
                              complement: result.complemento,
                              neighborhood: result.bairro,
                              city: result.localidade,
                              state: result.uf,
                            }))
                          } catch (error) {
                            toast.error("CEP não encontrado", {
                              description:
                                "Verifique o CEP e tente novamente.",
                            })
                          }
                        }}
                        placeholder="00000-000"
                        className="h-10 sm:h-11"
                        required
                      />
                    </Field>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                    <Field className="sm:col-span-2">
                      <FieldLabel className="text-xs sm:text-sm">Rua</FieldLabel>
                      <Input
                        value={formData.street}
                        onChange={(e) =>
                          setFormData({ ...formData, street: e.target.value })
                        }
                        placeholder="Rua"
                        className="h-10 sm:h-11"
                      />
                    </Field>
                    <Field>
                      <FieldLabel className="text-xs sm:text-sm">Número</FieldLabel>
                      <Input
                        value={formData.number}
                        onChange={(e) =>
                          setFormData({ ...formData, number: e.target.value })
                        }
                        placeholder="Número"
                        className="h-10 sm:h-11"
                      />
                    </Field>
                  </div>

                  <Field>
                    <FieldLabel className="text-xs sm:text-sm">Complemento</FieldLabel>
                    <Input
                      value={formData.complement}
                      onChange={(e) =>
                        setFormData({ ...formData, complement: e.target.value })
                      }
                      placeholder="Complemento"
                      className="h-10 sm:h-11"
                    />
                  </Field>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <Field>
                      <FieldLabel className="text-xs sm:text-sm">Bairro</FieldLabel>
                      <Input
                        value={formData.neighborhood}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            neighborhood: e.target.value,
                          })
                        }
                        placeholder="Bairro"
                        className="h-10 sm:h-11"
                      />
                    </Field>
                    <Field>
                      <FieldLabel className="text-xs sm:text-sm">Cidade</FieldLabel>
                      <Input
                        value={formData.city}
                        onChange={(e) =>
                          setFormData({ ...formData, city: e.target.value })
                        }
                        placeholder="Cidade"
                        className="h-10 sm:h-11"
                      />
                    </Field>
                  </div>

                  <Field>
                    <FieldLabel className="text-xs sm:text-sm">Estado</FieldLabel>
                    <Input
                      value={formData.state}
                      onChange={(e) =>
                        setFormData({ ...formData, state: e.target.value })
                      }
                      placeholder="UF"
                      className="h-10 sm:h-11 w-full sm:w-24"
                    />
                  </Field>
                </FieldGroup>
              </TabsContent>

              <TabsContent value="vehicle" className="space-y-4 mt-4">
                <FieldGroup className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <Field>
                      <FieldLabel className="text-xs sm:text-sm">Veículo</FieldLabel>
                      <Input
                        value={formData.vehicle}
                        onChange={(e) =>
                          setFormData({ ...formData, vehicle: e.target.value })
                        }
                        placeholder="Modelo do veículo"
                        className="h-10 sm:h-11"
                        required
                      />
                    </Field>
                    <Field>
                      <FieldLabel className="text-xs sm:text-sm">Placa</FieldLabel>
                      <Input
                        value={formData.licensePlate}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            licensePlate: e.target.value,
                          })
                        }
                        placeholder="ABC-1234"
                        className="h-10 sm:h-11"
                        required
                      />
                    </Field>
                  </div>

                  <Field>
                    <FieldLabel className="text-xs sm:text-sm">Status</FieldLabel>
                    <Select
                      value={formData.status}
                      onValueChange={(value: "active" | "inactive") =>
                        setFormData({ ...formData, status: value })
                      }
                    >
                      <SelectTrigger className="h-10 sm:h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Ativo</SelectItem>
                        <SelectItem value="inactive">Inativo</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                </FieldGroup>
              </TabsContent>
            </Tabs>

            {/* Preview mobile - visível apenas em telas pequenas */}
            <Card className="lg:hidden border-dashed">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                  Prévia do cadastro
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                <div className="flex items-start gap-3 p-2 bg-muted/50 rounded-lg">
                  <div className={cn(
                    "h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                    formData.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
                  )}>
                    {formData.name ? formData.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{preview.name}</p>
                    <p className="text-xs text-muted-foreground">CPF: {preview.cpf}</p>
                    <p className="text-xs text-muted-foreground">{preview.phone}</p>
                  </div>
                </div>

                {(formData.vehicle || formData.licensePlate) && (
                  <div className="flex items-center gap-2 text-xs p-2 bg-muted/30 rounded-lg">
                    <Truck className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="truncate">
                      {preview.vehicle} • {preview.licensePlate}
                    </span>
                  </div>
                )}

                {preview.address !== "—" && (
                  <div className="flex items-start gap-2 text-xs p-2 bg-muted/30 rounded-lg">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{preview.address}</span>
                  </div>
                )}

                <div className={cn(
                  "flex items-center gap-2 text-xs px-3 py-2 rounded-md",
                  formData.status === "active" ? "bg-emerald-500/10 text-emerald-600" : "bg-slate-500/10 text-slate-600"
                )}>
                  <div className={cn("w-1.5 h-1.5 rounded-full", formData.status === "active" ? "bg-emerald-500" : "bg-slate-400")} />
                  Status: {preview.status === "active" ? "Ativo" : "Inativo"}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Preview desktop - ocupa 1/3 em desktop, escondido em mobile */}
          <Card className="hidden lg:flex lg:flex-col h-fit sticky top-0">
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Prévia rápida</CardTitle>
              <CardDescription className="text-xs">
                Veja como os dados ficarão após salvar.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <div className={cn(
                  "h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0",
                  formData.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
                )}>
                  {formData.name ? formData.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{preview.name}</p>
                  <p className="text-xs text-muted-foreground">CPF: {preview.cpf}</p>
                  <p className="text-xs text-muted-foreground">
                    Telefone: {preview.phone}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                <Truck className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{preview.vehicle}</p>
                  <p className="text-xs text-muted-foreground">
                    Placa: {preview.licensePlate}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground line-clamp-3">{preview.address}</p>
              </div>

              <div className={cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-xs font-medium",
                formData.status === "active" 
                  ? "bg-emerald-500/10 text-emerald-600" 
                  : "bg-slate-500/10 text-slate-600"
              )}>
                <div className={cn("w-1.5 h-1.5 rounded-full", formData.status === "active" ? "bg-emerald-500" : "bg-slate-400")} />
                Status: {preview.status === "active" ? "Ativo" : "Inativo"}
              </div>

              {/* Validação visual */}
              <div className="space-y-2 pt-2 border-t">
                <p className="text-xs font-medium text-muted-foreground">Validação</p>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-xs">
                    {formData.name.length >= 3 ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                    ) : (
                      <AlertCircle className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                    <span className={formData.name.length >= 3 ? "text-emerald-600" : "text-muted-foreground"}>
                      Nome preenchido
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    {formData.cpf.length >= 11 ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                    ) : (
                      <AlertCircle className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                    <span className={formData.cpf.length >= 11 ? "text-emerald-600" : "text-muted-foreground"}>
                      CPF preenchido
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    {formData.vehicle ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                    ) : (
                      <AlertCircle className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                    <span className={formData.vehicle ? "text-emerald-600" : "text-muted-foreground"}>
                      Veículo preenchido
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Footer - full width em mobile, col-span-3 em desktop */}
          <DialogFooter className="lg:col-span-3 flex-col sm:flex-row gap-2 sm:gap-0 mt-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)}
              className="w-full sm:w-auto h-10 sm:h-11"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              className="w-full sm:w-auto h-10 sm:h-11"
            >
              {driver ? "Salvar alterações" : "Cadastrar motorista"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}