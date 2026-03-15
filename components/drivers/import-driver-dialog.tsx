"use client"

import { useState, useRef } from "react"
import { toast } from "sonner"
import { useData } from "@/lib/data-context"
import { Button } from "@/components/ui/button"
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Upload, FileSpreadsheet, AlertCircle, Check } from "lucide-react"
import type { Driver } from "@/lib/types"

interface ImportDriverDialogProps {
  trigger?: React.ReactNode
}

interface ParsedRow {
  name: string
  cpf: string
  vehicle: string
  licensePlate: string
  status: "active" | "inactive"
  error?: string
  valid: boolean
}

export function ImportDriverDialog({ trigger }: ImportDriverDialogProps) {
  const { drivers, addDriver } = useData()
  const [open, setOpen] = useState(false)
  const [parsedData, setParsedData] = useState<ParsedRow[]>([])
  const [importing, setImporting] = useState(false)
  const [imported, setImported] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const normalizeCpf = (cpf: string) => cpf.replace(/\D/g, "")

  const resetState = () => {
    setParsedData([])
    setImporting(false)
    setImported(false)
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImported(false)

    const text = await file.text()
    const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)

    if (lines.length <= 1) {
      toast.error("Arquivo CSV vazio ou sem cabeçalho")
      return
    }

    // Use headers to map columns, but fallback to common header names.
    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase())
    const rows = lines.slice(1)

    const existingCpf = new Set(drivers.map((d) => normalizeCpf(d.cpf)))
    const seenCpfs = new Set<string>()

    const parsed: ParsedRow[] = rows.map((row) => {
      const cols = row.split(",").map((c) => c.trim())
      const rowData = headers.reduce<Record<string, string>>((acc, key, index) => {
        acc[key] = cols[index] ?? ""
        return acc
      }, {})

      const cpf = rowData["cpf"] || ""
      const normalizedCpf = normalizeCpf(cpf)
      const name = rowData["name"] || rowData["nome"] || ""
      const vehicle = rowData["vehicle"] || rowData["veiculo"] || ""
      const licensePlate = rowData["licenseplate"] || rowData["placa"] || ""
      const status = (rowData["status"] === "inactive" ? "inactive" : "active") as
        | "active"
        | "inactive"

      let valid = true
      let error: string | undefined

      if (!name) {
        valid = false
        error = "Nome é obrigatório"
      } else if (!normalizedCpf) {
        valid = false
        error = "CPF inválido"
      } else if (existingCpf.has(normalizedCpf)) {
        valid = false
        error = "CPF já cadastrado"
      } else if (seenCpfs.has(normalizedCpf)) {
        valid = false
        error = "CPF duplicado no arquivo"
      }

      if (normalizedCpf) {
        seenCpfs.add(normalizedCpf)
      }

      return {
        name,
        cpf,
        vehicle,
        licensePlate,
        status,
        valid,
        error,
      }
    })

    setParsedData(parsed)
  }

  const handleImport = () => {
    setImporting(true)

    const validRows = parsedData.filter((row) => row.valid)

    validRows.forEach((row) => {
      addDriver({
        name: row.name,
        cpf: row.cpf,
        phone: "",
        vehicle: row.vehicle,
        licensePlate: row.licensePlate,
        status: row.status,
        cnh: "",
        cnhCategory: "",
        cnhExpiration: "",
        professionalRegister: "",
        cep: "",
        street: "",
        number: "",
        complement: "",
        neighborhood: "",
        city: "",
        state: "",
        vehicleYear: "",
        vehicleColor: "",
        renavam: "",
        observations: "",
        secondaryPhone: "",
        email: "",
        birthDate: "",
        rg: "",
      })
    })

    setImporting(false)
    setImported(true)

    toast.success(`Importados ${validRows.length} motorista(s)`)

    setTimeout(() => {
      resetState()
      setImported(false)
      setOpen(false)
    }, 1500)
  }

  const validCount = parsedData.filter((r) => r.valid).length
  const invalidCount = parsedData.filter((r) => !r.valid).length

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        if (!open) resetState()
        setOpen(open)
      }}
    >
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-2" />
            Importar CSV
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-200 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importar Motoristas</DialogTitle>
          <DialogDescription>
            Importe motoristas a partir de um arquivo CSV.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
            />
            <FileSpreadsheet className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground mb-4">
              Arraste um arquivo CSV ou clique para selecionar
            </p>
            <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
              Selecionar Arquivo
            </Button>
          </div>

          <div className="rounded-lg bg-muted p-4 text-sm">
            <p className="font-medium mb-2">Formato esperado do CSV:</p>
            <code className="text-xs text-muted-foreground block overflow-x-auto">
              Nome, CPF, Telefone, Veículo, Placa, CNH, Categoria CNH, Validade CNH, Status, CEP, Rua, Número, Complemento, Bairro, Cidade, UF
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
                      <TableHead>Nome</TableHead>
                      <TableHead>CPF</TableHead>
                      <TableHead>Veículo</TableHead>
                      <TableHead>Placa</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedData.map((row, idx) => (
                      <TableRow key={idx} className={!row.valid ? "bg-destructive/10" : ""}>
                        <TableCell>
                          {row.valid ? (
                            <Check className="h-4 w-4 text-primary" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-destructive" />
                          )}
                        </TableCell>
                        <TableCell>
                          {row.name}
                          {row.error && (
                            <span className="text-xs text-destructive block">
                              {row.error}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>{row.cpf}</TableCell>
                        <TableCell>{row.vehicle}</TableCell>
                        <TableCell>{row.licensePlate}</TableCell>
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
                    `Importar ${validCount} motorista(s)`
                  )}
                </Button>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
