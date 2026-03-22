"use client"

import { useState, useRef } from "react"
import { toast } from "sonner"
import { useData } from "@/lib/data-context"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import type { Driver } from "@/lib/types"
import { cn } from "@/lib/utils"

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

type Step = 'upload' | 'read' | 'process' | 'save' | 'done'

const STEPS: { id: Step; label: string; icon: typeof Loader2 }[] = [
  { id: 'upload', label: 'Enviando', icon: FileUp },
  { id: 'read', label: 'Lendo arquivo', icon: FileText },
  { id: 'process', label: 'Processando', icon: Cog },
  { id: 'save', label: 'Salvando', icon: Database },
  { id: 'done', label: 'Concluído', icon: CheckCircle2 },
]

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export function ImportDriverDialog({ trigger }: ImportDriverDialogProps) {
  const { drivers, addDriver } = useData()
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

  const normalizeCpf = (cpf: string) => cpf.replace(/\D/g, "").trim()
  const normalizeName = (name: string) => name.trim()
  const normalizeText = (text: string): string => {
    return text.toString().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ").trim()
  }

  const resetState = () => {
    setParsedData([])
    setImporting(false)
    setImported(false)
    setCurrentStep('upload')
    setProgress(0)
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

  const parseExcelFile = async (file: File): Promise<string[][]> => {
    const arrayBuffer = await file.arrayBuffer()
    const workbook = XLSX.read(arrayBuffer, { type: "array", cellDates: true })
    const worksheet = workbook.Sheets[workbook.SheetNames[0]]
    const json = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1, blankrows: false, defval: "" }) as any[][]
    
    return json.map(row => row.map(cell => String(cell || "").trim()))
  }

  const parseCSVFile = async (file: File): Promise<string[][]> => {
    const text = await file.text()
    const delimiter = text.includes(";") ? ";" : ","
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean)
    
    return lines.map(line => line.split(delimiter).map(c => c.trim()))
  }

  const detectColumns = (headers: string[]): Record<string, number> => {
    const normalizedHeaders = headers.map((h, idx) => ({ 
      original: h, 
      normalized: normalizeText(h), 
      index: idx 
    }))
    
    const findColumn = (...possibleNames: string[]): number => {
      for (const name of possibleNames) {
        const normalizedName = normalizeText(name)
        const match = normalizedHeaders.find(h => 
          h.normalized.includes(normalizedName) || normalizedName.includes(h.normalized)
        )
        if (match) return match.index
      }
      return -1
    }

    return {
      name: findColumn("nome", "name", "motorista", "driver", "colaborador", "funcionario"),
      cpf: findColumn("cpf", "documento", "cnpj", "doc"),
      vehicle: findColumn("veiculo", "vehicle", "carro", "moto", "transporte"),
      licensePlate: findColumn("placa", "licenseplate", "license plate"),
      status: findColumn("status", "situacao", "situação", "ativo", "estado"),
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsLoading(true)
    setImported(false)
    setMessage(file.name)

    const fileExt = file.name.split(".").pop()?.toLowerCase()

    try {
      // Step 1: Upload (800ms)
      await runStep('upload', 800)

      // Step 2: Read (1.5s)
      let rows: string[][] = []
      
      await runStep('read', 1500, async () => {
        if (fileExt === "csv" || fileExt === "txt") {
          rows = await parseCSVFile(file)
        } else if (fileExt === "xlsx" || fileExt === "xls") {
          rows = await parseExcelFile(file)
        } else {
          throw new Error("Formato não suportado. Use CSV, TXT ou Excel (XLSX/XLS)")
        }

        if (rows.length < 2) {
          throw new Error("Arquivo vazio ou sem dados suficientes")
        }
      })

      // Step 3: Process (2s)
      await runStep('process', 2000, async () => {
        // Detecta header
        let headerIndex = 0
        for (let i = 0; i < Math.min(10, rows.length); i++) {
          const rowText = rows[i]?.join(" ").toLowerCase() || ""
          if (rowText.includes("nome") || rowText.includes("name") || rowText.includes("motorista")) {
            headerIndex = i
            break
          }
        }

        const headers = rows[headerIndex]
        const dataRows = rows.slice(headerIndex + 1)
        
        // Detecta se é arquivo de apenas nomes (single column)
        const nonEmptyCols = headers.map((_, idx) => 
          dataRows.some(row => row[idx]?.trim())
        ).filter(Boolean).length
        
        const isSingleColumn = nonEmptyCols <= 1

        let parsed: ParsedRow[] = []

        if (isSingleColumn) {
          // Modo "apenas nomes"
          const uniqueNames = new Set<string>()
          
          for (const row of dataRows) {
            const name = row[0]?.trim()
            if (name && name.length >= 3 && 
                !normalizeText(name).includes("total") && 
                !normalizeText(name).includes("geral")) {
              uniqueNames.add(name)
            }
          }

          parsed = Array.from(uniqueNames).map(name => ({
            name,
            cpf: "",
            vehicle: "Não informado",
            licensePlate: "—",
            status: "active",
            valid: true,
            error: undefined,
          }))

          toast.success(`Detectado arquivo de apenas nomes → ${parsed.length} nomes únicos encontrados`)
        } else {
          // Modo completo - detecta colunas automaticamente
          const cols = detectColumns(headers)
          const existingCpf = new Set(drivers.map(d => normalizeCpf(d.cpf)))
          const seenCpfs = new Set<string>()

          parsed = dataRows.map(row => {
            const name = cols.name !== -1 ? row[cols.name] : ""
            const cpf = cols.cpf !== -1 ? row[cols.cpf] : ""
            const normalizedCpf = normalizeCpf(cpf)
            const vehicle = cols.vehicle !== -1 ? row[cols.vehicle] : ""
            const licensePlate = cols.licensePlate !== -1 ? row[cols.licensePlate] : ""
            const statusValue = cols.status !== -1 ? row[cols.status] : "active"
            const status = normalizeText(statusValue).includes("inativ") ? "inactive" : "active"

            let valid = true
            let error: string | undefined

            if (!name.trim()) {
              valid = false
              error = "Nome é obrigatório"
            } else if (normalizedCpf && normalizedCpf.length !== 11) {
              valid = false
              error = "CPF inválido"
            } else if (normalizedCpf && existingCpf.has(normalizedCpf)) {
              valid = false
              error = "CPF já cadastrado"
            } else if (normalizedCpf && seenCpfs.has(normalizedCpf)) {
              valid = false
              error = "CPF duplicado no arquivo"
            }

            if (normalizedCpf) seenCpfs.add(normalizedCpf)

            return { name, cpf, vehicle, licensePlate, status, valid, error }
          })

          toast.info("Detectado CSV/Excel completo → processando com CPF, veículo, etc.")
        }

        setParsedData(parsed)
      })

      setIsLoading(false)

      if (parsedData.length === 0 && parsedData.length === 0) {
        toast.error("Nenhum dado válido encontrado")
      }

    } catch (err: any) {
      setIsLoading(false)
      toast.error(`Erro: ${err.message}`)
    }
  }

  const handleImport = async () => {
    const validRows = parsedData.filter(r => r.valid)
    if (validRows.length === 0) return

    setImporting(true)
    setIsLoading(true)

    // Step 4: Save (2s)
    await runStep('save', 2000, async () => {
      let importedCount = 0

      for (const row of validRows) {
        // Evita duplicata por nome exato (case insensitive)
        const nameExists = drivers.some(d =>
          normalizeName(d.name) === normalizeName(row.name)
        )

        if (nameExists) {
          console.warn(`Já existe motorista com nome: ${row.name}`)
          continue
        }

        addDriver({
          name: row.name,
          cpf: row.cpf || "",
          phone: "",
          vehicle: row.vehicle || "Não informado",
          licensePlate: row.licensePlate || "—",
          status: row.status,
          cnh: "",
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
          cnhCategory: "",
          cnhExpiration: "",
          professionalRegister: "",
        })
        importedCount++
        
        // Pequeno delay a cada 3 registros para animação
        if (importedCount % 3 === 0) await delay(50)
      }

      toast.success(`Importados ${importedCount} motorista(s) com sucesso`)
    })

    // Step 5: Done (800ms)
    await runStep('done', 800)
    
    setImporting(false)
    setImported(true)
    setIsLoading(false)

    setTimeout(() => {
      resetState()
      setOpen(false)
    }, 1600)
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
    if (file) {
      const fakeEvent = { target: { files: [file] } } as unknown as React.ChangeEvent<HTMLInputElement>
      handleFileChange(fakeEvent)
    }
  }

  const currentStepIndex = STEPS.findIndex(s => s.id === currentStep)
  const validCount = parsedData.filter(r => r.valid).length
  const invalidCount = parsedData.length - validCount

  return (
    <>
      <Dialog open={open} onOpenChange={o => { if (!o) resetState(); setOpen(o) }}>
        <DialogTrigger asChild>
          {trigger ?? (
            <Button variant="outline" className="w-full sm:w-auto h-10 sm:h-11 cursor-pointer">
              <Upload className="h-4 w-4 mr-2" />
              Importar Planilha
            </Button>
          )}
        </DialogTrigger>

        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-hidden p-0 gap-0">
          {/* Header - PADRONIZADO */}
          <DialogHeader className="px-6 py-4 border-b bg-muted/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileSpreadsheet className="h-5 w-5 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold">Importar Motoristas</DialogTitle>
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
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.txt,.xlsx,.xls"
                  onChange={handleFileChange}
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

            {parsedData.length > 0 && (
              <>
                {/* Stats - PADRONIZADO */}
                <div className="flex items-center gap-4 text-sm">
                  <span className="flex items-center gap-2 text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
                    <Check className="h-4 w-4" /> {validCount} válidos
                  </span>
                  {invalidCount > 0 && (
                    <span className="flex items-center gap-2 text-red-700 bg-red-50 px-3 py-1.5 rounded-full border border-red-200">
                      <AlertCircle className="h-4 w-4" /> {invalidCount} com problema
                    </span>
                  )}
                  <span className="flex items-center gap-2 text-muted-foreground bg-muted px-3 py-1.5 rounded-full">
                    <FileSpreadsheet className="h-4 w-4" /> {parsedData.length} total
                  </span>
                </div>

                {/* Table - PADRONIZADO */}
                <div className="border rounded-lg overflow-hidden">
                  <div className="max-h-80 overflow-auto">
                    <Table>
                      <TableHeader className="bg-muted sticky top-0 z-10">
                        <TableRow>
                          <TableHead className="w-10">OK</TableHead>
                          <TableHead>Nome</TableHead>
                          <TableHead>CPF</TableHead>
                          <TableHead>Veículo / Placa</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {parsedData.map((row, i) => (
                          <TableRow key={i} className={!row.valid ? "bg-red-50/60" : ""}>
                            <TableCell>
                              {row.valid ? (
                                <Check className="h-4 w-4 text-emerald-600" />
                              ) : (
                                <AlertCircle className="h-4 w-4 text-red-600" />
                              )}
                            </TableCell>
                            <TableCell className="font-medium">{row.name || "—"}</TableCell>
                            <TableCell className="font-mono text-sm">{row.cpf || "—"}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {row.vehicle} {row.licensePlate && `• ${row.licensePlate}`}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* Actions - PADRONIZADO */}
                <div className="flex justify-end gap-3 pt-2">
                  <Button variant="outline" className="cursor-pointer" onClick={() => setParsedData([])}>
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleImport}
                    disabled={validCount === 0 || importing || imported}
                    className="cursor-pointer"
                  >
                    {imported ? (
                      <>✅ Concluído</>
                    ) : (
                      <>Importar {validCount} motorista(s)</>
                    )}
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Loading Overlay - Tela Cheia - PADRONIZADO */}
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