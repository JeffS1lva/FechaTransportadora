"use client"

import { useState, useMemo, useEffect } from "react"
import { useData } from "@/lib/data-context"
import { useAuth } from "@/lib/auth-context"
import { toast } from "sonner"
import type { Closing, ClosingFormData } from "@/lib/types"
import { ClosingsHeader } from "@/components/closings/Closings-Table/ClosingsHeader"
import { ClosingsListView } from "@/components/closings/Closings-Table/ClosingsListView"
import { ClosingsCardView } from "@/components/closings/Closings-Table/ClosingsCardView"
import { ClosingsDialogs } from "@/components/closings/Closings-Table/ClosingsDialogs"
import { ClosingEditDialog } from "@/components/closings/Closings-Table/ClosingEditDialog"

export type SortField = "driverName" | "period" | "deliveries" | "netValue" | "hours" | "status" | "createdAt"
export type SortOrder = "asc" | "desc"
export type ViewMode = "list" | "cards"

export interface Filters {
  search: string
  status: "all" | "pending" | "approved" | "paid"
  dateFrom: Date | undefined
  dateTo: Date | undefined
  driverId: string
}

export const statusConfig = {
  pending: { label: "Pendente", bg: "bg-amber-500/10", text: "text-amber-600", border: "border-amber-500/20", dot: "bg-amber-500" },
  approved: { label: "Aprovado", bg: "bg-blue-500/10", text: "text-blue-600", border: "border-blue-500/20", dot: "bg-blue-500" },
  paid: { label: "Pago", bg: "bg-emerald-500/10", text: "text-emerald-600", border: "border-emerald-500/20", dot: "bg-emerald-500" },
} as const

export function ClosingsTable() {
  const { closings, drivers, updateClosingStatus, deleteClosing, updateClosing } = useData()
  const { user } = useAuth()
  
  const [viewMode, setViewMode] = useState<ViewMode>("list")
  const [sortField, setSortField] = useState<SortField>("createdAt")
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc")
  const [selectedClosings, setSelectedClosings] = useState<Set<string>>(new Set())
  const [currentPage, setCurrentPage] = useState(1)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [viewClosing, setViewClosing] = useState<Closing | null>(null)
  const [editClosing, setEditClosing] = useState<Closing | null>(null)
  
  const [filters, setFilters] = useState<Filters>({
    search: "", status: "all", dateFrom: undefined, dateTo: undefined, driverId: "all"
  })

  const canManage = user?.role === "admin" || user?.role === "editor"
  const itemsPerPage = 8

  const filteredClosings = useMemo(() => {
    let result = closings.filter((closing) => {
      if (filters.search && !closing.driverName.toLowerCase().includes(filters.search.toLowerCase())) return false
      if (filters.status !== "all" && closing.status !== filters.status) return false
      if (filters.driverId !== "all" && closing.driverId !== filters.driverId) return false
      if (filters.dateFrom && new Date(closing.createdAt) < filters.dateFrom) return false
      if (filters.dateTo) {
        const endOfDay = new Date(filters.dateTo)
        endOfDay.setHours(23, 59, 59, 999)
        if (new Date(closing.createdAt) > endOfDay) return false
      }
      return true
    })

    result.sort((a, b) => {
      let comparison = 0
      switch (sortField) {
        case "driverName": comparison = a.driverName.localeCompare(b.driverName); break
        case "period": comparison = new Date(a.period.start).getTime() - new Date(b.period.start).getTime(); break
        case "deliveries": comparison = a.deliveries.completed - b.deliveries.completed; break
        case "netValue": comparison = a.financial.netValue - b.financial.netValue; break
        case "hours": comparison = a.hours.total - b.hours.total; break
        case "status": comparison = a.status.localeCompare(b.status); break
        case "createdAt": comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(); break
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

  useEffect(() => setCurrentPage(1), [filteredClosings.length])

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    else { setSortField(field); setSortOrder("asc") }
  }

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedClosings)
    newSelected.has(id) ? newSelected.delete(id) : newSelected.add(id)
    setSelectedClosings(newSelected)
  }

  const selectAll = () => {
    selectedClosings.size === filteredClosings.length 
      ? setSelectedClosings(new Set())
      : setSelectedClosings(new Set(filteredClosings.map(c => c.id)))
  }

  const clearFilters = () => setFilters({ search: "", status: "all", dateFrom: undefined, dateTo: undefined, driverId: "all" })

  const handleApprove = (id: string) => {
    updateClosingStatus(id, "approved", user?.name)
    toast.success("Fechamento aprovado")
  }

  const handleMarkPaid = (id: string) => {
    updateClosingStatus(id, "paid", user?.name)
    toast.success("Fechamento pago")
  }

  const handleDelete = () => {
    if (deleteId) {
      deleteClosing(deleteId)
      setDeleteId(null)
      toast.success("Fechamento excluído", {
        description: "O fechamento foi removido com sucesso.",
        style: { border: '1px solid #b91c1c', background: '#ef4444', color: '#ffffff' }
      })
    }
  }

  const handleEdit = (id: string, data: Partial<ClosingFormData>) => {
    updateClosing(id, data)
    toast.success("Fechamento atualizado com sucesso")
  }

  const visiblePages = useMemo(() => {
    const pages: (number | string)[] = []
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      pages.push(1)
      if (currentPage > 3) pages.push('ellipsis-start')
      const startPage = Math.max(2, currentPage - 1)
      const endPage = Math.min(totalPages - 1, currentPage + 1)
      for (let i = startPage; i <= endPage; i++) pages.push(i)
      if (currentPage < totalPages - 2) pages.push('ellipsis-end')
      pages.push(totalPages)
    }
    return pages
  }, [currentPage, totalPages])

  const commonProps = {
    closings: pagedClosings,
    filteredCount: filteredClosings.length,
    selectedClosings,
    sortField, sortOrder,
    canManage,
    currentPage, totalPages, visiblePages,
    toggleSort, toggleSelection, selectAll,
    setViewClosing, setDeleteId, setEditClosing, setCurrentPage,
    handleApprove, handleMarkPaid
  }

  return (
    <div className="space-y-4 min-[1300px]:px-0">
      <ClosingsHeader
        filters={filters}
        setFilters={setFilters}
        viewMode={viewMode}
        setViewMode={setViewMode}
        selectedCount={selectedClosings.size}
        filteredCount={filteredClosings.length}
        activeFiltersCount={[filters.status !== "all", filters.dateFrom, filters.dateTo, filters.driverId !== "all"].filter(Boolean).length}
        clearFilters={clearFilters}
        drivers={drivers}
      />
      
      <div className="hidden min-[1300px]:block">
        {viewMode === "list" ? <ClosingsListView {...commonProps} /> : <ClosingsCardView {...commonProps} view="desktop" />}
      </div>
      
      <div className="min-[1300px]:hidden">
        <ClosingsCardView {...commonProps} view="mobile" />
      </div>

      <ClosingsDialogs
        viewClosing={viewClosing}
        setViewClosing={setViewClosing}
        deleteId={deleteId}
        setDeleteId={setDeleteId}
        canManage={canManage}
        handleApprove={handleApprove}
        handleMarkPaid={handleMarkPaid}
        handleDelete={handleDelete}
        setEditClosing={setEditClosing}
      />

      <ClosingEditDialog
        closing={editClosing}
        open={!!editClosing}
        onOpenChange={(open) => !open && setEditClosing(null)}
        drivers={drivers}
        onSave={handleEdit}
        canManage={canManage}
      />
    </div>
  )
}