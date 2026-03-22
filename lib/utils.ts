import { clsx, type ClassValue } from 'clsx'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Adicione ao seu lib/utils.ts
export function formatSafeDate(dateStr: string | null | undefined, formatStr: string = "dd/MM/yy", fallback: string = "—"): string {
  if (!dateStr?.trim()) return fallback
  try {
    const cleaned = dateStr.trim().replace(/[^\d/]/g, "")
    const parts = cleaned.split("/")
    if (parts.length !== 3) return fallback
    let [day, month, year] = parts.map(Number)
    if (year < 100) year += 2000
    const isoDate = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    const dateObj = new Date(isoDate)
    if (isNaN(dateObj.getTime())) return fallback
    return format(dateObj, formatStr, { locale: ptBR })
  } catch {
    return fallback
  }
}