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
import { Progress } from "@/components/ui/progress"
import { 
  Upload, 
  FileSpreadsheet, 
  AlertCircle, 
  Check, 
  Loader2, 
  CheckCircle2,
  FileUp,
  FileText,
  Cog,
  Database
} from "lucide-react"
import * as XLSX from "xlsx"
import type { ClosingFormData } from "@/lib/types"
import { cn } from "@/lib/utils"

interface ParsedRow {
  driverName: string
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
  valid: boolean
  error?: string
}

type Step = 'upload' | 'read' | 'process' | 'save' | 'done'

const STEPS: { id: Step; label: string; icon: typeof Loader2 }[] = [
  { id: 'upload', label: 'Enviando', icon: FileUp },
  { id: 'read', label: 'Lendo arquivo', icon: FileText },
  { id: 'process', label: 'Processando', icon: Cog },
  { id: 'save', label: 'Salvando', icon: Database },
  { id: 'done', label: 'Concluído', icon: CheckCircle2 },
]

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export function ImportDialog() {
  const { drivers, importClosings } = useData()
  const [open, setOpen] = useState(false)
  const [parsedData, setParsedData] = useState<ParsedRow[]>([])
  const [importing, setImporting] = useState(false)
  const [imported, setImported] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [currentStep, setCurrentStep] = useState<Step>('upload')
  const [progress, setProgress] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [isDragging, setIsDragging] = useState(false)

  const normalizeText = (text: string): string => {
    return text.toString().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ").trim()
  }

  const parseMoney = (val: any): number => {
    if (typeof val === "number") return val
    if (!val || val === "") return 0
    const str = String(val).replace(/R\$/g, "").replace(/\s/g, "").replace(/\./g, "").replace(",", ".").trim()
    return parseFloat(str) || 0
  }

  const parseIntSafe = (val: any): number => {
    if (typeof val === "number") return val
    return parseInt(String(val || "0").trim(), 10) || 0
  }

  const findColumnIndex = (headers: string[], ...possibleNames: string[]): number => {
    const normalizedHeaders = headers.map((h, idx) => ({ original: h, normalized: normalizeText(h), index: idx }))
    for (const name of possibleNames) {
      const normalizedName = normalizeText(name)
      const match = normalizedHeaders.find(h => h.normalized.includes(normalizedName) || normalizedName.includes(h.normalized))
      if (match) return match.index
    }
    return -1
  }

  const runStep = async (step: Step, duration: number, action?: () => Promise<void>) => {
    setCurrentStep(step)
    setProgress(0)
    
    const startTime = Date.now()
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime
      const pct = Math.min((elapsed / duration) * 100, 100)
      setProgress(Math.floor(pct))
    }, 50)

    if (action) await action()
    
    const elapsed = Date.now() - startTime
    if (elapsed < duration) await delay(duration - elapsed)
    
    clearInterval(interval)
    setProgress(100)
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    await processFile(file)
  }

  const processFile = async (file: File) => {
    setIsLoading(true)
    setParsedData([])
    setImported(false)
    setMessage(file.name)

    const fileExt = file.name.split(".").pop()?.toLowerCase()

    try {
      // Step 1: Upload (1s)
      await runStep('upload', 1000)

      // Step 2: Read (2s)
      let header: string[] = []
      let dataRows: any[][] = []
      
      await runStep('read', 2000, async () => {
        if (fileExt === "csv" || fileExt === "txt") {
          const text = await file.text()
          const delimiter = text.includes(";") ? ";" : ","
          const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean)
          if (lines.length < 3) throw new Error("Arquivo muito curto")
          
          let headerIndex = 0
          for (let i = 0; i < Math.min(10, lines.length); i++) {
            if (normalizeText(lines[i]).includes("rotulos") || normalizeText(lines[i]).includes("nome")) {
              headerIndex = i
              break
            }
          }
          
          header = lines[headerIndex].split(delimiter).map(h => h.trim())
          dataRows = lines.slice(headerIndex + 1).map(line => line.split(delimiter).map(c => c.trim()))
        }
        else if (fileExt === "xlsx" || fileExt === "xls") {
          const arrayBuffer = await file.arrayBuffer()
          const workbook = XLSX.read(arrayBuffer, { type: "array", cellDates: true })
          const worksheet = workbook.Sheets[workbook.SheetNames[0]]
          const json = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1, blankrows: false, defval: "" }) as any[][]

          if (json.length < 3) throw new Error("Planilha muito curta")

          let headerIndex = 0
          for (let i = 0; i < Math.min(15, json.length); i++) {
            const rowText = json[i]?.map((c: any) => normalizeText(String(c || ""))).join(" ") || ""
            if (rowText.includes("rotulos") || rowText.includes("contagem") || rowText.includes("apurado")) {
              headerIndex = i
              break
            }
          }

          header = json[headerIndex].map((h: any) => String(h || "").trim())
          dataRows = json.slice(headerIndex + 1)
        }
        else {
          throw new Error("Formato não suportado")
        }
      })

      // Step 3: Process (2.5s)
      const parsed: ParsedRow[] = []
      
      await runStep('process', 2500, async () => {
        const idxName = findColumnIndex(header, "rotulos de linha", "nome", "motorista", "driver", "colaborador")
        const idxTotal = findColumnIndex(header, "contagem de waybill", "contagem", "total", "waybill")
        const idxApurado = findColumnIndex(header, "apurado", "ok", "entregue", "concluido")
        const idxReceber = findColumnIndex(header, "receber", "valor", "bruto", "total receber")
        const idxExtravio = findColumnIndex(header, "extravio", "perda", "desconto", "danos")

        if (idxName === -1) throw new Error("Coluna de nomes não encontrada")

        const periodStart = "01/02/2026"
        const periodEnd = "15/02/2026"

        for (const row of dataRows) {
          if (!row || row.length === 0) continue
          const firstCell = String(row[0] || "").trim()
          if (!firstCell || normalizeText(firstCell).includes("total")) continue

          const driverName = String(row[idxName] || "").trim()
          if (!driverName || driverName.length < 2) continue

          const driver = drivers.find(d => {
            const dbName = normalizeText(d.name)
            const fileName = normalizeText(driverName)
            return dbName === fileName || dbName.includes(fileName) || fileName.includes(dbName)
          })

          const totalDeliveries = idxTotal !== -1 ? parseIntSafe(row[idxTotal]) : 0
          const completedDeliveries = idxApurado !== -1 ? parseIntSafe(row[idxApurado]) : totalDeliveries

          parsed.push({
            driverName,
            driverId: driver?.id || "",
            periodStart,
            periodEnd,
            totalDeliveries,
            completedDeliveries,
            canceledDeliveries: Math.max(0, totalDeliveries - completedDeliveries),
            kmDriven: 0,
            grossValue: idxReceber !== -1 ? parseMoney(row[idxReceber]) : 0,
            commissionRate: 0,
            fuelCost: 0,
            advances: 0,
            discounts: idxExtravio !== -1 ? parseMoney(row[idxExtravio]) : 0,
            regularHours: 0,
            overtimeHours: 0,
            valid: !!driver?.id,
            error: !driver ? `Motorista não cadastrado: "${driverName}"` : undefined,
          })
        }
      })

      setParsedData(parsed)
      setIsLoading(false)

      if (parsed.length === 0) {
        throw new Error("Nenhum dado válido encontrado")
      }

    } catch (err: any) {
      setIsLoading(false)
      alert(`Erro: ${err.message}`)
    }
  }

  const handleImport = async () => {
    const validData = parsedData.filter(r => r.valid)
    if (validData.length === 0) return

    setImporting(true)
    setIsLoading(true)

    // Step 4: Save (3s)
    await runStep('save', 3000, async () => {
      for (let i = 0; i < validData.length; i++) {
        importClosings([validData[i]])
        if (i % 3 === 0) await delay(100)
      }
    })

    // Step 5: Done (1s)
    await runStep('done', 1000)
    
    setImporting(false)
    setImported(true)
    setIsLoading(false)

    setTimeout(() => {
      setOpen(false)
      setParsedData([])
      setImported(false)
      setCurrentStep('upload')
      setProgress(0)
    }, 1500)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }

  const currentStepIndex = STEPS.findIndex(s => s.id === currentStep)
  const validCount = parsedData.filter(r => r.valid).length
  const invalidCount = parsedData.length - validCount

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="w-full sm:w-auto h-10 sm:h-11 cursor-pointer">
            <Upload className="h-4 w-4 mr-2" />
            Importar Fechamento
          </Button>
        </DialogTrigger>

        <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden p-0 gap-0">
          {/* Header */}
          <DialogHeader className="px-6 py-4 border-b bg-muted/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileSpreadsheet className="h-5 w-5 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold">Importar Fechamento de Entregas</DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground">
                  Aceita arquivos <strong>.csv</strong>, <strong>.txt</strong>, <strong>.xlsx</strong> ou <strong>.xls</strong>
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-100px)]">
            {/* Upload Area - PADRONIZADO */}
            {!parsedData.length && (
              <div 
                className={cn(
                  "relative cursor-pointer rounded-xl border-2 border-dashed transition-all duration-200 p-10",
                  isDragging 
                    ? "border-primary bg-primary/5" 
                    : "border-border hover:border-primary/50 hover:bg-muted/30"
                )}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  type="file"
                  accept=".csv,.txt,.xlsx,.xls"
                  onChange={handleFileChange}
                  ref={fileInputRef}
                  className="hidden"
                />
                
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className={cn(
                    "w-16 h-16 rounded-full flex items-center justify-center transition-colors duration-200",
                    isDragging ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  )}>
                    <FileUp className="h-8 w-8" />
                  </div>
                  
                  <div className="space-y-1">
                    <p className="font-medium">
                      {isDragging ? 'Solte o arquivo aqui' : 'Arraste ou selecione o arquivo'}
                    </p>
                    <p className="text-sm text-muted-foreground">Clique para selecionar</p>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="px-2 py-1 rounded bg-muted font-medium">CSV</span>
                    <span>•</span>
                    <span className="px-2 py-1 rounded bg-muted font-medium">TXT</span>
                    <span>•</span>
                    <span className="px-2 py-1 rounded bg-muted font-medium">XLSX</span>
                    <span>•</span>
                    <span className="px-2 py-1 rounded bg-muted font-medium">XLS</span>
                  </div>
                </div>
              </div>
            )}

            {/* Preview Table */}
            {parsedData.length > 0 && (
              <div className="space-y-4">
                {/* Stats */}
                <div className="flex items-center gap-4 text-sm">
                  <span className="flex items-center gap-2 text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
                    <Check className="h-4 w-4" /> {validCount} válidos
                  </span>
                  {invalidCount > 0 && (
                    <span className="flex items-center gap-2 text-red-700 bg-red-50 px-3 py-1.5 rounded-full border border-red-200">
                      <AlertCircle className="h-4 w-4" /> {invalidCount} não encontrados
                    </span>
                  )}
                  <span className="flex items-center gap-2 text-muted-foreground bg-muted px-3 py-1.5 rounded-full">
                    <FileSpreadsheet className="h-4 w-4" /> {parsedData.length} total
                  </span>
                </div>

                {/* Table */}
                <div className="border rounded-lg overflow-hidden">
                  <div className="max-h-80 overflow-auto">
                    <Table>
                      <TableHeader className="bg-muted sticky top-0 z-10">
                        <TableRow>
                          <TableHead className="w-12">OK</TableHead>
                          <TableHead>Motorista</TableHead>
                          <TableHead className="text-right">Entregas</TableHead>
                          <TableHead className="text-right">Valor</TableHead>
                          <TableHead className="text-right">Descontos</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {parsedData.slice(0, 50).map((row, i) => (
                          <TableRow 
                            key={i} 
                            className={cn(
                              !row.valid && "bg-red-50/50"
                            )}
                          >
                            <TableCell>
                              {row.valid ? (
                                <Check className="h-4 w-4 text-emerald-600" />
                              ) : (
                                <AlertCircle className="h-4 w-4 text-red-600" />
                              )}
                            </TableCell>
                            <TableCell className="font-medium">
                              {row.driverName}
                              {row.error && <div className="text-xs text-red-600 mt-1">{row.error}</div>}
                            </TableCell>
                            <TableCell className="text-right">{row.completedDeliveries}/{row.totalDeliveries}</TableCell>
                            <TableCell className="text-right font-medium">
                              {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(row.grossValue)}
                            </TableCell>
                            <TableCell className="text-right text-red-600">
                              {row.discounts > 0 && new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(row.discounts)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  {parsedData.length > 50 && (
                    <p className="text-center text-sm text-muted-foreground py-2 bg-muted/50 border-t">
                      ... e mais {parsedData.length - 50} registros
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-2">
                  <Button variant="outline" className="cursor-pointer" onClick={() => setParsedData([])}>
                    Cancelar
                  </Button>
                  <Button onClick={handleImport}  disabled={validCount === 0 || importing} className="cursor-pointer">
                    {imported ? '✅ Concluído' : `Importar ${validCount} registros`}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Loading Overlay - Tela Cheia */}
      {isLoading && (
        <div className="fixed inset-0 z-100 flex items-center justify-center  backdrop-blur-sm">
          <div className="w-full max-w-lg mx-4">
            <div className="bg-card border rounded-2xl shadow-2xl p-8">
              {/* Icon */}
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                    {currentStep === 'done' ? (
                      <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                    ) : (
                      <Loader2 className="w-10 h-10 text-primary animate-spin" />
                    )}
                  </div>
                  {currentStep !== 'done' && (
                    <div className="absolute inset-0 rounded-full border-2 border-primary/30 animate-ping" />
                  )}
                </div>
              </div>

              {/* Steps */}
              <div className="flex justify-between items-center px-2 mb-8">
                {STEPS.map((step, idx) => {
                  const Icon = step.icon
                  const isActive = idx === currentStepIndex
                  const isCompleted = idx < currentStepIndex
                  const isPending = idx > currentStepIndex

                  return (
                    <div key={step.id} className="flex flex-col items-center gap-2">
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300",
                        isActive && "bg-primary text-primary-foreground ring-4 ring-primary/20",
                        isCompleted && "bg-emerald-500 text-white",
                        isPending && "bg-muted text-muted-foreground"
                      )}>
                        {isCompleted ? (
                          <Check className="w-5 h-5" />
                        ) : (
                          <Icon className={cn("w-5 h-5", isActive && "animate-pulse")} />
                        )}
                      </div>
                      <span className={cn(
                        "text-xs font-medium transition-colors",
                        isActive && "text-primary",
                        isCompleted && "text-emerald-600",
                        isPending && "text-muted-foreground"
                      )}>
                        {step.label}
                      </span>
                    </div>
                  )
                })}
              </div>

              {/* Progress */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {currentStep === 'upload' && 'Enviando arquivo...'}
                    {currentStep === 'read' && 'Lendo dados...'}
                    {currentStep === 'process' && 'Processando registros...'}
                    {currentStep === 'save' && 'Salvando no banco...'}
                    {currentStep === 'done' && 'Pronto!'}
                  </span>
                  <span className="font-bold">{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>

              {/* Filename */}
              {message && (
                <p className="text-center text-sm text-muted-foreground mt-4 truncate px-4">
                  {message}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}