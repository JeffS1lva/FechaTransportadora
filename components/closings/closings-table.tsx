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
  Package,
  Calculator,
  TrendingUp,
  Wallet
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
  // Desktop > 1300px é lista por padrão, abaixo disso sempre cards
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

    if (totalPages <= 5) {
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

  // Componente de paginação reutilizável - responsivo
  const PaginationComponent = () => {
    if (filteredClosings.length <= itemsPerPage) return null

    return (
      <div className="flex justify-center min-[1300px]:justify-end mt-4">
        <Pagination className="flex-wrap gap-2">
          <PaginationContent className="flex-wrap justify-center">
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  setCurrentPage(prev => Math.max(1, prev - 1))
                }}
                className={cn(
                  "h-9 w-9 min-[1300px]:h-auto min-[1300px]:w-auto p-0 min-[1300px]:px-4",
                  currentPage === 1 && "pointer-events-none opacity-50"
                )}
                aria-disabled={currentPage === 1}
              />
            </PaginationItem>

            <div className="flex flex-wrap justify-center gap-1">
              {visiblePages.map((page, index) => (
                <PaginationItem key={`${page}-${index}`}>
                  {page === 'ellipsis-start' || page === 'ellipsis-end' ? (
                    <PaginationEllipsis className="h-9 w-9" />
                  ) : (
                    <PaginationLink
                      href="#"
                      isActive={currentPage === page}
                      onClick={(e) => {
                        e.preventDefault()
                        setCurrentPage(Number(page))
                      }}
                      className="h-9 w-9 min-[1300px]:h-auto min-[1300px]:w-auto min-[1300px]:px-3 text-sm"
                    >
                      {page}
                    </PaginationLink>
                  )}
                </PaginationItem>
              ))}
            </div>

            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  setCurrentPage(prev => Math.min(totalPages, prev + 1))
                }}
                className={cn(
                  "h-9 w-9 min-[1300px]:h-auto min-[1300px]:w-auto p-0 min-[1300px]:px-4",
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
    <div className="space-y-4  min-[1300px]:px-0">
      {/* Header de Controle - Responsivo */}
      <div className="flex flex-col gap-4 p-3 sm:p-4 bg-card rounded-xl border shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-semibold truncate">Fechamentos</h2>
              <p className="text-sm text-muted-foreground truncate">
                {filteredClosings.length} {filteredClosings.length === 1 ? 'registro' : 'registros'}
                {selectedClosings.size > 0 && ` • ${selectedClosings.size} selec.`}
              </p>
            </div>
          </div>

          {/* Toggle de visualização - apenas desktop > 1300px */}
          <div className="hidden min-[1300px]:flex items-center gap-2">
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

        {/* Barra de Busca e Filtros - Responsiva */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por motorista..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="pl-9 w-full"
              />
            </div>

            <Popover open={showFilters} onOpenChange={setShowFilters}>
              <PopoverTrigger asChild>
                <Button
                  variant={activeFiltersCount > 0 ? "default" : "outline"}
                  size="sm"
                  className="gap-2 shrink-0"
                >
                  <Filter className="h-4 w-4" />
                  <span className="hidden sm:inline">Filtros</span>
                  {activeFiltersCount > 0 && (
                    <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                      {activeFiltersCount}
                    </Badge>
                  )}
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[calc(100vw-2rem)] sm:w-80 p-4" align="end">
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
                              "justify-start text-left font-normal text-xs sm:text-sm",
                              !filters.dateFrom && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
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
                              "justify-start text-left font-normal text-xs sm:text-sm",
                              !filters.dateTo && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
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

          {/* Chips de Filtros Ativos - Responsivos */}
          {activeFiltersCount > 0 && (
            <div className="flex flex-wrap gap-2">
              {filters.status !== "all" && (
                <Badge variant="secondary" className="gap-1 px-2 py-1 text-xs">
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
                <Badge variant="secondary" className="gap-1 px-2 py-1 text-xs">
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
                <Badge variant="secondary" className="gap-1 px-2 py-1 text-xs">
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

      {/* Conteúdo - Modo Lista (apenas > 1300px) */}
      <div className="hidden min-[1300px]:block">
        {viewMode === "list" ? (
          <>
            <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
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
                    <AnimatePresence>
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
                            <tr
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
                                    "h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold transition-colors shrink-0",
                                    closing.status === "paid"
                                      ? "bg-emerald-100 text-emerald-700"
                                      : closing.status === "approved"
                                        ? "bg-blue-100 text-blue-700"
                                        : "bg-amber-100 text-amber-700"
                                  )}>
                                    {closing.driverName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="font-medium text-foreground truncate">{closing.driverName}</p>
                                  </div>
                                </div>
                              </TableCell>

                              <TableCell className="p-4">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground whitespace-nowrap">
                                  <CalendarIcon className="h-3.5 w-3.5 shrink-0" />
                                  <span>
                                    {format(new Date(closing.period.start), "dd/MM/yy")} - {format(new Date(closing.period.end), "dd/MM/yy")}
                                  </span>
                                </div>
                              </TableCell>

                              <TableCell className="p-4">
                                <div className="flex items-center gap-2">
                                  <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
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
                                  <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium whitespace-nowrap">
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
                                  <Clock className="h-3.5 w-3.5 shrink-0" />
                                  <span>{closing.hours.total}h</span>
                                </div>
                              </TableCell>

                              <TableCell className="p-4">
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    "border-0 px-2.5 py-1 font-medium text-xs",
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
                            </tr>
                          )
                        })
                      )}
                    </AnimatePresence>
                  </TableBody>
                </Table>
              </div>
            </div>

            <PaginationComponent />
          </>
        ) : (
          // Modo Cards Desktop (> 1300px)
          <>
            <div className="grid gap-4 min-[1300px]:grid-cols-2 2xl:grid-cols-2">
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
                            "h-12 w-12 rounded-full flex items-center justify-center text-sm font-bold shrink-0",
                            closing.status === "paid"
                              ? "bg-emerald-100 text-emerald-700"
                              : closing.status === "approved"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-amber-100 text-amber-700"
                          )}>
                            {closing.driverName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-semibold text-foreground truncate">{closing.driverName}</h3>
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
                          <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center shrink-0">
                            <Check className="h-4 w-4 text-primary-foreground" />
                          </div>
                        )}
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <CalendarIcon className="h-4 w-4 shrink-0" />
                          <span className="text-xs">
                            {format(new Date(closing.period.start), "dd/MM/yy")} - {format(new Date(closing.period.end), "dd/MM/yy")}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Package className="h-4 w-4 shrink-0" />
                          <span className="text-xs">{closing.deliveries.completed}/{closing.deliveries.total} entregas</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <DollarSign className="h-4 w-4 shrink-0" />
                          <span className="font-medium text-foreground text-xs">
                            {new Intl.NumberFormat("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            }).format(closing.financial.netValue)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Clock className="h-4 w-4 shrink-0" />
                          <span className="text-xs">{closing.hours.total}h trabalhadas</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground text-xs pt-2 border-t">
                          <FileText className="h-3 w-3 shrink-0" />
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
        )}
      </div>

      {/* Conteúdo - Até 1300px (Cards responsivos) */}
      <div className="min-[1300px]:hidden">
        <div className="grid gap-3 sm:grid-cols-2 lg:2">
          <AnimatePresence>
            {pagedClosings.map((closing, index) => {
              const isSelected = selectedClosings.has(closing.id)
              const status = statusConfig[closing.status]

              return (
                <motion.div
                  key={closing.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                  className={cn(
                    "relative p-4 rounded-xl border-2 transition-all active:scale-[0.98]",
                    isSelected
                      ? "border-primary bg-primary/5 shadow-md"
                      : "border-border bg-card shadow-sm"
                  )}
                >
                  {/* Header do Card */}
                  <div className="flex items-start gap-3 mb-3">
                    <div 
                      onClick={() => toggleSelection(closing.id)}
                      className={cn(
                        "h-10 w-10 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors cursor-pointer",
                        isSelected
                          ? "bg-primary text-primary-foreground"
                          : closing.status === "paid"
                            ? "bg-emerald-100 text-emerald-700"
                            : closing.status === "approved"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-amber-100 text-amber-700"
                      )}
                    >
                      {isSelected ? (
                        <Check className="h-5 w-5" />
                      ) : (
                        closing.driverName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground text-sm leading-tight truncate">
                        {closing.driverName}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge
                          variant="outline"
                          className={cn(
                            "border-0 px-1.5 py-0 text-[10px] font-medium",
                            status.bg,
                            status.text
                          )}
                        >
                          <span className={cn("w-1 h-1 rounded-full mr-1", status.dot)} />
                          {status.label}
                        </Badge>
                      </div>
                    </div>

                    {/* Menu de ações simplificado */}
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 -mr-2"
                        onClick={() => setViewClosing(closing)}
                      >
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </div>
                  </div>

                  {/* Informações principais */}
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between py-1.5 border-b border-border/50">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <CalendarIcon className="h-3.5 w-3.5" />
                        Período
                      </span>
                      <span className="text-foreground">
                        {format(new Date(closing.period.start), "dd/MM")} - {format(new Date(closing.period.end), "dd/MM")}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between py-1.5 border-b border-border/50">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <Package className="h-3.5 w-3.5" />
                        Entregas
                      </span>
                      <span className="text-foreground font-medium">
                        {closing.deliveries.completed}/{closing.deliveries.total}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-1.5 border-b border-border/50">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <DollarSign className="h-3.5 w-3.5" />
                        Valor Líquido
                      </span>
                      <span className="font-medium text-emerald-600">
                        {new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        }).format(closing.financial.netValue)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-1.5">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        Horas
                      </span>
                      <span className="text-foreground">
                        {closing.hours.total}h
                      </span>
                    </div>
                  </div>

                  {/* Botões de ação para mobile */}
                  {canManage && (
                    <div className="flex gap-2 mt-3 pt-3 border-t">
                      {closing.status === "pending" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 h-9 text-xs bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                          onClick={() => handleApprove(closing.id)}
                        >
                          <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                          Aprovar
                        </Button>
                      )}
                      {closing.status === "approved" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 h-9 text-xs bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
                          onClick={() => handleMarkPaid(closing.id)}
                        >
                          <Banknote className="h-3.5 w-3.5 mr-1.5" />
                          Pagar
                        </Button>
                      )}
                      <Button
                        variant="destructive"
                        size="sm"
                        className={cn(
                          "h-9 text-xs",
                          closing.status === "pending" || closing.status === "approved" ? "flex-1" : "w-full"
                        )}
                        onClick={() => setDeleteId(closing.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                        Excluir
                      </Button>
                    </div>
                  )}
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>

        {/* Empty State Mobile */}
        {filteredClosings.length === 0 && (
          <div className="flex flex-col items-center gap-3 text-muted-foreground p-8">
            <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center">
              <FileText className="h-7 w-7 opacity-50" />
            </div>
            <div className="text-center">
              <p className="font-medium text-sm">Nenhum fechamento encontrado</p>
              <p className="text-xs mt-1">Tente ajustar seus filtros</p>
            </div>
            {activeFiltersCount > 0 && (
              <Button variant="outline" size="sm" onClick={clearFilters} className="mt-2 text-xs">
                <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                Limpar filtros
              </Button>
            )}
          </div>
        )}

        <PaginationComponent />
      </div>

      {/* Dialog de Visualizar Detalhes - Responsivo */}
      <Dialog open={!!viewClosing} onOpenChange={() => setViewClosing(null)}>
        <DialogContent className="max-w-lg w-[calc(100vw-2rem)] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader className="space-y-3">
            <DialogTitle className="flex items-center gap-3 text-base sm:text-lg">
              <div className={cn(
                "h-10 w-10 sm:h-12 sm:w-12 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold shrink-0",
                viewClosing?.status === "paid"
                  ? "bg-emerald-100 text-emerald-700"
                  : viewClosing?.status === "approved"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-amber-100 text-amber-700"
              )}>
                {viewClosing?.driverName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <span className="leading-tight">{viewClosing?.driverName}</span>
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Detalhes completos do fechamento
            </DialogDescription>
          </DialogHeader>

          {viewClosing && (
            <div className="space-y-4 sm:space-y-6 mt-4">
              {/* Status */}
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <span className="text-sm font-medium text-foreground">Status</span>
                <Badge
                  className={cn(
                    "px-2.5 py-1 text-xs",
                    statusConfig[viewClosing.status].bg,
                    statusConfig[viewClosing.status].text,
                    statusConfig[viewClosing.status].border
                  )}
                >
                  {statusConfig[viewClosing.status].label}
                </Badge>
              </div>

              {/* Período */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div className="p-3 bg-muted/30 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                    <CalendarIcon className="h-3 w-3" />
                    Início
                  </p>
                  <p className="font-mono text-sm text-foreground">
                    {format(new Date(viewClosing.period.start), "dd/MM/yyyy")}
                  </p>
                </div>
                <div className="p-3 bg-muted/30 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                    <CalendarIcon className="h-3 w-3" />
                    Fim
                  </p>
                  <p className="font-mono text-sm text-foreground">
                    {format(new Date(viewClosing.period.end), "dd/MM/yyyy")}
                  </p>
                </div>
              </div>

              {/* Entregas */}
              <div className="p-3 bg-muted/30 rounded-lg">
                <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                  <Package className="h-3 w-3" />
                  Entregas
                </p>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-foreground">Completadas</span>
                  <span className="text-xl sm:text-2xl font-bold text-primary">
                    {viewClosing.deliveries.completed}/{viewClosing.deliveries.total}
                  </span>
                </div>
              </div>

              {/* Valores */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div className="p-3 bg-muted/30 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    Valor Bruto
                  </p>
                  <p className="text-sm text-foreground">
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(viewClosing.financial.grossValue)}
                  </p>
                </div>
                <div className="p-3 bg-muted/30 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                    <Wallet className="h-3 w-3" />
                    Valor Líquido
                  </p>
                  <p className="text-sm font-bold text-emerald-600">
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(viewClosing.financial.netValue)}
                  </p>
                </div>
              </div>

              {/* Horas */}
              <div className="p-3 bg-muted/30 rounded-lg">
                <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Horas Trabalhadas
                </p>
                <p className="text-xl sm:text-2xl font-bold text-foreground">{viewClosing.hours.total}h</p>
              </div>

              {/* Datas */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4 border-t pt-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    Criado em
                  </p>
                  <p className="text-sm text-foreground">
                    {format(new Date(viewClosing.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">ID</p>
                  <p className="font-mono text-xs text-muted-foreground truncate">
                    {viewClosing.id.slice(0, 12)}...
                  </p>
                </div>
              </div>

              {/* Ações */}
              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                {canManage && viewClosing.status === "pending" && (
                  <Button
                    variant="default"
                    size="sm"
                    className="flex-1 h-10 sm:h-11"
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
                    size="sm"
                    className="flex-1 h-10 sm:h-11 bg-emerald-600 hover:bg-emerald-700"
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
                  size="sm"
                  className="flex-1 h-10 sm:h-11"
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
        <AlertDialogContent className="w-[calc(100vw-2rem)] max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base">Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              Tem certeza que deseja excluir este fechamento? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel className="mt-0 sm:mt-0 h-10 sm:h-11">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 h-10 sm:h-11"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}