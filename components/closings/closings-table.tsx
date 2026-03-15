"use client"

import { useState, useMemo, useEffect } from "react"
import { useData } from "@/lib/data-context"
import { useAuth } from "@/lib/auth-context"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import {
  Search,
  Filter,
  ArrowUpDown,
  CheckCircle,
  Banknote,
  Trash2,
  Eye,
  FileText,
  Check,
  X,
  LayoutGrid,
  List,
  Calendar as CalendarIcon,
  RotateCcw,
  ChevronDown,
  DollarSign,
  User,
  Clock,
  Package
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import type { Closing } from "@/lib/types"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

type SortField = "driverName" | "period" | "deliveries" | "netValue" | "hours" | "status" | "createdAt"
type SortOrder = "asc" | "desc"
type ViewMode = "list" | "cards"

interface Filters {
  search: string
  status: "all" | "pending" | "approved" | "paid"
  dateFrom: Date | undefined
  dateTo: Date | undefined
  driverId: string
}

const statusConfig = {
  pending: {
    label: "Pendente",
    bg: "bg-amber-500/10",
    text: "text-amber-600",
    border: "border-amber-500/20",
    dot: "bg-amber-500",
  },
  approved: {
    label: "Aprovado",
    bg: "bg-blue-500/10",
    text: "text-blue-600",
    border: "border-blue-500/20",
    dot: "bg-blue-500",
  },
  paid: {
    label: "Pago",
    bg: "bg-emerald-500/10",
    text: "text-emerald-600",
    border: "border-emerald-500/20",
    dot: "bg-emerald-500",
  },
}

export function ClosingsTable() {
  const { closings, drivers, updateClosingStatus, deleteClosing } = useData()
  const { user } = useAuth()
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [viewClosing, setViewClosing] = useState<Closing | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>("list")
  const [sortField, setSortField] = useState<SortField>("createdAt")
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc")
  const [selectedClosings, setSelectedClosings] = useState<Set<string>>(new Set())
  const [showFilters, setShowFilters] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 8

  const canManage = user?.role === "admin" || user?.role === "editor"

  // Estado dos filtros
  const [filters, setFilters] = useState<Filters>({
    search: "",
    status: "all",
    dateFrom: undefined,
    dateTo: undefined,
    driverId: "all"
  })

  // Contar filtros ativos
  const activeFiltersCount = useMemo(() => {
    let count = 0
    if (filters.status !== "all") count++
    if (filters.dateFrom) count++
    if (filters.dateTo) count++
    if (filters.driverId !== "all") count++
    return count
  }, [filters])

  // Aplicar filtros e ordenação
  const filteredClosings = useMemo(() => {
    let result = closings.filter((closing) => {
      // Filtro de busca textual
      if (filters.search) {
        const query = filters.search.toLowerCase()
        const matchesSearch = closing.driverName.toLowerCase().includes(query)
        if (!matchesSearch) return false
      }

      // Filtro de status
      if (filters.status !== "all" && closing.status !== filters.status) {
        return false
      }

      // Filtro de motorista
      if (filters.driverId !== "all" && closing.driverId !== filters.driverId) {
        return false
      }

      // Filtro de data (from) - baseado na data de criação
      if (filters.dateFrom) {
        const closingDate = new Date(closing.createdAt)
        if (closingDate < filters.dateFrom) return false
      }

      // Filtro de data (to)
      if (filters.dateTo) {
        const closingDate = new Date(closing.createdAt)
        const endOfDay = new Date(filters.dateTo)
        endOfDay.setHours(23, 59, 59, 999)
        if (closingDate > endOfDay) return false
      }

      return true
    })

    // Ordenação
    result.sort((a, b) => {
      let comparison = 0
      switch (sortField) {
        case "driverName":
          comparison = a.driverName.localeCompare(b.driverName)
          break
        case "period":
          comparison = new Date(a.period.start).getTime() - new Date(b.period.start).getTime()
          break
        case "deliveries":
          comparison = a.deliveries.completed - b.deliveries.completed
          break
        case "netValue":
          comparison = a.financial.netValue - b.financial.netValue
          break
        case "hours":
          comparison = a.hours.total - b.hours.total
          break
        case "status":
          comparison = a.status.localeCompare(b.status)
          break
        case "createdAt":
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          break
      }
      return sortOrder === "asc" ? comparison : -comparison
    })

    return result
  }, [closings, filters, sortField, sortOrder])

  const totalPages = Math.max(1, Math.ceil(filteredClosings.length / itemsPerPage))

  const pagedClosings = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredClosings.slice(start, start + itemsPerPage)
  }, [filteredClosings, currentPage])

  // Reset pagination when filtered list changes
  useEffect(() => {
    setCurrentPage(1)
  }, [filteredClosings.length])

  // Gerar array de páginas visíveis (com ellipsis)
  const visiblePages = useMemo(() => {
    const pages: (number | string)[] = []

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      pages.push(1)

      if (currentPage > 3) {
        pages.push('ellipsis-start')
      }

      const startPage = Math.max(2, currentPage - 1)
      const endPage = Math.min(totalPages - 1, currentPage + 1)

      for (let i = startPage; i <= endPage; i++) {
        pages.push(i)
      }

      if (currentPage < totalPages - 2) {
        pages.push('ellipsis-end')
      }

      pages.push(totalPages)
    }

    return pages
  }, [currentPage, totalPages])

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortOrder("asc")
    }
  }

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedClosings)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedClosings(newSelected)
  }

  const selectAll = () => {
    if (selectedClosings.size === filteredClosings.length) {
      setSelectedClosings(new Set())
    } else {
      setSelectedClosings(new Set(filteredClosings.map(c => c.id)))
    }
  }

  const clearFilters = () => {
    setFilters({
      search: "",
      status: "all",
      dateFrom: undefined,
      dateTo: undefined,
      driverId: "all"
    })
  }

  const handleApprove = (id: string) => {
    updateClosingStatus(id, "approved", user?.name)
    toast.success("Fechamento aprovado", {
      description: "O fechamento foi aprovado com sucesso.",
    })
  }

  const handleMarkPaid = (id: string) => {
    updateClosingStatus(id, "paid", user?.name)
    toast.success("Fechamento pago", {
      description: "O fechamento foi marcado como pago.",
    })
  }

  const handleDelete = () => {
    if (deleteId) {
      deleteClosing(deleteId)
      setDeleteId(null)
      toast.success("Fechamento excluído", {
        description: "O fechamento foi removido com sucesso.",
        style: {
          border: '1px solid #b91c1c',
          background: '#ef4444',
          color: '#ffffff',
        }
      })
    }
  }

  // Componente de paginação reutilizável
  const PaginationComponent = () => {
    if (filteredClosings.length <= itemsPerPage) return null

    return (
      <div className="flex justify-end">
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  setCurrentPage(prev => Math.max(1, prev - 1))
                }}
                className={cn(
                  currentPage === 1 && "pointer-events-none opacity-50"
                )}
                aria-disabled={currentPage === 1}
              />
            </PaginationItem>

            {visiblePages.map((page, index) => (
              <PaginationItem key={`${page}-${index}`}>
                {page === 'ellipsis-start' || page === 'ellipsis-end' ? (
                  <PaginationEllipsis />
                ) : (
                  <PaginationLink
                    href="#"
                    isActive={currentPage === page}
                    onClick={(e) => {
                      e.preventDefault()
                      setCurrentPage(Number(page))
                    }}
                  >
                    {page}
                  </PaginationLink>
                )}
              </PaginationItem>
            ))}

            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  setCurrentPage(prev => Math.min(totalPages, prev + 1))
                }}
                className={cn(
                  currentPage === totalPages && "pointer-events-none opacity-50"
                )}
                aria-disabled={currentPage === totalPages}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header de Controle */}
      <div className="flex flex-col gap-4 p-4 bg-card rounded-xl border shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Fechamentos</h2>
              <p className="text-sm text-muted-foreground">
                {filteredClosings.length} {filteredClosings.length === 1 ? 'registro' : 'registros'} encontrados
                {selectedClosings.size > 0 && ` • ${selectedClosings.size} selecionado(s)`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center bg-muted rounded-lg p-1 border">
              <button
                onClick={() => setViewMode("list")}
                className={cn(
                  "p-2 rounded-md transition-all",
                  viewMode === "list" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <List className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode("cards")}
                className={cn(
                  "p-2 rounded-md transition-all",
                  viewMode === "cards" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Barra de Busca e Filtros */}
        <div className="flex flex-col gap-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por motorista..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="pl-9"
              />
            </div>

            <Popover open={showFilters} onOpenChange={setShowFilters}>
              <PopoverTrigger asChild>
                <Button
                  variant={activeFiltersCount > 0 ? "default" : "outline"}
                  size="sm"
                  className="gap-2"
                >
                  <Filter className="h-4 w-4" />
                  Filtros
                  {activeFiltersCount > 0 && (
                    <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                      {activeFiltersCount}
                    </Badge>
                  )}
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-4" align="end">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-sm">Filtros Avançados</h4>
                    {activeFiltersCount > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearFilters}
                        className="h-8 text-xs text-muted-foreground hover:text-foreground"
                      >
                        <RotateCcw className="h-3 w-3 mr-1" />
                        Limpar
                      </Button>
                    )}
                  </div>

                  {/* Filtro de Status */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground uppercase">Status</label>
                    <Select
                      value={filters.status}
                      onValueChange={(value: any) => setFilters(prev => ({ ...prev, status: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Todos os status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="pending">Pendente</SelectItem>
                        <SelectItem value="approved">Aprovado</SelectItem>
                        <SelectItem value="paid">Pago</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Filtro de Motorista */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground uppercase">Motorista</label>
                    <Select
                      value={filters.driverId}
                      onValueChange={(value) => setFilters(prev => ({ ...prev, driverId: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Todos os motoristas" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        {drivers.map((driver) => (
                          <SelectItem key={driver.id} value={driver.id}>
                            {driver.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Filtro de Período */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground uppercase">Período de Criação</label>
                    <div className="grid grid-cols-2 gap-2">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className={cn(
                              "justify-start text-left font-normal",
                              !filters.dateFrom && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-3 w-3" />
                            {filters.dateFrom ? format(filters.dateFrom, "dd/MM/yy") : "De"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={filters.dateFrom}
                            onSelect={(date) => setFilters(prev => ({ ...prev, dateFrom: date }))}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>

                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className={cn(
                              "justify-start text-left font-normal",
                              !filters.dateTo && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-3 w-3" />
                            {filters.dateTo ? format(filters.dateTo, "dd/MM/yy") : "Até"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="end">
                          <Calendar
                            mode="single"
                            selected={filters.dateTo}
                            onSelect={(date) => setFilters(prev => ({ ...prev, dateTo: date }))}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  <Button
                    className="w-full"
                    size="sm"
                    onClick={() => setShowFilters(false)}
                  >
                    Aplicar Filtros
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Chips de Filtros Ativos */}
          {activeFiltersCount > 0 && (
            <div className="flex flex-wrap gap-2">
              {filters.status !== "all" && (
                <Badge variant="secondary" className="gap-1 px-2 py-1">
                  Status: {statusConfig[filters.status as keyof typeof statusConfig].label}
                  <button
                    onClick={() => setFilters(prev => ({ ...prev, status: "all" }))}
                    className="ml-1 hover:bg-muted rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}

              {filters.driverId !== "all" && (
                <Badge variant="secondary" className="gap-1 px-2 py-1">
                  Motorista: {drivers.find(d => d.id === filters.driverId)?.name}
                  <button
                    onClick={() => setFilters(prev => ({ ...prev, driverId: "all" }))}
                    className="ml-1 hover:bg-muted rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}

              {(filters.dateFrom || filters.dateTo) && (
                <Badge variant="secondary" className="gap-1 px-2 py-1">
                  Período: {filters.dateFrom ? format(filters.dateFrom, "dd/MM") : "Início"} - {filters.dateTo ? format(filters.dateTo, "dd/MM") : "Hoje"}
                  <button
                    onClick={() => setFilters(prev => ({ ...prev, dateFrom: undefined, dateTo: undefined }))}
                    className="ml-1 hover:bg-muted rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Conteúdo - Modo Lista */}
      {viewMode === "list" && (
        <>
          <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-b bg-muted/50">
                  <TableHead className="w-12 p-4">
                    <button
                      onClick={selectAll}
                      className={cn(
                        "w-5 h-5 rounded border flex items-center justify-center transition-colors",
                        selectedClosings.size === filteredClosings.length && filteredClosings.length > 0
                          ? "bg-primary border-primary text-primary-foreground"
                          : "border-input hover:border-primary"
                      )}
                    >
                      {selectedClosings.size === filteredClosings.length && filteredClosings.length > 0 && (
                        <Check className="h-3 w-3" />
                      )}
                    </button>
                  </TableHead>
                  <TableHead className="text-left p-4">
                    <button
                      onClick={() => toggleSort("driverName")}
                      className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground uppercase tracking-wider"
                    >
                      Motorista
                      <ArrowUpDown className={cn(
                        "h-3 w-3 transition-colors",
                        sortField === "driverName" ? "text-primary" : "text-muted-foreground"
                      )} />
                    </button>
                  </TableHead>
                  <TableHead className="text-left p-4">
                    <button
                      onClick={() => toggleSort("period")}
                      className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground uppercase tracking-wider"
                    >
                      Período
                      <ArrowUpDown className={cn(
                        "h-3 w-3 transition-colors",
                        sortField === "period" ? "text-primary" : "text-muted-foreground"
                      )} />
                    </button>
                  </TableHead>
                  <TableHead className="text-left p-4">
                    <button
                      onClick={() => toggleSort("deliveries")}
                      className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground uppercase tracking-wider"
                    >
                      Entregas
                      <ArrowUpDown className={cn(
                        "h-3 w-3 transition-colors",
                        sortField === "deliveries" ? "text-primary" : "text-muted-foreground"
                      )} />
                    </button>
                  </TableHead>
                  <TableHead className="text-left p-4">
                    <button
                      onClick={() => toggleSort("netValue")}
                      className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground uppercase tracking-wider"
                    >
                      Valor Líquido
                      <ArrowUpDown className={cn(
                        "h-3 w-3 transition-colors",
                        sortField === "netValue" ? "text-primary" : "text-muted-foreground"
                      )} />
                    </button>
                  </TableHead>
                  <TableHead className="text-left p-4">
                    <button
                      onClick={() => toggleSort("hours")}
                      className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground uppercase tracking-wider"
                    >
                      Horas
                      <ArrowUpDown className={cn(
                        "h-3 w-3 transition-colors",
                        sortField === "hours" ? "text-primary" : "text-muted-foreground"
                      )} />
                    </button>
                  </TableHead>
                  <TableHead className="text-left p-4">
                    <button
                      onClick={() => toggleSort("status")}
                      className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground uppercase tracking-wider"
                    >
                      Status
                      <ArrowUpDown className={cn(
                        "h-3 w-3 transition-colors",
                        sortField === "status" ? "text-primary" : "text-muted-foreground"
                      )} />
                    </button>
                  </TableHead>
                  {canManage && <TableHead className="w-16 p-4"></TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y">
                {filteredClosings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={canManage ? 8 : 7} className="p-12 text-center">
                      <div className="flex flex-col items-center gap-3 text-muted-foreground">
                        <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                          <FileText className="h-8 w-8 opacity-50" />
                        </div>
                        <div>
                          <p className="font-medium">Nenhum fechamento encontrado</p>
                          <p className="text-sm">Tente ajustar seus filtros ou busca</p>
                        </div>
                        {activeFiltersCount > 0 && (
                          <Button variant="outline" size="sm" onClick={clearFilters} className="mt-2">
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Limpar filtros
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  pagedClosings.map((closing) => {
                    const isSelected = selectedClosings.has(closing.id)
                    const status = statusConfig[closing.status]

                    return (
                      <TableRow
                        key={closing.id}
                        className={cn(
                          "group transition-colors",
                          isSelected ? "bg-primary/5" : "hover:bg-muted/50"
                        )}
                      >
                        <TableCell className="p-4">
                          <button
                            onClick={() => toggleSelection(closing.id)}
                            className={cn(
                              "w-5 h-5 rounded border flex items-center justify-center transition-all",
                              isSelected
                                ? "bg-primary border-primary text-primary-foreground"
                                : "border-input group-hover:border-primary"
                            )}
                          >
                            {isSelected && <Check className="h-3 w-3" />}
                          </button>
                        </TableCell>

                        <TableCell className="p-4">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold transition-colors",
                              closing.status === "paid"
                                ? "bg-emerald-100 text-emerald-700"
                                : closing.status === "approved"
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-amber-100 text-amber-700"
                            )}>
                              {closing.driverName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium text-foreground">{closing.driverName}</p>

                            </div>
                          </div>
                        </TableCell>

                        <TableCell className="p-4">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <CalendarIcon className="h-3.5 w-3.5" />
                            <span>
                              {format(new Date(closing.period.start), "dd/MM/yyyy")} - {format(new Date(closing.period.end), "dd/MM/yyyy")}
                            </span>
                          </div>
                        </TableCell>

                        <TableCell className="p-4">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
                              <Package className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div>
                              <p className="text-sm font-medium">{closing.deliveries.completed}/{closing.deliveries.total}</p>
                              <p className="text-xs text-muted-foreground">entregas</p>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell className="p-4">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
                              <DollarSign className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div>
                              <p className="text-sm font-medium">
                                {new Intl.NumberFormat("pt-BR", {
                                  style: "currency",
                                  currency: "BRL",
                                }).format(closing.financial.netValue)}
                              </p>
                              <p className="text-xs text-muted-foreground">líquido</p>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell className="p-4">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="h-3.5 w-3.5" />
                            <span>{closing.hours.total}h</span>
                          </div>
                        </TableCell>

                        <TableCell className="p-4">
                          <Badge
                            variant="outline"
                            className={cn(
                              "border-0 px-2.5 py-1 font-medium",
                              status.bg,
                              status.text,
                              status.border
                            )}
                          >
                            <span className={cn("w-1.5 h-1.5 rounded-full mr-1.5", status.dot)} />
                            {status.label}
                          </Badge>
                        </TableCell>

                        <TableCell className="p-4">
                          <div className={cn(
                            "flex items-center justify-end gap-1 transition-opacity duration-200",
                            "opacity-0 group-hover:opacity-100"
                          )}>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => setViewClosing(closing)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {canManage && (
                              <>
                                {closing.status === "pending" && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-blue-600 hover:text-blue-600"
                                    onClick={() => handleApprove(closing.id)}
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                  </Button>
                                )}
                                {closing.status === "approved" && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-emerald-600 hover:text-emerald-600"
                                    onClick={() => handleMarkPaid(closing.id)}
                                  >
                                    <Banknote className="h-4 w-4" />
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive hover:text-destructive"
                                  onClick={() => setDeleteId(closing.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>

          <PaginationComponent />
        </>
      )
      }

      {/* Conteúdo - Modo Cards */}
      {
        viewMode === "cards" && (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <AnimatePresence>
                {pagedClosings.map((closing, index) => {
                  const isSelected = selectedClosings.has(closing.id)
                  const status = statusConfig[closing.status]

                  return (
                    <motion.div
                      key={closing.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2, delay: index * 0.05 }}
                      onClick={() => toggleSelection(closing.id)}
                      className={cn(
                        "group relative p-5 rounded-xl border-2 transition-all cursor-pointer",
                        isSelected
                          ? "border-primary bg-primary/5 shadow-md"
                          : "border-border bg-card hover:border-muted-foreground/30 hover:shadow-sm"
                      )}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "h-12 w-12 rounded-full flex items-center justify-center text-sm font-bold",
                            closing.status === "paid"
                              ? "bg-emerald-100 text-emerald-700"
                              : closing.status === "approved"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-amber-100 text-amber-700"
                          )}>
                            {closing.driverName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <h3 className="font-semibold text-foreground">{closing.driverName}</h3>
                            <Badge
                              variant="outline"
                              className={cn(
                                "mt-1 border-0 px-2 py-0.5 text-xs",
                                status.bg,
                                status.text
                              )}
                            >
                              <span className={cn("w-1 h-1 rounded-full mr-1", status.dot)} />
                              {status.label}
                            </Badge>
                          </div>
                        </div>
                        {isSelected && (
                          <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                            <Check className="h-4 w-4 text-primary-foreground" />
                          </div>
                        )}
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <CalendarIcon className="h-4 w-4" />
                          <span>
                            {format(new Date(closing.period.start), "dd/MM/yyyy")} - {format(new Date(closing.period.end), "dd/MM/yyyy")}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Package className="h-4 w-4" />
                          <span>{closing.deliveries.completed}/{closing.deliveries.total} entregas</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <DollarSign className="h-4 w-4" />
                          <span className="font-medium text-foreground">
                            {new Intl.NumberFormat("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            }).format(closing.financial.netValue)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>{closing.hours.total}h trabalhadas</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground text-xs pt-2 border-t">
                          <FileText className="h-3 w-3" />
                          Criado em {format(new Date(closing.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                        </div>
                      </div>

                      <div className={cn(
                        "absolute top-4 right-4 transition-opacity duration-200 flex gap-1",
                        "opacity-0 group-hover:opacity-100"
                      )}>
                        <Button
                          variant="secondary"
                          size="icon"
                          className="h-8 w-8 shadow-sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            setViewClosing(closing)
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {canManage && (
                          <>
                            {closing.status === "pending" && (
                              <Button
                                variant="secondary"
                                size="icon"
                                className="h-8 w-8 shadow-sm bg-blue-100 hover:bg-blue-200 text-blue-700"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleApprove(closing.id)
                                }}
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                            )}
                            {closing.status === "approved" && (
                              <Button
                                variant="secondary"
                                size="icon"
                                className="h-8 w-8 shadow-sm bg-emerald-100 hover:bg-emerald-200 text-emerald-700"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleMarkPaid(closing.id)
                                }}
                              >
                                <Banknote className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="destructive"
                              size="icon"
                              className="h-8 w-8 shadow-sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                setDeleteId(closing.id)
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>

            {/* Empty State para Cards */}
            {filteredClosings.length === 0 && (
              <div className="flex flex-col items-center gap-3 text-muted-foreground p-12">
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                  <FileText className="h-8 w-8 opacity-50" />
                </div>
                <div className="text-center">
                  <p className="font-medium">Nenhum fechamento encontrado</p>
                  <p className="text-sm">Tente ajustar seus filtros ou busca</p>
                </div>
                {activeFiltersCount > 0 && (
                  <Button variant="outline" size="sm" onClick={clearFilters} className="mt-2">
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Limpar filtros
                  </Button>
                )}
              </div>
            )}

            <PaginationComponent />
          </>
        )
      }

      {/* Dialog de Visualizar Detalhes */}
      <Dialog open={!!viewClosing} onOpenChange={() => setViewClosing(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className={cn(
                "h-12 w-12 rounded-full flex items-center justify-center text-sm font-bold",
                viewClosing?.status === "paid"
                  ? "bg-emerald-100 text-emerald-700"
                  : viewClosing?.status === "approved"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-amber-100 text-amber-700"
              )}>
                {viewClosing?.driverName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              {viewClosing?.driverName}
            </DialogTitle>
            <DialogDescription>
              Detalhes completos do fechamento
            </DialogDescription>
          </DialogHeader>

          {viewClosing && (
            <div className="space-y-6">
              {/* Status */}
              <div className="flex items-center gap-3">
                <span className="font-medium text-foreground">Status:</span>
                <Badge
                  className={cn(
                    "px-3 py-1",
                    statusConfig[viewClosing.status].bg,
                    statusConfig[viewClosing.status].text,
                    statusConfig[viewClosing.status].border
                  )}
                >
                  {statusConfig[viewClosing.status].label}
                </Badge>
              </div>

              {/* Período */}
              <div className="grid grid-cols-2 gap-4 border-t pt-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                    <CalendarIcon className="h-4 w-4" />
                    Início do Período
                  </p>
                  <p className="font-mono text-foreground">
                    {format(new Date(viewClosing.period.start), "dd/MM/yyyy")}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                    <CalendarIcon className="h-4 w-4" />
                    Fim do Período
                  </p>
                  <p className="font-mono text-foreground">
                    {format(new Date(viewClosing.period.end), "dd/MM/yyyy")}
                  </p>
                </div>
              </div>

              {/* Entregas */}
              <div className="border-t pt-4">
                <p className="text-sm text-muted-foreground mb-2 flex items-center gap-1">
                  <Package className="h-4 w-4" />
                  Entregas
                </p>
                <div className="bg-muted/50 p-3 rounded-md flex justify-between items-center">
                  <span className="text-foreground font-medium">Completadas</span>
                  <span className="text-2xl font-bold text-primary">
                    {viewClosing.deliveries.completed}/{viewClosing.deliveries.total}
                  </span>
                </div>
              </div>

              {/* Valores */}
              <div className="grid grid-cols-2 gap-4 border-t pt-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                    <DollarSign className="h-4 w-4" />
                    Valor Bruto
                  </p>
                  <p className="text-foreground">
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(viewClosing.financial.grossValue)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                    <DollarSign className="h-4 w-4" />
                    Valor Líquido
                  </p>
                  <p className="text-foreground font-bold">
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(viewClosing.financial.netValue)}
                  </p>
                </div>
              </div>

              {/* Horas */}
              <div className="border-t pt-4">
                <p className="text-sm text-muted-foreground mb-2 flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  Horas Trabalhadas
                </p>
                <div className="bg-muted/50 p-3 rounded-md">
                  <p className="text-2xl font-bold text-foreground">{viewClosing.hours.total}h</p>
                </div>
              </div>

              {/* Datas */}
              <div className="grid grid-cols-2 gap-4 border-t pt-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                    <FileText className="h-4 w-4" />
                    Criado em
                  </p>
                  <p className="text-foreground">
                    {format(new Date(viewClosing.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                  </p>
                </div>

              </div>

              {/* Ações */}
              <div className="flex gap-2 border-t pt-4">
                {canManage && viewClosing.status === "pending" && (
                  <Button
                    variant="default"
                    onClick={() => {
                      handleApprove(viewClosing.id)
                      setViewClosing(null)
                    }}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Aprovar
                  </Button>
                )}
                {canManage && viewClosing.status === "approved" && (
                  <Button
                    variant="default"
                    className="bg-emerald-600 hover:bg-emerald-700"
                    onClick={() => {
                      handleMarkPaid(viewClosing.id)
                      setViewClosing(null)
                    }}
                  >
                    <Banknote className="h-4 w-4 mr-2" />
                    Marcar como Pago
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => setViewClosing(null)}
                >
                  Fechar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este fechamento? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div >
  )
}