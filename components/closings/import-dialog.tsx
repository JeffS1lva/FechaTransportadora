"use client"

import { useState, useRef } from "react"
import { useData } from "@/lib/data-context"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Upload, FileSpreadsheet, AlertCircle, Check } from "lucide-react"
import type { ClosingFormData } from "@/lib/types"

interface ParsedRow {
  driverId: string
  driverName: string
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
  valid: boolean
  error?: string
}

export function ImportDialog() {
  const { drivers, importClosings } = useData()
  const [open, setOpen] = useState(false)
  const [parsedData, setParsedData] = useState<ParsedRow[]>([])
  const [importing, setImporting] = useState(false)
  const [imported, setImported] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const text = await file.text()
    const lines = text.split("\n").filter((line) => line.trim())
    
    // Skip header row
    const dataLines = lines.slice(1)
    
    const parsed: ParsedRow[] = dataLines.map((line) => {
      const cols = line.split(",").map((c) => c.trim())
      
      // Expected columns: Nome, Período Início, Período Fim, Total Entregas, Entregas OK, Canceladas, Km, Valor Bruto, Comissão %, Combustível, Adiantamentos, Descontos, Horas Regulares, Horas Extras
      const driverName = cols[0] || ""
      const driver = drivers.find(
        (d) => d.name.toLowerCase() === driverName.toLowerCase()
      )

      const row: ParsedRow = {
        driverId: driver?.id || "",
        driverName,
        periodStart: cols[1] || "",
        periodEnd: cols[2] || "",
        totalDeliveries: parseInt(cols[3]) || 0,
        completedDeliveries: parseInt(cols[4]) || 0,
        canceledDeliveries: parseInt(cols[5]) || 0,
        kmDriven: parseInt(cols[6]) || 0,
        grossValue: parseFloat(cols[7]) || 0,
        commissionRate: parseFloat(cols[8]) || 15,
        fuelCost: parseFloat(cols[9]) || 0,
        advances: parseFloat(cols[10]) || 0,
        discounts: parseFloat(cols[11]) || 0,
        regularHours: parseInt(cols[12]) || 176,
        overtimeHours: parseInt(cols[13]) || 0,
        valid: !!driver,
        error: !driver ? "Motorista não encontrado" : undefined,
      }

      return row
    })

    setParsedData(parsed)
  }

  const handleImport = () => {
    setImporting(true)
    const validData: ClosingFormData[] = parsedData
      .filter((row) => row.valid)
      .map((row) => ({
        driverId: row.driverId,
        periodStart: row.periodStart,
        periodEnd: row.periodEnd,
        totalDeliveries: row.totalDeliveries,
        completedDeliveries: row.completedDeliveries,
        canceledDeliveries: row.canceledDeliveries,
        kmDriven: row.kmDriven,
        grossValue: row.grossValue,
        commissionRate: row.commissionRate,
        fuelCost: row.fuelCost,
        advances: row.advances,
        discounts: row.discounts,
        regularHours: row.regularHours,
        overtimeHours: row.overtimeHours,
      }))

    importClosings(validData)
    setImporting(false)
    setImported(true)
    setTimeout(() => {
      setOpen(false)
      setParsedData([])
      setImported(false)
    }, 1500)
  }

  const validCount = parsedData.filter((r) => r.valid).length
  const invalidCount = parsedData.filter((r) => !r.valid).length

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="h-4 w-4 mr-2" />
          Importar CSV
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-200 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importar Fechamentos</DialogTitle>
          <DialogDescription>
            Importe fechamentos a partir de um arquivo CSV
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              ref={fileInputRef}
              className="hidden"
            />
            <FileSpreadsheet className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground mb-4">
              Arraste um arquivo CSV ou clique para selecionar
            </p>
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
            >
              Selecionar Arquivo
            </Button>
          </div>

          <div className="rounded-lg bg-muted p-4 text-sm">
            <p className="font-medium mb-2">Formato esperado do CSV:</p>
            <code className="text-xs text-muted-foreground block overflow-x-auto">
              Nome, Período Início, Período Fim, Total Entregas, Entregas OK,
              Canceladas, Km, Valor Bruto, Comissão %, Combustível,
              Adiantamentos, Descontos, Horas Regulares, Horas Extras
            </code>
          </div>

          {parsedData.length > 0 && (
            <>
              <div className="flex items-center gap-4 text-sm">
                <span className="flex items-center gap-1 text-primary">
                  <Check className="h-4 w-4" />
                  {validCount} válidos
                </span>
                {invalidCount > 0 && (
                  <span className="flex items-center gap-1 text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    {invalidCount} com erros
                  </span>
                )}
              </div>

              <div className="rounded-lg border border-border overflow-hidden max-h-75 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Status</TableHead>
                      <TableHead>Motorista</TableHead>
                      <TableHead>Período</TableHead>
                      <TableHead>Entregas</TableHead>
                      <TableHead>Valor Bruto</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedData.map((row, i) => (
                      <TableRow
                        key={i}
                        className={!row.valid ? "bg-destructive/10" : ""}
                      >
                        <TableCell>
                          {row.valid ? (
                            <Check className="h-4 w-4 text-primary" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-destructive" />
                          )}
                        </TableCell>
                        <TableCell>
                          {row.driverName}
                          {row.error && (
                            <span className="text-xs text-destructive block">
                              {row.error}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {row.periodStart} - {row.periodEnd}
                        </TableCell>
                        <TableCell>{row.totalDeliveries}</TableCell>
                        <TableCell>
                          {new Intl.NumberFormat("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          }).format(row.grossValue)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setParsedData([])}>
                  Limpar
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={validCount === 0 || importing || imported}
                >
                  {imported ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Importado!
                    </>
                  ) : (
                    `Importar ${validCount} fechamento(s)`
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
