"use client"

import { useState, useMemo, useEffect } from "react"
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
import {
  Search,
  Filter,
  ArrowUpDown,
  Pencil,
  Trash2,
  User,
  Check,
  X,
  LayoutGrid,
  List,
  RotateCcw,
  ChevronDown,
  Eye,
  Lock,
  Power,
  PowerOff,
  Mail,
  Shield,
  Calendar
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type SortField = "name" | "email" | "role" | "status" | "createdAt"
type SortOrder = "asc" | "desc"
type ViewMode = "list" | "cards"
type UserStatus = "active" | "inactive"

interface UserData {
  email: string
  user: {
    name: string
    role: "viewer" | "editor" | "admin"
    status?: UserStatus
    createdAt?: string
    lastLogin?: string
    avatar?: string
  }
}

interface Filters {
  search: string
  role: "all" | "viewer" | "editor" | "admin"
  status: "all" | "active" | "inactive"
}

export function UsersTable() {
  const { users, user, deleteUser, updateUser } = useAuth()
  const [deleteEmail, setDeleteEmail] = useState<string | null>(null)
  const [resetPasswordEmail, setResetPasswordEmail] = useState<string | null>(null)
  const [viewingUser, setViewingUser] = useState<UserData | null>(null)
  const [editingUser, setEditingUser] = useState<UserData | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>("list")
  const [sortField, setSortField] = useState<SortField>("name")
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc")
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set())
  const [showFilters, setShowFilters] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 8

  const canManage = user?.role === "admin"

  // Estado dos filtros
  const [filters, setFilters] = useState<Filters>({
    search: "",
    role: "all",
    status: "all"
  })

  // Contar filtros ativos
  const activeFiltersCount = useMemo(() => {
    let count = 0
    if (filters.role !== "all") count++
    if (filters.status !== "all") count++
    return count
  }, [filters])

  // Normalizar dados dos usuários
  const normalizedUsers = useMemo(() => {
    return users.map(u => ({
      ...u,
      user: {
        ...u.user,
        status: u.user.status || "active",
        createdAt: u.user.createdAt || new Date().toISOString()
      }
    })) as UserData[]
  }, [users])

  // Aplicar filtros e ordenação
  const filteredUsers = useMemo(() => {
    let result = normalizedUsers.filter((u) => {
      // Filtro de busca textual
      if (filters.search) {
        const query = filters.search.toLowerCase()
        const matchesSearch = (
          u.user.name.toLowerCase().includes(query) ||
          u.email.toLowerCase().includes(query) ||
          u.user.role.toLowerCase().includes(query)
        )
        if (!matchesSearch) return false
      }

      // Filtro de role
      if (filters.role !== "all" && u.user.role !== filters.role) {
        return false
      }

      // Filtro de status
      if (filters.status !== "all" && u.user.status !== filters.status) {
        return false
      }

      return true
    })

    // Ordenação
    result.sort((a, b) => {
      let comparison = 0
      switch (sortField) {
        case "name":
          comparison = a.user.name.localeCompare(b.user.name)
          break
        case "email":
          comparison = a.email.localeCompare(b.email)
          break
        case "role":
          comparison = a.user.role.localeCompare(b.user.role)
          break
        case "status":
          comparison = (a.user.status || "active").localeCompare(b.user.status || "active")
          break
        case "createdAt":
          comparison = new Date(a.user.createdAt || 0).getTime() - new Date(b.user.createdAt || 0).getTime()
          break
      }
      return sortOrder === "asc" ? comparison : -comparison
    })

    return result
  }, [normalizedUsers, filters, sortField, sortOrder])

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / itemsPerPage))

  const pagedUsers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredUsers.slice(start, start + itemsPerPage)
  }, [filteredUsers, currentPage])

  // Reset pagination when filtered list changes
  useEffect(() => {
    setCurrentPage(1)
  }, [filteredUsers.length])

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

  const toggleSelection = (email: string) => {
    const newSelected = new Set(selectedUsers)
    if (newSelected.has(email)) {
      newSelected.delete(email)
    } else {
      newSelected.add(email)
    }
    setSelectedUsers(newSelected)
  }

  const selectAll = () => {
    if (selectedUsers.size === filteredUsers.length) {
      setSelectedUsers(new Set())
    } else {
      setSelectedUsers(new Set(filteredUsers.map(u => u.email)))
    }
  }

  const clearFilters = () => {
    setFilters({
      search: "",
      role: "all",
      status: "all"
    })
  }

  const canDelete = (email: string) => {
    if (user?.email === email) return false
    if (email === "admin@empresa.com") return false
    return true
  }

  const canChangeRole = (email: string) => {
    if (user?.email === email) return false
    if (email === "admin@empresa.com") return false
    return true
  }

  const handleDelete = () => {
    if (!deleteEmail) return
    deleteUser(deleteEmail)
    toast.success("Usuário removido", {
      description: "O usuário foi excluído permanentemente.",
      style: {
        border: '1px solid #b91c1c',
        background: '#ef4444',
        color: '#ffffff',
      }
    })
    setDeleteEmail(null)
  }

  const handleRoleChange = (email: string, role: "viewer" | "editor" | "admin") => {
    updateUser(email, { role })
    toast.success("Permissão atualizada", {
      description: `O papel do usuário foi alterado para ${getRoleLabel(role)}.`
    })
  }

  const handleToggleStatus = (userData: UserData) => {
    const newStatus = userData.user.status === "active" ? "inactive" : "active"
    updateUser(userData.email, { status: newStatus })
    
    if (newStatus === "active") {
      toast.success("Usuário ativado", {
        description: `${userData.user.name} agora tem acesso ao sistema.`
      })
    } else {
      toast.success("Usuário desativado", {
        description: `${userData.user.name} foi bloqueado temporariamente.`,
        style: {
          border: '1px solid #ca8a04',
          background: '#eab308',
          color: '#ffffff',
        }
      })
    }
  }

  const handleResetPassword = () => {
    if (!resetPasswordEmail) return
    // Simulação de reset de senha - implementar com sua API
    toast.success("Senha resetada", {
      description: "Um email com instruções foi enviado ao usuário."
    })
    setResetPasswordEmail(null)
  }

  const getRoleConfig = (role: string) => {
    switch (role) {
      case "admin":
        return {
          bg: "bg-purple-500/10",
          text: "text-purple-600",
          border: "border-purple-500/20",
          dot: "bg-purple-500",
          label: "Administrador",
          icon: Shield
        }
      case "editor":
        return {
          bg: "bg-blue-500/10",
          text: "text-blue-600",
          border: "border-blue-500/20",
          dot: "bg-blue-500",
          label: "Editor",
          icon: Pencil
        }
      case "viewer":
        return {
          bg: "bg-slate-500/10",
          text: "text-slate-600",
          border: "border-slate-500/20",
          dot: "bg-slate-400",
          label: "Visualizador",
          icon: Eye
        }
      default:
        return {
          bg: "bg-gray-500/10",
          text: "text-gray-600",
          border: "border-gray-500/20",
          dot: "bg-gray-400",
          label: role,
          icon: User
        }
    }
  }

  const getRoleLabel = (role: string) => {
    return getRoleConfig(role).label
  }

  const getStatusConfig = (status: UserStatus) => {
    switch (status) {
      case "active":
        return {
          bg: "bg-emerald-500/10",
          text: "text-emerald-600",
          border: "border-emerald-500/20",
          dot: "bg-emerald-500",
          label: "Ativo",
          icon: Power
        }
      case "inactive":
        return {
          bg: "bg-red-500/10",
          text: "text-red-600",
          border: "border-red-500/20",
          dot: "bg-red-500",
          label: "Inativo",
          icon: PowerOff
        }
      default:
        return {
          bg: "bg-slate-500/10",
          text: "text-slate-600",
          border: "border-slate-500/20",
          dot: "bg-slate-400",
          label: status,
          icon: User
        }
    }
  }

  // Componente de paginação reutilizável - responsivo
  const PaginationComponent = () => {
    if (filteredUsers.length <= itemsPerPage) return null

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
    <div className="space-y-4 min-[1300px]:px-0">
      {/* Header de Controle - Responsivo */}
      <div className="flex flex-col gap-4 p-3 sm:p-4 bg-card rounded-xl border shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-semibold truncate">Usuários</h2>
              <p className="text-sm text-muted-foreground truncate">
                {filteredUsers.length} {filteredUsers.length === 1 ? 'registro' : 'registros'}
                {selectedUsers.size > 0 && ` • ${selectedUsers.size} selec.`}
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
                placeholder="Buscar por nome, email, permissão..."
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

                  {/* Filtro de Permissão */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground uppercase">Permissão</label>
                    <Select
                      value={filters.role}
                      onValueChange={(value: any) => setFilters(prev => ({ ...prev, role: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Todas as permissões" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas</SelectItem>
                        <SelectItem value="admin">Administrador</SelectItem>
                        <SelectItem value="editor">Editor</SelectItem>
                        <SelectItem value="viewer">Visualizador</SelectItem>
                      </SelectContent>
                    </Select>
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
              {filters.role !== "all" && (
                <Badge variant="secondary" className="gap-1 px-2 py-1 text-xs">
                  Permissão: {getRoleLabel(filters.role)}
                  <button
                    onClick={() => setFilters(prev => ({ ...prev, role: "all" }))}
                    className="ml-1 hover:bg-muted rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}

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
                            selectedUsers.size === filteredUsers.length && filteredUsers.length > 0
                              ? "bg-primary border-primary text-primary-foreground"
                              : "border-input hover:border-primary"
                          )}
                        >
                          {selectedUsers.size === filteredUsers.length && filteredUsers.length > 0 && (
                            <Check className="h-3 w-3" />
                          )}
                        </button>
                      </TableHead>
                      <TableHead className="text-left p-4">
                        <button
                          onClick={() => toggleSort("name")}
                          className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground uppercase tracking-wider"
                        >
                          Usuário
                          <ArrowUpDown className={cn(
                            "h-3 w-3 transition-colors",
                            sortField === "name" ? "text-primary" : "text-muted-foreground"
                          )} />
                        </button>
                      </TableHead>
                      <TableHead className="text-left p-4">
                        <button
                          onClick={() => toggleSort("email")}
                          className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground uppercase tracking-wider"
                        >
                          Email
                          <ArrowUpDown className={cn(
                            "h-3 w-3 transition-colors",
                            sortField === "email" ? "text-primary" : "text-muted-foreground"
                          )} />
                        </button>
                      </TableHead>
                      <TableHead className="text-left p-4">
                        <button
                          onClick={() => toggleSort("role")}
                          className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground uppercase tracking-wider"
                        >
                          Permissão
                          <ArrowUpDown className={cn(
                            "h-3 w-3 transition-colors",
                            sortField === "role" ? "text-primary" : "text-muted-foreground"
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
                      <TableHead className="w-16 p-4"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y">
                    <AnimatePresence>
                      {filteredUsers.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="p-12 text-center">
                            <div className="flex flex-col items-center gap-3 text-muted-foreground">
                              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                                <User className="h-8 w-8 opacity-50" />
                              </div>
                              <div>
                                <p className="font-medium">Nenhum usuário encontrado</p>
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
                        pagedUsers.map((userData) => {
                          const isSelected = selectedUsers.has(userData.email)
                          const role = getRoleConfig(userData.user.role)
                          const status = getStatusConfig(userData.user.status || "active")
                          const RoleIcon = role.icon
                          const StatusIcon = status.icon

                          return (
                            <motion.tr
                              key={userData.email}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className={cn(
                                "group transition-colors",
                                isSelected ? "bg-primary/5" : "hover:bg-muted/50"
                              )}
                            >
                              <TableCell className="p-4">
                                <button
                                  onClick={() => toggleSelection(userData.email)}
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
                                    userData.user.status === "active"
                                      ? "bg-emerald-100 text-emerald-700"
                                      : "bg-slate-100 text-slate-600"
                                  )}>
                                    {userData.user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="font-medium text-foreground truncate">{userData.user.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {userData.user.createdAt ? format(new Date(userData.user.createdAt), "dd/MM/yyyy", { locale: ptBR }) : "-"}
                                    </p>
                                  </div>
                                </div>
                              </TableCell>

                              <TableCell className="p-4">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                  <span className="truncate">{userData.email}</span>
                                </div>
                              </TableCell>

                              <TableCell className="p-4">
                                {canChangeRole(userData.email) ? (
                                  <Select
                                    value={userData.user.role}
                                    onValueChange={(value) =>
                                      handleRoleChange(userData.email, value as "viewer" | "editor" | "admin")
                                    }
                                  >
                                    <SelectTrigger className="w-40 h-8">
                                      <div className="flex items-center gap-2">
                                        <div className={cn("w-2 h-2 rounded-full", role.dot)} />
                                        <span className={role.text}>{role.label}</span>
                                      </div>
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="viewer">Visualizador</SelectItem>
                                      <SelectItem value="editor">Editor</SelectItem>
                                      <SelectItem value="admin">Administrador</SelectItem>
                                    </SelectContent>
                                  </Select>
                                ) : (
                                  <Badge
                                    variant="outline"
                                    className={cn(
                                      "border-0 px-2.5 py-1 font-medium",
                                      role.bg,
                                      role.text,
                                      role.border
                                    )}
                                  >
                                    <RoleIcon className="h-3 w-3 mr-1.5" />
                                    {role.label}
                                  </Badge>
                                )}
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
                                  <StatusIcon className="h-3 w-3 mr-1.5" />
                                  {status.label}
                                </Badge>
                              </TableCell>

                              <TableCell className="p-4">
                                <div className={cn(
                                  "flex items-center justify-end gap-1 transition-opacity duration-200",
                                  "opacity-0 group-hover:opacity-100"
                                )}>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8"
                                      >
                                        <Eye className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-48">
                                      <DropdownMenuItem onClick={() => setViewingUser(userData)}>
                                        <Eye className="h-4 w-4 mr-2" />
                                        Ver detalhes
                                      </DropdownMenuItem>
                                      {canManage && (
                                        <>
                                          <DropdownMenuSeparator />
                                          <DropdownMenuItem onClick={() => setEditingUser(userData)}>
                                            <Pencil className="h-4 w-4 mr-2" />
                                            Editar usuário
                                          </DropdownMenuItem>
                                          <DropdownMenuItem onClick={() => handleToggleStatus(userData)}>
                                            {userData.user.status === "active" ? (
                                              <>
                                                <PowerOff className="h-4 w-4 mr-2 text-red-500" />
                                                <span className="text-red-500">Desativar</span>
                                              </>
                                            ) : (
                                              <>
                                                <Power className="h-4 w-4 mr-2 text-emerald-500" />
                                                <span className="text-emerald-500">Ativar</span>
                                              </>
                                            )}
                                          </DropdownMenuItem>
                                          <DropdownMenuItem onClick={() => setResetPasswordEmail(userData.email)}>
                                            <Lock className="h-4 w-4 mr-2" />
                                            Resetar senha
                                          </DropdownMenuItem>
                                          <DropdownMenuSeparator />
                                          <DropdownMenuItem 
                                            onClick={() => setDeleteEmail(userData.email)}
                                            disabled={!canDelete(userData.email)}
                                            className="text-destructive focus:text-destructive"
                                          >
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            Excluir
                                          </DropdownMenuItem>
                                        </>
                                      )}
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </TableCell>
                            </motion.tr>
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
            <div className="grid gap-4 min-[1300px]:grid-cols-2 2xl:grid-cols-3">
              <AnimatePresence>
                {pagedUsers.map((userData, index) => {
                  const isSelected = selectedUsers.has(userData.email)
                  const role = getRoleConfig(userData.user.role)
                  const status = getStatusConfig(userData.user.status || "active")
                  const RoleIcon = role.icon
                  const StatusIcon = status.icon

                  return (
                    <motion.div
                      key={userData.email}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2, delay: index * 0.05 }}
                      onClick={() => toggleSelection(userData.email)}
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
                            userData.user.status === "active"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-slate-100 text-slate-600"
                          )}>
                            {userData.user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-semibold text-foreground truncate">{userData.user.name}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge
                                variant="outline"
                                className={cn(
                                  "border-0 px-2 py-0.5 text-xs",
                                  role.bg,
                                  role.text
                                )}
                              >
                                <RoleIcon className="h-3 w-3 mr-1" />
                                {role.label}
                              </Badge>
                            </div>
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
                          <Mail className="h-4 w-4 shrink-0" />
                          <span className="truncate">{userData.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <StatusIcon className={cn("h-4 w-4", status.text)} />
                          <span className={status.text}>{status.label}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground text-xs pt-2 border-t">
                          <Calendar className="h-3 w-3 shrink-0" />
                          Cadastrado em {userData.user.createdAt ? format(new Date(userData.user.createdAt), "dd/MM/yyyy", { locale: ptBR }) : "-"}
                        </div>
                      </div>

                      <div className={cn(
                        "absolute top-4 right-4 transition-opacity duration-200 flex gap-1",
                        "opacity-0 group-hover:opacity-100"
                      )}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button
                              variant="secondary"
                              size="icon"
                              className="h-8 w-8 shadow-sm"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={() => setViewingUser(userData)}>
                              <Eye className="h-4 w-4 mr-2" />
                              Ver detalhes
                            </DropdownMenuItem>
                            {canManage && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => setEditingUser(userData)}>
                                  <Pencil className="h-4 w-4 mr-2" />
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleToggleStatus(userData)}>
                                  {userData.user.status === "active" ? (
                                    <>
                                      <PowerOff className="h-4 w-4 mr-2 text-red-500" />
                                      <span className="text-red-500">Desativar</span>
                                    </>
                                  ) : (
                                    <>
                                      <Power className="h-4 w-4 mr-2 text-emerald-500" />
                                      <span className="text-emerald-500">Ativar</span>
                                    </>
                                  )}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setResetPasswordEmail(userData.email)}>
                                  <Lock className="h-4 w-4 mr-2" />
                                  Resetar senha
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => setDeleteEmail(userData.email)}
                                  disabled={!canDelete(userData.email)}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Excluir
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>

            {filteredUsers.length === 0 && (
              <div className="flex flex-col items-center gap-3 text-muted-foreground p-12">
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                  <User className="h-8 w-8 opacity-50" />
                </div>
                <div className="text-center">
                  <p className="font-medium">Nenhum usuário encontrado</p>
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
        <div className="grid gap-3 sm:grid-cols-2">
          <AnimatePresence>
            {pagedUsers.map((userData, index) => {
              const isSelected = selectedUsers.has(userData.email)
              const role = getRoleConfig(userData.user.role)
              const status = getStatusConfig(userData.user.status || "active")
              const RoleIcon = role.icon
              const StatusIcon = status.icon

              return (
                <motion.div
                  key={userData.email}
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
                      onClick={() => toggleSelection(userData.email)}
                      className={cn(
                        "h-10 w-10 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors cursor-pointer",
                        isSelected
                          ? "bg-primary text-primary-foreground"
                          : userData.user.status === "active"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-slate-100 text-slate-600"
                      )}
                    >
                      {isSelected ? (
                        <Check className="h-5 w-5" />
                      ) : (
                        userData.user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground text-sm leading-tight truncate">
                        {userData.user.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge
                          variant="outline"
                          className={cn(
                            "border-0 px-1.5 py-0 text-[10px] font-medium",
                            role.bg,
                            role.text
                          )}
                        >
                          <RoleIcon className="h-3 w-3 mr-1" />
                          {role.label}
                        </Badge>
                      </div>
                    </div>

                    {/* Menu de ações simplificado */}
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 -mr-2"
                        onClick={() => setViewingUser(userData)}
                      >
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </div>
                  </div>

                  {/* Informações principais */}
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between py-1.5 border-b border-border/50">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5" />
                        Email
                      </span>
                      <span className="text-foreground truncate max-w-37.5">{userData.email}</span>
                    </div>
                    
                    <div className="flex items-center justify-between py-1.5 border-b border-border/50">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <StatusIcon className="h-3.5 w-3.5" />
                        Status
                      </span>
                      <Badge
                        variant="outline"
                        className={cn(
                          "border-0 px-1.5 py-0 text-[10px]",
                          status.bg,
                          status.text
                        )}
                      >
                        {status.label}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between py-1.5">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        Cadastro
                      </span>
                      <span className="text-foreground">
                        {userData.user.createdAt ? format(new Date(userData.user.createdAt), "dd/MM/yyyy", { locale: ptBR }) : "-"}
                      </span>
                    </div>
                  </div>

                  {/* Botões de ação para mobile */}
                  {canManage && (
                    <div className="flex gap-2 mt-3 pt-3 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 h-9 text-xs"
                        onClick={() => setEditingUser(userData)}
                      >
                        <Pencil className="h-3.5 w-3.5 mr-1.5" />
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className={cn(
                          "flex-1 h-9 text-xs",
                          userData.user.status === "active" 
                            ? "bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
                            : "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
                        )}
                        onClick={() => handleToggleStatus(userData)}
                      >
                        {userData.user.status === "active" ? (
                          <>
                            <PowerOff className="h-3.5 w-3.5 mr-1.5" />
                            Desativar
                          </>
                        ) : (
                          <>
                            <Power className="h-3.5 w-3.5 mr-1.5" />
                            Ativar
                          </>
                        )}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="h-9 w-9 p-0"
                        onClick={() => setDeleteEmail(userData.email)}
                        disabled={!canDelete(userData.email)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>

        {/* Empty State Mobile */}
        {filteredUsers.length === 0 && (
          <div className="flex flex-col items-center gap-3 text-muted-foreground p-8">
            <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center">
              <User className="h-7 w-7 opacity-50" />
            </div>
            <div className="text-center">
              <p className="font-medium text-sm">Nenhum usuário encontrado</p>
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
      <Dialog open={!!viewingUser} onOpenChange={() => setViewingUser(null)}>
        <DialogContent className="max-w-lg w-[calc(100vw-2rem)] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader className="space-y-3">
            <DialogTitle className="flex items-center gap-3 text-base sm:text-lg">
              <div className={cn(
                "h-10 w-10 sm:h-12 sm:w-12 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold shrink-0",
                viewingUser?.user.status === "active"
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-slate-100 text-slate-600"
              )}>
                {viewingUser?.user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <span className="leading-tight">{viewingUser?.user.name}</span>
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Detalhes completos do usuário
            </DialogDescription>
          </DialogHeader>

          {viewingUser && (
            <div className="space-y-4 sm:space-y-6 mt-4">
              {/* Status e Permissão */}
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">Status:</span>
                    <Badge
                      className={cn(
                        "px-2.5 py-1 text-xs",
                        viewingUser.user.status === "active"
                          ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                          : "bg-red-500/10 text-red-600 border-red-500/20"
                      )}
                    >
                      {viewingUser.user.status === "active" ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">Permissão:</span>
                    <Badge
                      className={cn(
                        "px-2.5 py-1 text-xs",
                        getRoleConfig(viewingUser.user.role).bg,
                        getRoleConfig(viewingUser.user.role).text,
                        getRoleConfig(viewingUser.user.role).border
                      )}
                    >
                      {getRoleLabel(viewingUser.user.role)}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Informações */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="p-3 bg-muted/30 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    Email
                  </p>
                  <p className="font-mono text-sm text-foreground break-all">{viewingUser.email}</p>
                </div>
                <div className="p-3 bg-muted/30 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Nome completo</p>
                  <p className="text-sm text-foreground">{viewingUser.user.name}</p>
                </div>
              </div>

              {/* Datas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 border-t pt-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Cadastro
                  </p>
                  <p className="text-sm text-foreground">
                    {viewingUser.user.createdAt ? format(new Date(viewingUser.user.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : "-"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Último acesso</p>
                  <p className="text-sm text-foreground">
                    {viewingUser.user.lastLogin ? format(new Date(viewingUser.user.lastLogin), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : "Nunca"}
                  </p>
                </div>
              </div>

              {/* Ações */}
              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                {canManage && canChangeRole(viewingUser.email) && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 h-10 sm:h-11"
                      onClick={() => {
                        setViewingUser(null)
                        setEditingUser(viewingUser)
                      }}
                    >
                      <Pencil className="h-4 w-4 mr-2" />
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 h-10 sm:h-11"
                      onClick={() => handleToggleStatus(viewingUser)}
                    >
                      {viewingUser.user.status === "active" ? (
                        <>
                          <PowerOff className="h-4 w-4 mr-2 text-red-500" />
                          Desativar
                        </>
                      ) : (
                        <>
                          <Power className="h-4 w-4 mr-2 text-emerald-500" />
                          Ativar
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 h-10 sm:h-11"
                      onClick={() => setResetPasswordEmail(viewingUser.email)}
                    >
                      <Lock className="h-4 w-4 mr-2" />
                      Resetar senha
                    </Button>
                  </>
                )}
                <Button
                  variant="secondary"
                  size="sm"
                  className="flex-1 h-10 sm:h-11"
                  onClick={() => setViewingUser(null)}
                >
                  Fechar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de Editar Usuário - Responsivo */}
      <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
        <DialogContent className="max-w-lg w-[calc(100vw-2rem)] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">Editar Usuário</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Atualize as informações de {editingUser?.user.name}
            </DialogDescription>
          </DialogHeader>
          
          {editingUser && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nome</label>
                <Input 
                  defaultValue={editingUser.user.name}
                  placeholder="Nome completo"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input 
                  defaultValue={editingUser.email}
                  placeholder="email@exemplo.com"
                  disabled
                />
                <p className="text-xs text-muted-foreground">O email não pode ser alterado</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Permissão</label>
                <Select
                  defaultValue={editingUser.user.role}
                  onValueChange={(value) => handleRoleChange(editingUser.email, value as "viewer" | "editor" | "admin")}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="viewer">Visualizador</SelectItem>
                    <SelectItem value="editor">Editor</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select
                  defaultValue={editingUser.user.status || "active"}
                  onValueChange={(value) => {
                    updateUser(editingUser.email, { status: value as UserStatus })
                    toast.success("Status atualizado")
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="inactive">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 pt-4">
                <Button 
                  className="flex-1 h-10 sm:h-11"
                  onClick={() => {
                    toast.success("Usuário atualizado")
                    setEditingUser(null)
                  }}
                >
                  Salvar alterações
                </Button>
                <Button 
                  variant="outline"
                  className="flex-1 h-10 sm:h-11"
                  onClick={() => setEditingUser(null)}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* AlertDialog de Excluir - Responsivo */}
      <AlertDialog open={!!deleteEmail} onOpenChange={() => setDeleteEmail(null)}>
        <AlertDialogContent className="w-[calc(100vw-2rem)] max-w-md p-4 sm:p-6">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base">Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita e todos os dados associados serão perdidos.
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

      {/* AlertDialog de Resetar Senha - Responsivo */}
      <AlertDialog open={!!resetPasswordEmail} onOpenChange={() => setResetPasswordEmail(null)}>
        <AlertDialogContent className="w-[calc(100vw-2rem)] max-w-md p-4 sm:p-6">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-base">
              <Lock className="h-5 w-5" />
              Resetar senha
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              Um email será enviado para <strong>{resetPasswordEmail}</strong> com instruções para criar uma nova senha. Deseja continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel className="mt-0 sm:mt-0 h-10 sm:h-11">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleResetPassword}
              className="bg-primary text-primary-foreground hover:bg-primary/90 h-10 sm:h-11"
            >
              Enviar email
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}