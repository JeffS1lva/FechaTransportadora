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
  Eye,
  MapPin,
  Mail
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
  const [sortField, setSortField] = useState<SortField>("name")
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc")
  const [selectedDrivers, setSelectedDrivers] = useState<Set<string>>(new Set())
  const [showFilters, setShowFilters] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 8

  const canManage = user?.role === "admin" || user?.role === "editor"

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

  // Componente de paginação reutilizável - responsivo
  const PaginationComponent = () => {
    if (filteredDrivers.length <= itemsPerPage) return null

    return (
      <div className="flex justify-center xl:justify-end mt-4">
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
                  "h-9 w-9 xl:h-auto xl:w-auto p-0 xl:px-4",
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
                      className="h-9 w-9 xl:h-auto xl:w-auto xl:px-3 text-sm"
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
                  "h-9 w-9 xl:h-auto xl:w-auto p-0 xl:px-4",
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
    <div className="space-y-4 ">
      {/* Header de Controle - Responsivo */}
      <div className="flex flex-col gap-4 p-3 sm:p-4 bg-card rounded-xl border shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-semibold truncate">Motoristas</h2>
              <p className="text-sm text-muted-foreground truncate">
                {filteredDrivers.length} {filteredDrivers.length === 1 ? 'registro' : 'registros'}
                {selectedDrivers.size > 0 && ` • ${selectedDrivers.size} selec.`}
              </p>
            </div>
          </div>
        </div>

        {/* Barra de Busca e Filtros - Responsiva */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, CPF, placa..."
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
                <Badge variant="secondary" className="gap-1 px-2 py-1 text-xs">
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
                <Badge variant="secondary" className="gap-1 px-2 py-1 text-xs">
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

      {/* MODO LISTA - Apenas acima de 1300px (xl) */}
      <div className="hidden xl:block">
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
                    pagedDrivers.map((driver) => {
                      const isSelected = selectedDrivers.has(driver.id)
                      const status = getStatusConfig(driver.status)

                      return (
                        <tr
                          key={driver.id}
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
                                "h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold transition-colors shrink-0",
                                driver.status === "active"
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-slate-100 text-slate-600"
                              )}>
                                {driver.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium text-foreground truncate">{driver.name}</p>
                              </div>
                            </div>
                          </TableCell>

                          <TableCell className="p-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-sm">
                                <CreditCard className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                <span className="font-mono text-muted-foreground text-xs">{driver.cpf}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <Phone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                <span className="text-muted-foreground text-xs">{driver.phone || "-"}</span>
                              </div>
                            </div>
                          </TableCell>

                          <TableCell className="p-4">
                            <div className="flex items-center gap-2">
                              <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                                <Car className="h-4 w-4 text-muted-foreground" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-medium truncate">{driver.vehicle}</p>
                                <p className="text-xs text-muted-foreground font-mono">{driver.licensePlate}</p>
                              </div>
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
                            <span className="text-sm text-muted-foreground whitespace-nowrap">
                              {format(new Date(driver.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                            </span>
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
        </div>

        <PaginationComponent />
      </div>

      {/* MODO CARDS - Abaixo de 1300px (xl) */}
      <div className="xl:hidden">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-2">
          <AnimatePresence>
            {pagedDrivers.map((driver, index) => {
              const isSelected = selectedDrivers.has(driver.id)
              const status = getStatusConfig(driver.status)

              return (
                <motion.div
                  key={driver.id}
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
                      onClick={() => toggleSelection(driver.id)}
                      className={cn(
                        "h-10 w-10 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors cursor-pointer",
                        isSelected
                          ? "bg-primary text-primary-foreground"
                          : driver.status === "active"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-slate-100 text-slate-600"
                      )}
                    >
                      {isSelected ? (
                        <Check className="h-5 w-5" />
                      ) : (
                        driver.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground text-sm leading-tight truncate">
                        {driver.name}
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
                        onClick={() => setViewingDriver(driver)}
                      >
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </div>
                  </div>

                  {/* Informações principais */}
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between py-1.5 border-b border-border/50">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <CreditCard className="h-3.5 w-3.5" />
                        CPF
                      </span>
                      <span className="font-mono text-foreground">{driver.cpf}</span>
                    </div>

                    <div className="flex items-center justify-between py-1.5 border-b border-border/50">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <Car className="h-3.5 w-3.5" />
                        Veículo
                      </span>
                      <span className="text-foreground text-right truncate max-w-30">
                        {driver.vehicle}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-1.5 border-b border-border/50">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <span className="font-mono text-[10px]">PLACA</span>
                      </span>
                      <span className="font-mono text-foreground">{driver.licensePlate}</span>
                    </div>

                    <div className="flex items-center justify-between py-1.5">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5" />
                        Contato
                      </span>
                      <span className="text-foreground">
                        {driver.phone || "-"}
                      </span>
                    </div>
                  </div>

                  {/* Botões de ação */}
                  {canManage && (
                    <div className="flex gap-2 mt-3 pt-3 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 h-9 text-xs"
                        onClick={() => setEditDriver(driver)}
                      >
                        <Pencil className="h-3.5 w-3.5 mr-1.5" />
                        Editar
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="flex-1 h-9 text-xs"
                        onClick={() => setDeleteId(driver.id)}
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

        {/* Empty State */}
        {filteredDrivers.length === 0 && (
          <div className="flex flex-col items-center gap-3 text-muted-foreground p-8">
            <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center">
              <Car className="h-7 w-7 opacity-50" />
            </div>
            <div className="text-center">
              <p className="font-medium text-sm">Nenhum motorista encontrado</p>
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

      {/* Dialog de Visualizar Detalhes - Responsivo */}
      <Dialog open={!!viewingDriver} onOpenChange={() => setViewingDriver(null)}>
        <DialogContent className="max-w-lg w-[calc(100vw-2rem)] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader className="space-y-3">
            <DialogTitle className="flex items-center gap-3 text-base sm:text-lg">
              <div className={cn(
                "h-10 w-10 sm:h-12 sm:w-12 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold shrink-0",
                viewingDriver?.status === "active"
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-slate-100 text-slate-600"
              )}>
                {viewingDriver?.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <span className="leading-tight">{viewingDriver?.name}</span>
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Detalhes completos do motorista
            </DialogDescription>
          </DialogHeader>

          {viewingDriver && (
            <div className="space-y-4 sm:space-y-6 mt-4">
              {/* Status */}
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <span className="text-sm font-medium text-foreground">Status</span>
                <Badge
                  className={cn(
                    "px-2.5 py-1 text-xs",
                    viewingDriver.status === "active"
                      ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                      : "bg-slate-500/10 text-slate-600 border-slate-500/20"
                  )}
                >
                  {viewingDriver.status === "active" ? "Ativo" : "Inativo"}
                </Badge>
              </div>

              {/* Documentos */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div className="p-3 bg-muted/30 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                    <CreditCard className="h-3 w-3" />
                    CPF
                  </p>
                  <p className="font-mono text-sm text-foreground">{viewingDriver.cpf}</p>
                </div>
                <div className="p-3 bg-muted/30 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">CNH</p>
                  <p className="font-mono text-sm text-foreground">{viewingDriver.cnh}</p>
                </div>
              </div>

              {/* Contato */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="p-3 bg-muted/30 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    Telefone
                  </p>
                  <p className="text-sm text-foreground">{viewingDriver.phone || "-"}</p>
                </div>
                <div className="p-3 bg-muted/30 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    Email
                  </p>
                  <p className="text-sm text-foreground break-all">{viewingDriver.email || "-"}</p>
                </div>
              </div>

              {/* Endereço */}
              <div className="p-3 bg-muted/30 rounded-lg">
                <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  Endereço
                </p>
                <div className="space-y-1">
                  <p className="text-sm text-foreground">
                    {viewingDriver.street}, {viewingDriver.number} {viewingDriver.complement}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {viewingDriver.neighborhood}, {viewingDriver.city} - {viewingDriver.state} {viewingDriver.cep}
                  </p>
                </div>
              </div>

              {/* Veículo */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div className="p-3 bg-muted/30 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                    <Car className="h-3 w-3" />
                    Veículo
                  </p>
                  <p className="text-sm text-foreground">{viewingDriver.vehicle}</p>
                </div>
                <div className="p-3 bg-muted/30 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Placa</p>
                  <p className="font-mono text-sm text-foreground">{viewingDriver.licensePlate}</p>
                </div>
              </div>

              {/* Datas */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4 border-t pt-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                    <CalendarIcon className="h-3 w-3" />
                    Cadastro
                  </p>
                  <p className="text-sm text-foreground">
                    {format(new Date(viewingDriver.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">ID</p>
                  <p className="font-mono text-xs text-muted-foreground truncate">
                    {viewingDriver.id.slice(0, 12)}...
                  </p>
                </div>
              </div>

              {/* Ações */}
              <div className="flex gap-2 pt-2">
                {canManage && (
                  <Button
                    variant="default"
                    size="sm"
                    className="flex-1"
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
                  size="sm"
                  className="flex-1"
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
        <AlertDialogContent className="w-[calc(100vw-2rem)] max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base">Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              Tem certeza que deseja excluir este motorista? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel className="mt-0 sm:mt-0">Cancelar</AlertDialogCancel>
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