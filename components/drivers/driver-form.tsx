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
import { MapPin, Plus, Truck, User } from "lucide-react"
import type { Driver } from "@/lib/types"

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
    <Button>
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
      <DialogContent className="sm:max-w-3/5 ">
        <DialogHeader>
          <DialogTitle>
            {cloneFrom
              ? "Importar Motorista"
              : driver
                ? "Editar Motorista"
                : "Novo Motorista"}
          </DialogTitle>
          <DialogDescription>
            Preencha os dados abaixo para {cloneFrom ? "importar" : driver ? "atualizar" : "cadastrar"} o
            motorista.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2">
            <Tabs defaultValue="personal" className="space-y-4">
              <TabsList>
                <TabsTrigger value="personal">
                  <User className="mr-2 h-4 w-4" />
                  Dados pessoais
                </TabsTrigger>
                <TabsTrigger value="vehicle">
                  <Truck className="mr-2 h-4 w-4" />
                  Veículo
                </TabsTrigger>
              </TabsList>

              <TabsContent value="personal" className="space-y-4">
                <FieldGroup>
                  <Field>
                    <FieldLabel>Nome completo</FieldLabel>
                    <Input
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="Nome do motorista"
                      required
                    />
                  </Field>

                  <div className="grid grid-cols-2 gap-4">
                    <Field>
                      <FieldLabel>CPF</FieldLabel>
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
                        required
                      />
                    </Field>
                    <Field>
                      <FieldLabel>Telefone</FieldLabel>
                      <Input
                        value={formData.phone}
                        onChange={(e) =>
                          setFormData({ ...formData, phone: e.target.value })
                        }
                        placeholder="(00) 00000-0000"
                        required
                      />
                    </Field>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Field>
                      <FieldLabel>CNH</FieldLabel>
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
                        required
                      />
                    </Field>
                    <Field>
                      <FieldLabel>CEP</FieldLabel>
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
                        required
                      />
                    </Field>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Field>
                      <FieldLabel>Rua</FieldLabel>
                      <Input
                        value={formData.street}
                        onChange={(e) =>
                          setFormData({ ...formData, street: e.target.value })
                        }
                        placeholder="Rua"
                      />
                    </Field>
                    <Field>
                      <FieldLabel>Número</FieldLabel>
                      <Input
                        value={formData.number}
                        onChange={(e) =>
                          setFormData({ ...formData, number: e.target.value })
                        }
                        placeholder="Número"
                      />
                    </Field>
                  </div>

                  <Field>
                    <FieldLabel>Complemento</FieldLabel>
                    <Input
                      value={formData.complement}
                      onChange={(e) =>
                        setFormData({ ...formData, complement: e.target.value })
                      }
                      placeholder="Complemento"
                    />
                  </Field>

                  <div className="grid grid-cols-2 gap-4">
                    <Field>
                      <FieldLabel>Bairro</FieldLabel>
                      <Input
                        value={formData.neighborhood}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            neighborhood: e.target.value,
                          })
                        }
                        placeholder="Bairro"
                      />
                    </Field>
                    <Field>
                      <FieldLabel>Cidade</FieldLabel>
                      <Input
                        value={formData.city}
                        onChange={(e) =>
                          setFormData({ ...formData, city: e.target.value })
                        }
                        placeholder="Cidade"
                      />
                    </Field>
                  </div>

                  <Field>
                    <FieldLabel>Estado</FieldLabel>
                    <Input
                      value={formData.state}
                      onChange={(e) =>
                        setFormData({ ...formData, state: e.target.value })
                      }
                      placeholder="UF"
                    />
                  </Field>
                </FieldGroup>
              </TabsContent>

              <TabsContent value="vehicle" className="space-y-4">
                <FieldGroup>
                  <div className="grid grid-cols-2 gap-4">
                    <Field>
                      <FieldLabel>Veículo</FieldLabel>
                      <Input
                        value={formData.vehicle}
                        onChange={(e) =>
                          setFormData({ ...formData, vehicle: e.target.value })
                        }
                        placeholder="Modelo do veículo"
                        required
                      />
                    </Field>
                    <Field>
                      <FieldLabel>Placa</FieldLabel>
                      <Input
                        value={formData.licensePlate}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            licensePlate: e.target.value,
                          })
                        }
                        placeholder="ABC-1234"
                        required
                      />
                    </Field>
                  </div>

                  <Field>
                    <FieldLabel>Status</FieldLabel>
                    <Select
                      value={formData.status}
                      onValueChange={(value: "active" | "inactive") =>
                        setFormData({ ...formData, status: value })
                      }
                    >
                      <SelectTrigger>
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
          </div>

          <Card className="hidden md:flex md:flex-col">
            <CardHeader>
              <CardTitle>Prévia rápida</CardTitle>
              <CardDescription>Veja como os dados ficarão após salvar.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <div className="text-xs">
                  <p className="font-medium">{preview.name}</p>
                  <p className="text-xs text-muted-foreground">CPF: {preview.cpf}</p>
                  <p className="text-xs text-muted-foreground">
                    Telefone: {preview.phone}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Truck className="h-4 w-4 text-muted-foreground" />
                <div className="text-xs">
                  <p className="font-medium">{preview.vehicle}</p>
                  <p className="text-xs text-muted-foreground">
                    Placa: {preview.licensePlate}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">{preview.address}</p>
              </div>

              <div className="rounded-md bg-muted px-3 py-2 text-xs">
                <strong className="font-medium">Status:</strong> {preview.status === "active" ? "Ativo" : "Inativo"}
              </div>
            </CardContent>
          </Card>

          <DialogFooter className="md:col-span-3">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit">{driver ? "Salvar" : "Cadastrar"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
