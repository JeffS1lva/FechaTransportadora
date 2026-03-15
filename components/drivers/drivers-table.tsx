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
import { DriverForm } from "./driver-form"
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
  Pencil,
  Trash2,
  Car,
  Phone,
  CreditCard,
  User,
  Check,
  X,
  LayoutGrid,
  List,
  Calendar as CalendarIcon,
  RotateCcw,
  ChevronDown,
  Eye
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import type { Driver } from "@/lib/types"
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

type SortField = "name" | "cpf" | "vehicle" | "status" | "createdAt"
type SortOrder = "asc" | "desc"
type ViewMode = "list" | "cards"

interface Filters {
  search: string
  status: "all" | "active" | "inactive"
  vehicleType: string
  dateFrom: Date | undefined
  dateTo: Date | undefined
  hasPhone: "all" | "yes" | "no"
}

export function DriversTable() {
  const { drivers, deleteDriver } = useData()
  const { user } = useAuth()
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [editDriver, setEditDriver] = useState<Driver | null>(null)
  const [viewingDriver, setViewingDriver] = useState<Driver | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>("list")
  const [sortField, setSortField] = useState<SortField>("name")
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc")
  const [selectedDrivers, setSelectedDrivers] = useState<Set<string>>(new Set())
  const [showFilters, setShowFilters] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 8

  const canManage = user?.role === "admin" || user?.role === "editor"

  // REMOVIDO: hoveredRow e hoveredCard - usando CSS group-hover agora

  // Estado dos filtros
  const [filters, setFilters] = useState<Filters>({
    search: "",
    status: "all",
    vehicleType: "all",
    dateFrom: undefined,
    dateTo: undefined,
    hasPhone: "all"
  })

  // Extrair tipos únicos de veículos para o filtro
  const vehicleTypes = useMemo(() => {
    const types = new Set(drivers.map(d => d.vehicle.split(' ')[0]))
    return Array.from(types).sort()
  }, [drivers])

  // Contar filtros ativos
  const activeFiltersCount = useMemo(() => {
    let count = 0
    if (filters.status !== "all") count++
    if (filters.vehicleType !== "all") count++
    if (filters.dateFrom) count++
    if (filters.dateTo) count++
    if (filters.hasPhone !== "all") count++
    return count
  }, [filters])

  // Aplicar filtros e ordenação
  const filteredDrivers = useMemo(() => {
    let result = drivers.filter(driver => {
      // Filtro de busca textual
      if (filters.search) {
        const query = filters.search.toLowerCase()
        const matchesSearch = (
          driver.name.toLowerCase().includes(query) ||
          driver.cpf.includes(query) ||
          driver.licensePlate.toLowerCase().includes(query) ||
          driver.vehicle.toLowerCase().includes(query) ||
          driver.phone.includes(query)
        )
        if (!matchesSearch) return false
      }

      // Filtro de status
      if (filters.status !== "all" && driver.status !== filters.status) {
        return false
      }

      // Filtro de tipo de veículo
      if (filters.vehicleType !== "all") {
        const vehicleBrand = driver.vehicle.split(' ')[0]
        if (vehicleBrand !== filters.vehicleType) return false
      }

      // Filtro de data (from)
      if (filters.dateFrom) {
        const driverDate = new Date(driver.createdAt)
        if (driverDate < filters.dateFrom) return false
      }

      // Filtro de data (to)
      if (filters.dateTo) {
        const driverDate = new Date(driver.createdAt)
        const endOfDay = new Date(filters.dateTo)
        endOfDay.setHours(23, 59, 59, 999)
        if (driverDate > endOfDay) return false
      }

      // Filtro de telefone
      if (filters.hasPhone !== "all") {
        const hasPhone = driver.phone && driver.phone.length > 0
        if (filters.hasPhone === "yes" && !hasPhone) return false
        if (filters.hasPhone === "no" && hasPhone) return false
      }

      return true
    })

    // Ordenação
    result.sort((a, b) => {
      let comparison = 0
      switch (sortField) {
        case "name":
          comparison = a.name.localeCompare(b.name)
          break
        case "cpf":
          comparison = a.cpf.localeCompare(b.cpf)
          break
        case "vehicle":
          comparison = a.vehicle.localeCompare(b.vehicle)
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
  }, [drivers, filters, sortField, sortOrder])

  const totalPages = Math.max(1, Math.ceil(filteredDrivers.length / itemsPerPage))

  const pagedDrivers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredDrivers.slice(start, start + itemsPerPage)
  }, [filteredDrivers, currentPage])

  // Reset pagination when filtered list changes
  useEffect(() => {
    setCurrentPage(1)
  }, [filteredDrivers.length])

  // Gerar array de páginas visíveis (com ellipsis)
  const visiblePages = useMemo(() => {
    const pages: (number | string)[] = []

    if (totalPages <= 7) {
      // Mostrar todas as páginas se forem poucas
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Sempre mostrar primeira e última página
      pages.push(1)

      if (currentPage > 3) {
        pages.push('ellipsis-start')
      }

      // Páginas ao redor da página atual
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
    const newSelected = new Set(selectedDrivers)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedDrivers(newSelected)
  }

  const selectAll = () => {
    if (selectedDrivers.size === filteredDrivers.length) {
      setSelectedDrivers(new Set())
    } else {
      setSelectedDrivers(new Set(filteredDrivers.map(d => d.id)))
    }
  }

  const clearFilters = () => {
    setFilters({
      search: "",
      status: "all",
      vehicleType: "all",
      dateFrom: undefined,
      dateTo: undefined,
      hasPhone: "all"
    })
  }

  const handleDelete = () => {
    if (deleteId) {
      deleteDriver(deleteId)
      setDeleteId(null)
      toast.success("Motorista excluído", {
        description: "O motorista foi removido com sucesso.",
        style: {
          border: '1px solid #b91c1c',
          background: '#ef4444',
          color: '#ffffff',
        }
      })
    }
  }

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "active":
        return {
          bg: "bg-emerald-500/10",
          text: "text-emerald-600",
          border: "border-emerald-500/20",
          dot: "bg-emerald-500",
          label: "Ativo"
        }
      case "inactive":
        return {
          bg: "bg-slate-500/10",
          text: "text-slate-600",
          border: "border-slate-500/20",
          dot: "bg-slate-400",
          label: "Inativo"
        }
      default:
        return {
          bg: "bg-gray-500/10",
          text: "text-gray-600",
          border: "border-gray-500/20",
          dot: "bg-gray-400",
          label: status
        }
    }
  }

  // Componente de paginação reutilizável - alinhado à direita
  const PaginationComponent = () => {
    if (filteredDrivers.length <= itemsPerPage) return null

    return (
      <div className="flex ">
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
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Motoristas</h2>
              <p className="text-sm text-muted-foreground">
                {filteredDrivers.length} {filteredDrivers.length === 1 ? 'registro' : 'registros'} encontrados
                {selectedDrivers.size > 0 && ` • ${selectedDrivers.size} selecionado(s)`}
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
                placeholder="Buscar por nome, CPF, placa, telefone..."
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
                        <SelectItem value="active">Ativos</SelectItem>
                        <SelectItem value="inactive">Inativos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Filtro de Tipo de Veículo */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground uppercase">Marca do Veículo</label>
                    <Select
                      value={filters.vehicleType}
                      onValueChange={(value) => setFilters(prev => ({ ...prev, vehicleType: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Todas as marcas" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas</SelectItem>
                        {vehicleTypes.map(type => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Filtro de Telefone */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground uppercase">Contato</label>
                    <Select
                      value={filters.hasPhone}
                      onValueChange={(value: any) => setFilters(prev => ({ ...prev, hasPhone: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Todos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="yes">Com telefone</SelectItem>
                        <SelectItem value="no">Sem telefone</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Filtro de Período */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground uppercase">Período de Cadastro</label>
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
                  Status: {filters.status === "active" ? "Ativo" : "Inativo"}
                  <button
                    onClick={() => setFilters(prev => ({ ...prev, status: "all" }))}
                    className="ml-1 hover:bg-muted rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}

              {filters.vehicleType !== "all" && (
                <Badge variant="secondary" className="gap-1 px-2 py-1">
                  Veículo: {filters.vehicleType}
                  <button
                    onClick={() => setFilters(prev => ({ ...prev, vehicleType: "all" }))}
                    className="ml-1 hover:bg-muted rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}

              {filters.hasPhone !== "all" && (
                <Badge variant="secondary" className="gap-1 px-2 py-1">
                  {filters.hasPhone === "yes" ? "Com telefone" : "Sem telefone"}
                  <button
                    onClick={() => setFilters(prev => ({ ...prev, hasPhone: "all" }))}
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
                        selectedDrivers.size === filteredDrivers.length && filteredDrivers.length > 0
                          ? "bg-primary border-primary text-primary-foreground"
                          : "border-input hover:border-primary"
                      )}
                    >
                      {selectedDrivers.size === filteredDrivers.length && filteredDrivers.length > 0 && (
                        <Check className="h-3 w-3" />
                      )}
                    </button>
                  </TableHead>
                  <TableHead className="text-left p-4">
                    <button
                      onClick={() => toggleSort("name")}
                      className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground uppercase tracking-wider"
                    >
                      Motorista
                      <ArrowUpDown className={cn(
                        "h-3 w-3 transition-colors",
                        sortField === "name" ? "text-primary" : "text-muted-foreground"
                      )} />
                    </button>
                  </TableHead>
                  <TableHead className="text-left p-4">
                    <button
                      onClick={() => toggleSort("cpf")}
                      className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground uppercase tracking-wider"
                    >
                      Documentos
                      <ArrowUpDown className={cn(
                        "h-3 w-3 transition-colors",
                        sortField === "cpf" ? "text-primary" : "text-muted-foreground"
                      )} />
                    </button>
                  </TableHead>
                  <TableHead className="text-left p-4">
                    <button
                      onClick={() => toggleSort("vehicle")}
                      className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground uppercase tracking-wider"
                    >
                      Veículo
                      <ArrowUpDown className={cn(
                        "h-3 w-3 transition-colors",
                        sortField === "vehicle" ? "text-primary" : "text-muted-foreground"
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
                  <TableHead className="text-left p-4">
                    <button
                      onClick={() => toggleSort("createdAt")}
                      className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground uppercase tracking-wider"
                    >
                      Cadastro
                      <ArrowUpDown className={cn(
                        "h-3 w-3 transition-colors",
                        sortField === "createdAt" ? "text-primary" : "text-muted-foreground"
                      )} />
                    </button>
                  </TableHead>
                  {canManage && <TableHead className="w-16 p-4"></TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y">
                <AnimatePresence>
                  {filteredDrivers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={canManage ? 7 : 6} className="p-12 text-center">
                        <div className="flex flex-col items-center gap-3 text-muted-foreground">
                          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                            <Car className="h-8 w-8 opacity-50" />
                          </div>
                          <div>
                            <p className="font-medium">Nenhum motorista encontrado</p>
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
                    pagedDrivers.map((driver, index) => {
                      const isSelected = selectedDrivers.has(driver.id)
                      const status = getStatusConfig(driver.status)

                      return (
                        <tr
                          key={driver.id}

                          // ALTERADO: Usando group e group-hover em vez de estado JavaScript
                          className={cn(
                            "group transition-colors",
                            isSelected ? "bg-primary/5" : "hover:bg-muted/50"
                          )}
                        >
                          <TableCell className="p-4">
                            <button
                              onClick={() => toggleSelection(driver.id)}
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
                                driver.status === "active"
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-slate-100 text-slate-600"
                              )}>
                                {driver.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-medium text-foreground">{driver.name}</p>

                              </div>
                            </div>
                          </TableCell>

                          <TableCell className="p-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-sm">
                                <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
                                <span className="font-mono text-muted-foreground">{driver.cpf}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                                <span className="text-muted-foreground">{driver.phone || "-"}</span>
                              </div>
                            </div>
                          </TableCell>

                          <TableCell className="p-4">
                            <div className="flex items-center gap-2">
                              <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
                                <Car className="h-4 w-4 text-muted-foreground" />
                              </div>
                              <div>
                                <p className="text-sm font-medium">{driver.vehicle}</p>
                                <p className="text-xs text-muted-foreground font-mono">{driver.licensePlate}</p>
                              </div>
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
                            <span className="text-sm text-muted-foreground">
                              {format(new Date(driver.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                            </span>
                          </TableCell>

                          <TableCell className="p-4">
                            {/* ALTERADO: Usando group-hover em vez de isHovered */}
                            <div className={cn(
                              "flex items-center justify-end gap-1 transition-opacity duration-200",
                              "opacity-0 group-hover:opacity-100"
                            )}>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => setViewingDriver(driver)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {canManage && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => setEditDriver(driver)}
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-destructive hover:text-destructive"
                                    onClick={() => setDeleteId(driver.id)}
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

          {/* Paginação completamente fora da tabela, alinhada à direita */}
          <PaginationComponent />
        </>
      )}

      {/* Conteúdo - Modo Cards */}
      {viewMode === "cards" && (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence>
              {pagedDrivers.map((driver, index) => {
                const isSelected = selectedDrivers.has(driver.id)
                const status = getStatusConfig(driver.status)

                return (
                  <motion.div
                    key={driver.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2, delay: index * 0.05 }}
                    onClick={() => toggleSelection(driver.id)}
                    // ALTERADO: Usando group e group-hover em vez de estado JavaScript
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
                          driver.status === "active"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-slate-100 text-slate-600"
                        )}>
                          {driver.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">{driver.name}</h3>
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
                        <CreditCard className="h-4 w-4" />
                        <span className="font-mono">{driver.cpf}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="h-4 w-4" />
                        <span>{driver.phone || "Sem telefone"}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Car className="h-4 w-4" />
                        <span>{driver.vehicle} • <span className="font-mono">{driver.licensePlate}</span></span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground text-xs pt-2 border-t">
                        <CalendarIcon className="h-3 w-3" />
                        Cadastrado em {format(new Date(driver.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                      </div>
                    </div>

                    {/* ALTERADO: Usando group-hover em vez de hoveredCard */}
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
                          setViewingDriver(driver)
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {canManage && (
                        <>
                          <Button
                            variant="secondary"
                            size="icon"
                            className="h-8 w-8 shadow-sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              setEditDriver(driver)
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="icon"
                            className="h-8 w-8 shadow-sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              setDeleteId(driver.id)
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
          {filteredDrivers.length === 0 && (
            <div className="flex flex-col items-center gap-3 text-muted-foreground p-12">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                <Car className="h-8 w-8 opacity-50" />
              </div>
              <div className="text-center">
                <p className="font-medium">Nenhum motorista encontrado</p>
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

          {/* Paginação fora do grid de cards, alinhada à direita */}
          <PaginationComponent />
        </>
      )}

      {/* Modais */}
      {editDriver && (
        <DriverForm
          driver={editDriver}
          open={!!editDriver}
          onOpenChange={(open) => {
            if (!open) setEditDriver(null)
          }}
          trigger={null}
        />
      )}

      {/* Dialog de Visualizar Detalhes */}
      <Dialog open={!!viewingDriver} onOpenChange={() => setViewingDriver(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className={cn(
                "h-12 w-12 rounded-full flex items-center justify-center text-sm font-bold",
                viewingDriver?.status === "active"
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-slate-100 text-slate-600"
              )}>
                {viewingDriver?.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              {viewingDriver?.name}
            </DialogTitle>
            <DialogDescription>
              Detalhes completos do motorista
            </DialogDescription>
          </DialogHeader>

          {viewingDriver && (
            <div className="space-y-6">
              {/* Status */}
              <div className="flex items-center gap-3">
                <span className="font-medium text-foreground">Status:</span>
                <Badge
                  className={cn(
                    "px-3 py-1",
                    viewingDriver.status === "active"
                      ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                      : "bg-slate-500/10 text-slate-600 border-slate-500/20"
                  )}
                >
                  {viewingDriver.status === "active" ? "Ativo" : "Inativo"}
                </Badge>
              </div>

              {/* Documentos */}
              <div className="grid grid-cols-2 gap-4 border-t pt-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">CPF</p>
                  <p className="font-mono text-foreground">{viewingDriver.cpf}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">CNH</p>
                  <p className="font-mono text-foreground">{viewingDriver.cnh}</p>
                </div>
              </div>

              {/* Contato */}
              <div className="grid grid-cols-2 gap-4 border-t pt-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                    <Phone className="h-4 w-4" />
                    Telefone
                  </p>
                  <p className="text-foreground">{viewingDriver.phone || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Email</p>
                  <p className="text-foreground">{viewingDriver.email || "-"}</p>
                </div>
              </div>

              {/* Endereço */}
              <div className="space-y-2 border-t pt-4">
                <p className="text-sm text-muted-foreground">Endereço</p>
                <div className="bg-muted/50 p-3 rounded-md">
                  <p className="text-foreground">
                    {viewingDriver.street}, {viewingDriver.number} {viewingDriver.complement}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {viewingDriver.neighborhood}, {viewingDriver.city} - {viewingDriver.state} {viewingDriver.cep}
                  </p>
                </div>
              </div>

              {/* Veículo */}
              <div className="grid grid-cols-2 gap-4 border-t pt-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                    <Car className="h-4 w-4" />
                    Veículo
                  </p>
                  <p className="text-foreground">{viewingDriver.vehicle}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Placa</p>
                  <p className="font-mono text-foreground">{viewingDriver.licensePlate}</p>
                </div>
              </div>

              {/* Datas */}
              <div className="grid grid-cols-2 gap-4 border-t pt-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                    <CalendarIcon className="h-4 w-4" />
                    Cadastro
                  </p>
                  <p className="text-foreground">
                    {format(new Date(viewingDriver.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">ID</p>
                  <p className="font-mono text-sm text-muted-foreground">{viewingDriver.id.slice(0, 12)}...</p>
                </div>
              </div>

              {/* Ações */}
              <div className="flex gap-2 border-t pt-4">
                {canManage && (
                  <Button
                    variant="default"
                    onClick={() => {
                      setViewingDriver(null)
                      setEditDriver(viewingDriver)
                    }}
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => setViewingDriver(null)}
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
              Tem certeza que deseja excluir este motorista? Esta ação não pode ser desfeita.
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
    </div>
  )
}