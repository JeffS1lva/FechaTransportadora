// components/closings/ClosingsListView.tsx
"use client"

import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, ArrowUpDown, FileText, RotateCcw, Calendar as CalendarIcon, Package, DollarSign, Clock, CheckCircle, Banknote, Trash2, Eye, Pencil } from "lucide-react"
import { AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import type { Closing } from "@/lib/types"
import type { SortField, SortOrder } from "@/components/closings/closings-table"
import { statusConfig } from "@/components/closings/closings-table"
import { formatSafeDate } from "@/lib/utils"
import {
  Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious,
} from "@/components/ui/pagination"

interface ClosingsListViewProps {
  closings: Closing[]
  filteredCount: number
  selectedClosings: Set<string>
  sortField: SortField
  sortOrder: SortOrder
  canManage: boolean
  currentPage: number
  totalPages: number
  visiblePages: (number | string)[]
  toggleSort: (f: SortField) => void
  toggleSelection: (id: string) => void
  selectAll: () => void
  setViewClosing: (c: Closing) => void
  setDeleteId: (id: string) => void
  setEditClosing: (c: Closing) => void
  setCurrentPage: (p: number) => void
  handleApprove: (id: string) => void
  handleMarkPaid: (id: string) => void
}

export function ClosingsListView(props: ClosingsListViewProps) {
  const { closings, filteredCount, selectedClosings, sortField, sortOrder, canManage, currentPage, totalPages, visiblePages } = props
  const { toggleSort, toggleSelection, selectAll, setViewClosing, setDeleteId, setEditClosing, setCurrentPage, handleApprove, handleMarkPaid } = props

  const SortHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <button onClick={() => toggleSort(field)} className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground uppercase tracking-wider">
      {children} <ArrowUpDown className={cn("h-3 w-3 transition-colors", sortField === field ? "text-primary" : "text-muted-foreground")} />
    </button>
  )

  const EmptyState = () => (
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
        </div>
      </TableCell>
    </TableRow>
  )

  return (
    <>
      <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b bg-muted/50">
                <TableHead className="w-12 p-4">
                  <button onClick={selectAll} className={cn("w-5 h-5 rounded border flex items-center justify-center transition-colors", selectedClosings.size === filteredCount && filteredCount > 0 ? "bg-primary border-primary text-primary-foreground" : "border-input hover:border-primary")}>
                    {selectedClosings.size === filteredCount && filteredCount > 0 && <Check className="h-3 w-3" />}
                  </button>
                </TableHead>
                <TableHead className="text-left p-4"><SortHeader field="driverName">Motorista</SortHeader></TableHead>
                <TableHead className="text-left p-4"><SortHeader field="period">Período</SortHeader></TableHead>
                <TableHead className="text-left p-4"><SortHeader field="deliveries">Entregas</SortHeader></TableHead>
                <TableHead className="text-left p-4"><SortHeader field="netValue">Valor Líquido</SortHeader></TableHead>
                <TableHead className="text-left p-4"><SortHeader field="hours">Horas</SortHeader></TableHead>
                <TableHead className="text-left p-4"><SortHeader field="status">Status</SortHeader></TableHead>
                {canManage && <TableHead className="w-16 p-4"></TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y">
              <AnimatePresence>
                {closings.length === 0 ? <EmptyState /> : closings.map(c => (
                  <Row key={c.id} closing={c} isSelected={selectedClosings.has(c.id)} {...{ toggleSelection, setViewClosing, setDeleteId, setEditClosing, handleApprove, handleMarkPaid, canManage }} />
                ))}
              </AnimatePresence>
            </TableBody>
          </Table>
        </div>
      </div>
      <PaginationComponent {...{ currentPage, totalPages, visiblePages, setCurrentPage }} />
    </>
  )
}

function Row({ closing, isSelected, toggleSelection, setViewClosing, setDeleteId, setEditClosing, handleApprove, handleMarkPaid, canManage }: any) {
  const status = statusConfig[closing.status as keyof typeof statusConfig]
  const initials = closing.driverName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
  
  return (
    <tr className={cn("group transition-colors", isSelected ? "bg-primary/5" : "hover:bg-muted/50")}>
      <TableCell className="p-4">
        <button onClick={() => toggleSelection(closing.id)} className={cn("w-5 h-5 rounded border flex items-center justify-center transition-all", isSelected ? "bg-primary border-primary text-primary-foreground" : "border-input group-hover:border-primary")}>
          {isSelected && <Check className="h-3 w-3" />}
        </button>
      </TableCell>
      <TableCell className="p-4">
        <div className="flex items-center gap-3">
          <div className={cn("h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0", closing.status === "paid" ? "bg-emerald-100 text-emerald-700" : closing.status === "approved" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700")}>
            {initials}
          </div>
          <p className="font-medium text-foreground truncate">{closing.driverName}</p>
        </div>
      </TableCell>
      <TableCell className="p-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground whitespace-nowrap">
          <CalendarIcon className="h-3.5 w-3.5 shrink-0" />
          <span>{formatSafeDate(closing.period.start)} - {formatSafeDate(closing.period.end)}</span>
        </div>
      </TableCell>
      <TableCell className="p-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0"><Package className="h-4 w-4 text-muted-foreground" /></div>
          <div>
            <p className="text-sm font-medium">{closing.deliveries.completed}/{closing.deliveries.total}</p>
            <p className="text-xs text-muted-foreground">entregas</p>
          </div>
        </div>
      </TableCell>
      <TableCell className="p-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0"><DollarSign className="h-4 w-4 text-muted-foreground" /></div>
          <div>
            <p className="text-sm font-medium whitespace-nowrap">{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(closing.financial.netValue)}</p>
            <p className="text-xs text-muted-foreground">líquido</p>
          </div>
        </div>
      </TableCell>
      <TableCell className="p-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground"><Clock className="h-3.5 w-3.5 shrink-0" /><span>{closing.hours.total}h</span></div>
      </TableCell>
      <TableCell className="p-4">
        <Badge variant="outline" className={cn("border-0 px-2.5 py-1 font-medium text-xs", status.bg, status.text, status.border)}>
          <span className={cn("w-1.5 h-1.5 rounded-full mr-1.5", status.dot)} />{status.label}
        </Badge>
      </TableCell>
      {canManage && (
        <TableCell className="p-4">
          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setViewClosing(closing)}><Eye className="h-4 w-4" /></Button>
            {closing.status !== "paid" && (
              <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-600 hover:text-slate-800" onClick={(e) => { e.stopPropagation(); setEditClosing(closing) }}>
                <Pencil className="h-4 w-4" />
              </Button>
            )}
            {closing.status === "pending" && <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600" onClick={() => handleApprove(closing.id)}><CheckCircle className="h-4 w-4" /></Button>}
            {closing.status === "approved" && <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-600" onClick={() => handleMarkPaid(closing.id)}><Banknote className="h-4 w-4" /></Button>}
            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteId(closing.id)}><Trash2 className="h-4 w-4" /></Button>
          </div>
        </TableCell>
      )}
    </tr>
  )
}

function PaginationComponent({ currentPage, totalPages, visiblePages, setCurrentPage }: any) {
  if (totalPages <= 1) return null
  return (
    <div className="flex justify-center min-[1300px]:justify-end mt-4">
      <Pagination className="flex-wrap gap-2">
        <PaginationContent className="flex-wrap justify-center">
          <PaginationItem>
            <PaginationPrevious href="#" onClick={(e) => { e.preventDefault(); setCurrentPage(Math.max(1, currentPage - 1)) }} className={cn("h-9 w-9 min-[1300px]:h-auto min-[1300px]:w-auto p-0 min-[1300px]:px-4", currentPage === 1 && "pointer-events-none opacity-50")} />
          </PaginationItem>
          <div className="flex flex-wrap justify-center gap-1">
            {visiblePages.map((page: any, i: number) => (
              <PaginationItem key={`${page}-${i}`}>
                {page === 'ellipsis-start' || page === 'ellipsis-end' ? <PaginationEllipsis className="h-9 w-9" /> : (
                  <PaginationLink href="#" isActive={currentPage === page} onClick={(e) => { e.preventDefault(); setCurrentPage(Number(page)) }} className="h-9 w-9 min-[1300px]:h-auto min-[1300px]:w-auto min-[1300px]:px-3 text-sm">{page}</PaginationLink>
                )}
              </PaginationItem>
            ))}
          </div>
          <PaginationItem>
            <PaginationNext href="#" onClick={(e) => { e.preventDefault(); setCurrentPage(Math.min(totalPages, currentPage + 1)) }} className={cn("h-9 w-9 min-[1300px]:h-auto min-[1300px]:w-auto p-0 min-[1300px]:px-4", currentPage === totalPages && "pointer-events-none opacity-50")} />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  )
}