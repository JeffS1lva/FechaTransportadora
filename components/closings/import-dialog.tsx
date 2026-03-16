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
  DialogOverlay,
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

  // Verifica se é arquivo Excel binário
  const isExcelBinary = (buffer: ArrayBuffer): boolean => {
    const view = new Uint8Array(buffer)
    return (
      (view[0] === 0x50 && view[1] === 0x4B) || // ZIP (xlsx)
      (view[0] === 0xD0 && view[1] === 0xCF)    // OLE (xls)
    )
  }

  // Lê arquivo Excel usando SheetJS
  const readExcelFile = async (buffer: ArrayBuffer): Promise<{ headers: string[]; rows: any[][] }> => {
    const XLSX = await import('xlsx')
    
    const workbook = XLSX.read(new Uint8Array(buffer), { 
      type: 'array',
      cellFormula: false,
      cellHTML: false,
      cellText: true
    })
    
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
    const data = XLSX.utils.sheet_to_json(firstSheet, { 
      header: 1,
      defval: "",
      blankrows: false
    }) as any[][]
    
    if (data.length < 2) {
      throw new Error("Planilha vazia ou sem dados")
    }
    
    const headers = data[0].map(h => String(h || "").toLowerCase().trim())
    const rows = data.slice(1)
    
    return { headers, rows }
  }

  // Parser para arquivos de texto (CSV, TSV, Markdown)
  const parseTextFile = (content: string): { headers: string[]; rows: any[][] } => {
    // Detecta se é Markdown
    if (content.includes('|')) {
      return parseMarkdown(content)
    }
    
    // Detecta delimitador
    const firstLine = content.split('\n')[0] || ""
    const tabs = (firstLine.match(/\t/g) || []).length
    const semicolons = (firstLine.match(/;/g) || []).length
    const commas = (firstLine.match(/,/g) || []).length
    
    const delimiter = tabs > semicolons && tabs > commas ? '\t' : 
                      semicolons > commas ? ';' : ','
    
    return parseDelimited(content, delimiter)
  }

  const parseMarkdown = (content: string): { headers: string[]; rows: any[][] } => {
    const lines = content
      .split(/\r?\n/)
      .map(l => l.trim())
      .filter(l => l.length > 0 && !l.match(/^[\|\s:-]+$/))
    
    if (lines.length < 2) throw new Error("Tabela Markdown inválida")
    
    const parseLine = (line: string): string[] => {
      return line
        .split('|')
        .map(cell => cell.trim())
        .filter((cell, idx, arr) => {
          if (idx === 0 || idx === arr.length - 1) return cell.length > 0
          return true
        })
    }
    
    const headers = parseLine(lines[0]).map(h => h.toLowerCase().trim())
    const rows = lines.slice(1).map(line => parseLine(line))
    
    return { headers, rows }
  }

  const parseDelimited = (content: string, delimiter: string): { headers: string[]; rows: any[][] } => {
    const lines = content
      .split(/\r?\n/)
      .map(l => l.trim())
      .filter(l => l.length > 0)
    
    if (lines.length < 2) throw new Error("Arquivo vazio")
    
    const parseLine = (line: string): string[] => {
      const result: string[] = []
      let current = ""
      let inQuotes = false
      let quoteChar = ''
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i]
        
        if ((char === '"' || char === "'") && !inQuotes) {
          inQuotes = true
          quoteChar = char
        } else if (char === quoteChar && inQuotes) {
          if (line[i + 1] === quoteChar) {
            current += char
            i++
          } else {
            inQuotes = false
          }
        } else if (char === delimiter && !inQuotes) {
          result.push(current.trim())
          current = ""
        } else {
          current += char
        }
      }
      result.push(current.trim())
      return result
    }
    
    const headers = parseLine(lines[0]).map(h => h.toLowerCase().trim())
    const rows = lines.slice(1).map(parseLine)
    
    return { headers, rows }
  }

  // Mapeamento flexível de headers
  const getHeaderMapping = (headers: string[]): Record<string, number> => {
    const map: Record<string, number> = {}
    
    headers.forEach((header, index) => {
      const h = header.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      
      if (h.includes("nome") || h === "name" || h === "motorista" || h === "colaborador") {
        map.driverName = index
      }
      else if (h.includes("inicio") || h.includes("início") || h === "periodo inicio" || h === "periodo início" || h === "data inicio" || h === "start" || h === "period start") {
        map.periodStart = index
      }
      else if (h.includes("fim") || h === "periodo fim" || h === "data fim" || h === "end" || h === "period end" || h === "término" || h === "termino") {
        map.periodEnd = index
      }
      else if ((h.includes("total") && h.includes("entrega")) || h === "total entregas" || h === "entregas total" || h === "total deliveries") {
        map.totalDeliveries = index
      }
      else if ((h.includes("ok") || h.includes("completa") || h.includes("concluida")) && h.includes("entrega")) {
        map.completedDeliveries = index
      }
      else if ((h.includes("cancelada") || h.includes("falha")) && h.includes("entrega")) {
        map.canceledDeliveries = index
      }
      else if (h.includes("km") || h === "quilometragem" || h === "distancia" || h === "distância" || h === "km driven") {
        map.kmDriven = index
      }
      else if ((h.includes("bruto") || h.includes("gross") || h.includes("total")) && (h.includes("valor") || h.includes("value") || h.includes("receita"))) {
        map.grossValue = index
      }
      else if (h.includes("comissao") || h.includes("comissão") || h === "taxa comissao" || h === "commission" || h === "commission rate" || h === "%") {
        map.commissionRate = index
      }
      else if (h.includes("combustivel") || h.includes("combustível") || h === "fuel" || h === "gasolina" || h === "diesel" || h === "fuel cost") {
        map.fuelCost = index
      }
      else if (h.includes("adiantamento") || h === "advance" || h === "adiantamentos" || h === "advances") {
        map.advances = index
      }
      else if (h.includes("desconto") || h === "discount" || h === "descontos" || h === "discounts") {
        map.discounts = index
      }
      else if ((h.includes("regular") || h.includes("normal")) && (h.includes("hora") || h.includes("hour"))) {
        map.regularHours = index
      }
      else if ((h.includes("extra") || h.includes("overtime") || h.includes("hora extra")) && (h.includes("hora") || h.includes("hour"))) {
        map.overtimeHours = index
      }
    })
    
    return map
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const ext = file.name.toLowerCase().split('.').pop() || ""
      const isExcel = ['xlsx', 'xls', 'xlsm', 'xlsb', 'ods'].includes(ext)
      
      let headers: string[] = []
      let rows: any[][] = []

      if (isExcel) {
        const buffer = await file.arrayBuffer()
        
        if (isExcelBinary(buffer)) {
          const result = await readExcelFile(buffer)
          headers = result.headers
          rows = result.rows
        } else {
          const text = new TextDecoder().decode(buffer)
          const result = parseTextFile(text)
          headers = result.headers
          rows = result.rows
        }
      } else {
        const text = await file.text()
        const result = parseTextFile(text)
        headers = result.headers
        rows = result.rows
      }

      if (rows.length === 0) {
        throw new Error("Arquivo vazio ou sem dados")
      }

      const headerMap = getHeaderMapping(headers)
      console.log("Headers:", headers)
      console.log("Mapeamento:", headerMap)

      // Verifica se tem pelo menos nome do motorista
      if (headerMap.driverName === undefined) {
        throw new Error(`Coluna "Nome" não encontrada. Colunas detectadas: ${headers.join(', ')}`)
      }

      const parsed: ParsedRow[] = rows.map((row) => {
        const getValue = (key: keyof typeof headerMap, defaultValue: string | number = ""): string => {
          const index = headerMap[key]
          return index !== undefined ? String(row[index] ?? defaultValue).trim() : String(defaultValue)
        }

        const getNumber = (key: keyof typeof headerMap, defaultValue: number = 0): number => {
          const index = headerMap[key]
          if (index === undefined) return defaultValue
          const val = String(row[index] ?? "").replace(/[^\d.,]/g, '').replace(',', '.')
          return parseFloat(val) || defaultValue
        }

        const driverName = getValue("driverName")
        const driver = drivers.find(
          (d) => d.name.toLowerCase() === driverName.toLowerCase()
        )

        const parsedRow: ParsedRow = {
          driverId: driver?.id || "",
          driverName,
          periodStart: getValue("periodStart", new Date().toISOString().split('T')[0]),
          periodEnd: getValue("periodEnd", new Date().toISOString().split('T')[0]),
          totalDeliveries: getNumber("totalDeliveries", 0),
          completedDeliveries: getNumber("completedDeliveries", 0),
          canceledDeliveries: getNumber("canceledDeliveries", 0),
          kmDriven: getNumber("kmDriven", 0),
          grossValue: getNumber("grossValue", 0),
          commissionRate: getNumber("commissionRate", 15),
          fuelCost: getNumber("fuelCost", 0),
          advances: getNumber("advances", 0),
          discounts: getNumber("discounts", 0),
          regularHours: getNumber("regularHours", 176),
          overtimeHours: getNumber("overtimeHours", 0),
          valid: !!driver,
          error: !driver ? "Motorista não encontrado" : undefined,
        }

        return parsedRow
      })

      setParsedData(parsed)
      
      const validCount = parsed.filter((p) => p.valid).length
      if (validCount > 0) {
        // toast.success(`${validCount} registros válidos encontrados`)
      } else if (parsed.length > 0) {
        // toast.error("Nenhum motorista encontrado no sistema")
      }

    } catch (err) {
      console.error("Erro ao processar arquivo:", err)
      // toast.error(`Erro: ${err instanceof Error ? err.message : "Formato inválido"}`)
    }
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
      <DialogOverlay className="backdrop-blur-sm bg-black/40" />
      <DialogContent className="sm:max-w-200 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importar Fechamentos</DialogTitle>
          <DialogDescription>
            Importe fechamentos a partir de um arquivo CSV, Excel ou outros formatos de planilha.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
            <input
              type="file"
              accept=".csv,.xlsx,.xls,.xlsm,.ods,.txt,.tsv"
              onChange={handleFileChange}
              ref={fileInputRef}
              className="hidden"
            />
            <FileSpreadsheet className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground mb-4">
              Arraste um arquivo ou clique para selecionar
            </p>
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
            >
              Selecionar Arquivo
            </Button>
          </div>

          <div className="rounded-lg bg-muted p-4 text-sm space-y-3">
            <div>
              <p className="font-medium mb-2">Formato esperado:</p>
              <code className="text-xs text-muted-foreground block overflow-x-auto whitespace-pre-wrap">
                Nome,Período Início,Período Fim,Total Entregas,Entregas OK,Canceladas,Km,Valor Bruto,Comissão %,Combustível,Adiantamentos,Descontos,Horas Regulares,Horas Extras
              </code>
            </div>
            
            <div className="border-t border-border pt-3">
              <p className="font-medium mb-2">Tipos de planilha aceitos:</p>
              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  <span>Excel (.xlsx, .xls, .xlsm)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  <span>CSV (vírgula ou ponto-e-vírgula)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-purple-500" />
                  <span>LibreOffice/OpenOffice (.ods)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-orange-500" />
                  <span>TSV (tabulação)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-pink-500" />
                  <span>Google Sheets (exportado)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-gray-500" />
                  <span>Texto delimitado (.txt)</span>
                </div>
              </div>
            </div>
            
            <p className="text-xs text-muted-foreground border-t border-border pt-2">
              O sistema detecta automaticamente as colunas. Apenas <strong>Nome</strong> é obrigatório.
            </p>
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