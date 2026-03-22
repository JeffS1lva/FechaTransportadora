"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import type { Driver, Closing, ClosingFormData } from "./types"

interface DataContextType {
  drivers: Driver[]
  closings: Closing[]
  addDriver: (driver: Omit<Driver, "id" | "createdAt">) => void
  updateDriver: (id: string, driver: Partial<Driver>) => void
  deleteDriver: (id: string) => void
  addClosing: (data: ClosingFormData) => void
  updateClosing: (id: string, data: Partial<ClosingFormData>) => void
  updateClosingStatus: (id: string, status: Closing["status"], approvedBy?: string) => void
  deleteClosing: (id: string) => void
  importClosings: (closings: ClosingFormData[]) => void
}

const DataContext = createContext<DataContextType | undefined>(undefined)

const INITIAL_DRIVERS: Driver[] = [
  {
    id: "d1",
    name: "João Santos",
    cpf: "123.456.789-00",
    cnh: "",
    cnhCategory: "B",
    cnhExpiration: "2026-01-01",
    professionalRegister: "",
    cep: "01001-000",
    street: "Praça da Sé",
    number: "1",
    complement: "",
    neighborhood: "Sé",
    city: "São Paulo",
    state: "SP",
    vehicle: "Fiat Fiorino",
    vehicleYear: "2015",
    vehicleColor: "Branco",
    renavam: "",
    observations: "",
    secondaryPhone: "",
    email: "",
    birthDate: "1985-05-15",
    rg: "",
    phone: "(11) 99999-1111",
    licensePlate: "ABC-1234",
    status: "active",
    createdAt: "2024-01-15",
  },
  {
    id: "d2",
    name: "Carlos Oliveira",
    cpf: "987.654.321-00",
    cnh: "",
    cnhCategory: "B",
    cnhExpiration: "2027-05-10",
    professionalRegister: "",
    cep: "20040-020",
    street: "Rua da Assembleia",
    number: "10",
    complement: "",
    neighborhood: "Centro",
    city: "Rio de Janeiro",
    state: "RJ",
    vehicle: "VW Saveiro",
    vehicleYear: "2018",
    vehicleColor: "Prata",
    renavam: "",
    observations: "",
    secondaryPhone: "",
    email: "",
    birthDate: "1990-08-20",
    rg: "",
    phone: "(11) 99999-2222",
    licensePlate: "DEF-5678",
    status: "active",
    createdAt: "2024-02-01",
  },
  {
    id: "d3",
    name: "Pedro Lima",
    cpf: "456.789.123-00",
    cnh: "",
    cnhCategory: "B",
    cnhExpiration: "2025-03-30",
    professionalRegister: "",
    cep: "30110-080",
    street: "Avenida Amazonas",
    number: "200",
    complement: "",
    neighborhood: "Centro",
    city: "Belo Horizonte",
    state: "MG",
    vehicle: "Renault Kangoo",
    vehicleYear: "2017",
    vehicleColor: "Cinza",
    renavam: "",
    observations: "",
    secondaryPhone: "",
    email: "",
    birthDate: "1988-11-02",
    rg: "",
    phone: "(11) 99999-3333",
    licensePlate: "GHI-9012",
    status: "active",
    createdAt: "2024-03-10",
  },
]

const INITIAL_CLOSINGS: Closing[] = [
  {
    id: "c1",
    driverId: "d1",
    driverName: "João Santos",
    period: { start: "2024-02-01", end: "2024-02-15" },
    deliveries: { total: 150, completed: 145, canceled: 5, kmDriven: 1200 },
    financial: { grossValue: 4500, commission: 675, fuelCost: 450, advances: 200, discounts: 50, netValue: 3125 },
    hours: { regular: 176, overtime: 12, total: 188 },
    status: "paid",
    createdAt: "2024-02-16",
    approvedAt: "2024-02-17",
    approvedBy: "Administrador",
  },
  {
    id: "c2",
    driverId: "d2",
    driverName: "Carlos Oliveira",
    period: { start: "2024-02-01", end: "2024-02-15" },
    deliveries: { total: 180, completed: 175, canceled: 5, kmDriven: 1450 },
    financial: { grossValue: 5400, commission: 810, fuelCost: 580, advances: 0, discounts: 0, netValue: 4010 },
    hours: { regular: 176, overtime: 20, total: 196 },
    status: "approved",
    createdAt: "2024-02-16",
    approvedAt: "2024-02-18",
    approvedBy: "Administrador",
  },
  {
    id: "c3",
    driverId: "d3",
    driverName: "Pedro Lima",
    period: { start: "2024-02-16", end: "2024-02-29" },
    deliveries: { total: 160, completed: 155, canceled: 5, kmDriven: 1300 },
    financial: { grossValue: 4800, commission: 720, fuelCost: 520, advances: 300, discounts: 100, netValue: 3160 },
    hours: { regular: 176, overtime: 8, total: 184 },
    status: "pending",
    createdAt: "2024-03-01",
  },
]

export function DataProvider({ children }: { children: ReactNode }) {
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [closings, setClosings] = useState<Closing[]>([])
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    const storedDrivers = localStorage.getItem("drivers")
    const storedClosings = localStorage.getItem("closings")

    if (storedDrivers) {
      try {
        setDrivers(JSON.parse(storedDrivers))
      } catch {
        setDrivers(INITIAL_DRIVERS)
      }
    } else {
      setDrivers(INITIAL_DRIVERS)
    }

    if (storedClosings) {
      try {
        setClosings(JSON.parse(storedClosings))
      } catch {
        setClosings(INITIAL_CLOSINGS)
      }
    } else {
      setClosings(INITIAL_CLOSINGS)
    }

    setIsInitialized(true)
  }, [])

  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem("drivers", JSON.stringify(drivers))
    }
  }, [drivers, isInitialized])

  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem("closings", JSON.stringify(closings))
    }
  }, [closings, isInitialized])

  const generateDriverId = () => {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID()
    }

    return `d${Date.now()}-${Math.random().toString(16).slice(2)}`
  }

  const addDriver = (driver: Omit<Driver, "id" | "createdAt">) => {
    const newDriver: Driver = {
      ...driver,
      id: generateDriverId(),
      createdAt: new Date().toISOString().split("T")[0],
    }
    setDrivers((prev) => [...prev, newDriver])
  }

  const updateDriver = (id: string, data: Partial<Driver>) => {
    setDrivers((prev) =>
      prev.map((d) => (d.id === id ? { ...d, ...data } : d))
    )
  }

  const deleteDriver = (id: string) => {
    setDrivers((prev) => prev.filter((d) => d.id !== id))
  }

  const generateClosingId = () => {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID()
    }

    return `c${Date.now()}-${Math.random().toString(16).slice(2)}`
  }

  const addClosing = (data: ClosingFormData) => {
    const driver = drivers.find((d) => d.id === data.driverId)
    if (!driver) return

    const commission = data.grossValue * (data.commissionRate / 100)
    const netValue = data.grossValue - commission - data.fuelCost - data.advances - data.discounts

    const newClosing: Closing = {
      id: generateClosingId(),
      driverId: data.driverId,
      driverName: driver.name,
      period: { start: data.periodStart, end: data.periodEnd },
      deliveries: {
        total: data.totalDeliveries,
        completed: data.completedDeliveries,
        canceled: data.canceledDeliveries,
        kmDriven: data.kmDriven,
      },
      financial: {
        grossValue: data.grossValue,
        commission,
        fuelCost: data.fuelCost,
        advances: data.advances,
        discounts: data.discounts,
        netValue,
      },
      hours: {
        regular: data.regularHours,
        overtime: data.overtimeHours,
        total: data.regularHours + data.overtimeHours,
      },
      status: "pending",
      createdAt: new Date().toISOString().split("T")[0],
    }
    setClosings((prev) => [...prev, newClosing])
  }

  const updateClosing = (id: string, data: Partial<ClosingFormData>) => {
    setClosings((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c

        const driver = data.driverId 
          ? drivers.find((d) => d.id === data.driverId) 
          : undefined

        const commission = data.grossValue !== undefined && data.commissionRate !== undefined
          ? data.grossValue * (data.commissionRate / 100)
          : c.financial.commission

        const netValue = data.grossValue !== undefined
          ? data.grossValue - commission - (data.fuelCost ?? c.financial.fuelCost) - (data.advances ?? c.financial.advances) - (data.discounts ?? c.financial.discounts)
          : c.financial.netValue

        return {
          ...c,
          driverId: data.driverId ?? c.driverId,
          driverName: driver?.name ?? c.driverName,
          period: {
            start: data.periodStart ?? c.period.start,
            end: data.periodEnd ?? c.period.end,
          },
          deliveries: {
            total: data.totalDeliveries ?? c.deliveries.total,
            completed: data.completedDeliveries ?? c.deliveries.completed,
            canceled: data.canceledDeliveries ?? c.deliveries.canceled,
            kmDriven: data.kmDriven ?? c.deliveries.kmDriven,
          },
          financial: {
            grossValue: data.grossValue ?? c.financial.grossValue,
            commission,
            fuelCost: data.fuelCost ?? c.financial.fuelCost,
            advances: data.advances ?? c.financial.advances,
            discounts: data.discounts ?? c.financial.discounts,
            netValue,
          },
          hours: {
            regular: data.regularHours ?? c.hours.regular,
            overtime: data.overtimeHours ?? c.hours.overtime,
            total: (data.regularHours ?? c.hours.regular) + (data.overtimeHours ?? c.hours.overtime),
          },
        }
      })
    )
  }

  const updateClosingStatus = (id: string, status: Closing["status"], approvedBy?: string) => {
    setClosings((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
            ...c,
            status,
            approvedAt: status !== "pending" ? new Date().toISOString().split("T")[0] : undefined,
            approvedBy: approvedBy || c.approvedBy,
          }
          : c
      )
    )
  }

  const deleteClosing = (id: string) => {
    setClosings((prev) => prev.filter((c) => c.id !== id))
  }

  const importClosings = (data: ClosingFormData[]) => {
    data.forEach((item) => addClosing(item))
  }

  return (
    <DataContext.Provider
      value={{
        drivers,
        closings,
        addDriver,
        updateDriver,
        deleteDriver,
        addClosing,
        updateClosing,
        updateClosingStatus,
        deleteClosing,
        importClosings,
      }}
    >
      {children}
    </DataContext.Provider>
  )
}

export function useData() {
  const context = useContext(DataContext)
  if (context === undefined) {
    throw new Error("useData must be used within a DataProvider")
  }
  return context
}