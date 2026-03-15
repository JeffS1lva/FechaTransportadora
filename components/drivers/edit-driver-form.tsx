"use client"

import { useState } from "react"
import { useData } from "@/lib/data-context"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field"
import type { Driver } from "@/lib/types"

interface EditDriverFormProps {
  driver: Driver
  onClose: () => void
}

export function EditDriverForm({ driver, onClose }: EditDriverFormProps) {
  const { updateDriver } = useData()
  const [formData, setFormData] = useState({
    name: driver.name,
    cpf: driver.cpf,
    phone: driver.phone,
    vehicle: driver.vehicle,
    licensePlate: driver.licensePlate,
    status: driver.status,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateDriver(driver.id, formData)
    toast.success("Motorista atualizado", {
      description: "Os dados do motorista foram atualizados com sucesso.",
      style: {
        border: '1px solid #065f46', // verde bem escuro para a borda
        background: '#15803d',       // verde escuro para o fundo
        color: '#ffffff',             // texto branco
      }
    })
    onClose()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
                setFormData({ ...formData, licensePlate: e.target.value })
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
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit">Salvar</Button>
      </div>
    </form>
  )
}
