export type UserRole = "admin" | "editor" | "viewer"

export interface User {
  status: string
  createdAt: string
  id: string
  name: string
  email: string
  role: UserRole
}

export interface Driver {
  cnhCategory: string
  cnhExpiration: string
  professionalRegister: string
  cep: string
  street: string
  number: string
  complement: string
  neighborhood: string
  city: string
  state: string
  vehicleYear: string
  vehicleColor: string
  renavam: string
  observations: string
  cnh: string
  secondaryPhone: string
  email: string
  birthDate: string
  rg: string
  id: string
  name: string
  cpf: string
  phone: string
  vehicle: string
  licensePlate: string
  status: "active" | "inactive"
  createdAt: string
}

export interface Closing {
  id: string
  driverId: string
  driverName: string
  period: {
    start: string
    end: string
  }
  deliveries: {
    total: number
    completed: number
    canceled: number
    kmDriven: number
  }
  financial: {
    grossValue: number
    commission: number
    fuelCost: number
    advances: number
    discounts: number
    netValue: number
  }
  hours: {
    regular: number
    overtime: number
    total: number
  }
  status: "pending" | "approved" | "paid"
  createdAt: string
  approvedAt?: string
  approvedBy?: string
}

export interface ClosingFormData {
  driverId: string
  periodStart: string
  periodEnd: string
  totalDeliveries: number
  completedDeliveries: number
  canceledDeliveries: number
  kmDriven: number
  grossValue: number
  commissionRate: number
  fuelCost: number
  advances: number
  discounts: number
  regularHours: number
  overtimeHours: number
}
