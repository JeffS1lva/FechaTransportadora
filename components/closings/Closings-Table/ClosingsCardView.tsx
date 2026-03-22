// components/closings/ClosingsCardView.tsx
"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, Calendar as CalendarIcon, Package, DollarSign, Clock, FileText, Eye, CheckCircle, Banknote, Trash2, RotateCcw, Pencil } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Closing } from "@/lib/types"
import { statusConfig } from "@/components/closings/closings-table"
import { formatSafeDate } from "@/lib/utils"
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination"

interface ClosingsCardViewProps {
  closings: Closing[]
  filteredCount: number
  selectedClosings: Set<string>
  canManage: boolean
  currentPage: number
  totalPages: number
  visiblePages: (number | string)[]
  view: "desktop" | "mobile"
  toggleSelection: (id: string) => void
  setViewClosing: (c: Closing) => void
  setDeleteId: (id: string) => void
  setEditClosing: (c: Closing) => void
  setCurrentPage: (p: number) => void
  handleApprove: (id: string) => void
  handleMarkPaid: (id: string) => void
}

export function ClosingsCardView(props: ClosingsCardViewProps) {
  const { closings, filteredCount, selectedClosings, canManage, view } = props
  const { toggleSelection, setViewClosing, setDeleteId, setEditClosing, handleApprove, handleMarkPaid } = props

  if (closings.length === 0) return <EmptyState {...props} />

  return (
    <>
      <div className={cn("grid gap-4", view === "desktop" ? "min-[1300px]:grid-cols-2 2xl:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-2")}>
        <AnimatePresence>
          {closings.map((closing, index) => (
            <Card 
              key={closing.id} 
              closing={closing} 
              isSelected={selectedClosings.has(closing.id)}
              index={index}
              view={view}
              {...{ toggleSelection, setViewClosing, setDeleteId, setEditClosing, handleApprove, handleMarkPaid, canManage }}
            />
          ))}
        </AnimatePresence>
      </div>
      <PaginationComponent {...props} />
    </>
  )
}

function Card({ closing, isSelected, index, view, toggleSelection, setViewClosing, setDeleteId, setEditClosing, handleApprove, handleMarkPaid, canManage }: any) {
  const status = statusConfig[closing.status as keyof typeof statusConfig]
  const initials = closing.driverName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
  
  const isDesktop = view === "desktop"
  
  return (
    <motion.div
      layout
      initial={{ opacity: 0, [isDesktop ? "scale" : "y"]: isDesktop ? 0.95 : 20 }}
      animate={{ opacity: 1, [isDesktop ? "scale" : "y"]: isDesktop ? 1 : 0 }}
      exit={{ opacity: 0, [isDesktop ? "scale" : "y"]: isDesktop ? 0.95 : -20 }}
      transition={{ duration: 0.2, delay: index * 0.05 }}
      onClick={() => isDesktop && toggleSelection(closing.id)}
      className={cn(
        "relative rounded-xl border-2 transition-all",
        isDesktop ? "p-5 cursor-pointer" : "p-4 active:scale-[0.98]",
        isSelected ? "border-primary bg-primary/5 shadow-md" : isDesktop ? "border-border bg-card hover:border-muted-foreground/30 hover:shadow-sm" : "border-border bg-card shadow-sm"
      )}
    >
      {isDesktop ? (
        <DesktopCardContent {...{ closing, isSelected, status, initials, setViewClosing, setDeleteId, setEditClosing, handleApprove, handleMarkPaid, canManage }} />
      ) : (
        <MobileCardContent {...{ closing, isSelected, status, initials, toggleSelection, setViewClosing, setDeleteId, setEditClosing, handleApprove, handleMarkPaid, canManage }} />
      )}
    </motion.div>
  )
}

function DesktopCardContent({ closing, isSelected, status, initials, setViewClosing, setDeleteId, setEditClosing, handleApprove, handleMarkPaid, canManage }: any) {
  return (
    <>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={cn("h-12 w-12 rounded-full flex items-center justify-center text-sm font-bold shrink-0", closing.status === "paid" ? "bg-emerald-100 text-emerald-700" : closing.status === "approved" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700")}>
            {initials}
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-foreground truncate">{closing.driverName}</h3>
            <Badge variant="outline" className={cn("mt-1 border-0 px-2 py-0.5 text-xs", status.bg, status.text)}>
              <span className={cn("w-1 h-1 rounded-full mr-1", status.dot)} />{status.label}
            </Badge>
          </div>
        </div>
        {isSelected && <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center shrink-0"><Check className="h-4 w-4 text-primary-foreground" /></div>}
      </div>
      
      <div className="space-y-2 text-sm">
        <InfoRow icon={CalendarIcon} text={`${formatSafeDate(closing.period.start)} - ${formatSafeDate(closing.period.end)}`} />
        <InfoRow icon={Package} text={`${closing.deliveries.completed}/${closing.deliveries.total} entregas`} />
        <InfoRow icon={DollarSign} text={new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(closing.financial.netValue)} highlight />
        <InfoRow icon={Clock} text={`${closing.hours.total}h trabalhadas`} />
        <div className="flex items-center gap-2 text-muted-foreground text-xs pt-2 border-t">
          <FileText className="h-3 w-3 shrink-0" /> Criado em {formatSafeDate(closing.createdAt, "dd/MM/yyyy")}
        </div>
      </div>

      <div className={cn("absolute top-4 right-4 transition-opacity duration-200 flex gap-1", "opacity-0 group-hover:opacity-100")}>
        <Button variant="secondary" size="icon" className="h-8 w-8 shadow-sm" onClick={(e) => { e.stopPropagation(); setViewClosing(closing) }}><Eye className="h-4 w-4" /></Button>
        {canManage && closing.status !== "paid" && (
          <Button variant="secondary" size="icon" className="h-8 w-8 shadow-sm bg-slate-100 hover:bg-slate-200 text-slate-700" onClick={(e) => { e.stopPropagation(); setEditClosing(closing) }}><Pencil className="h-4 w-4" /></Button>
        )}
        {canManage && (
          <>
            {closing.status === "pending" && <Button variant="secondary" size="icon" className="h-8 w-8 shadow-sm bg-blue-100 hover:bg-blue-200 text-blue-700" onClick={(e) => { e.stopPropagation(); handleApprove(closing.id) }}><CheckCircle className="h-4 w-4" /></Button>}
            {closing.status === "approved" && <Button variant="secondary" size="icon" className="h-8 w-8 shadow-sm bg-emerald-100 hover:bg-emerald-200 text-emerald-700" onClick={(e) => { e.stopPropagation(); handleMarkPaid(closing.id) }}><Banknote className="h-4 w-4" /></Button>}
            <Button variant="destructive" size="icon" className="h-8 w-8 shadow-sm" onClick={(e) => { e.stopPropagation(); setDeleteId(closing.id) }}><Trash2 className="h-4 w-4" /></Button>
          </>
        )}
      </div>
    </>
  )
}

function MobileCardContent({ closing, isSelected, status, initials, toggleSelection, setViewClosing, setDeleteId, setEditClosing, handleApprove, handleMarkPaid, canManage }: any) {
  return (
    <>
      <div className="flex items-start gap-3 mb-3">
        <div onClick={() => toggleSelection(closing.id)} className={cn("h-10 w-10 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors cursor-pointer", isSelected ? "bg-primary text-primary-foreground" : closing.status === "paid" ? "bg-emerald-100 text-emerald-700" : closing.status === "approved" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700")}>
          {isSelected ? <Check className="h-5 w-5" /> : initials}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground text-sm leading-tight truncate">{closing.driverName}</h3>
          <Badge variant="outline" className={cn("border-0 px-1.5 py-0 text-[10px] font-medium mt-1", status.bg, status.text)}>
            <span className={cn("w-1 h-1 rounded-full mr-1", status.dot)} />{status.label}
          </Badge>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2" onClick={() => setViewClosing(closing)}><Eye className="h-4 w-4 text-muted-foreground" /></Button>
      </div>

      <div className="space-y-2 text-xs">
        <MobileInfoRow icon={CalendarIcon} label="Período" value={`${formatSafeDate(closing.period.start, "dd/MM")} - ${formatSafeDate(closing.period.end, "dd/MM")}`} />
        <MobileInfoRow icon={Package} label="Entregas" value={`${closing.deliveries.completed}/${closing.deliveries.total}`} bold />
        <MobileInfoRow icon={DollarSign} label="Valor Líquido" value={new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(closing.financial.netValue)} valueClass="text-emerald-600" />
        <MobileInfoRow icon={Clock} label="Horas" value={`${closing.hours.total}h`} last />
      </div>

      {canManage && (
        <div className="flex gap-2 mt-3 pt-3 border-t">
          {closing.status !== "paid" && (
            <Button variant="outline" size="sm" className="flex-1 h-9 text-xs bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100" onClick={() => setEditClosing(closing)}><Pencil className="h-3.5 w-3.5 mr-1.5" /> Editar</Button>
          )}
          {closing.status === "pending" && <Button variant="outline" size="sm" className="flex-1 h-9 text-xs bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100" onClick={() => handleApprove(closing.id)}><CheckCircle className="h-3.5 w-3.5 mr-1.5" /> Aprovar</Button>}
          {closing.status === "approved" && <Button variant="outline" size="sm" className="flex-1 h-9 text-xs bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100" onClick={() => handleMarkPaid(closing.id)}><Banknote className="h-3.5 w-3.5 mr-1.5" /> Pagar</Button>}
          <Button variant="destructive" size="sm" className={cn("h-9 text-xs", closing.status === "pending" || closing.status === "approved" ? "flex-1" : "w-full")} onClick={() => setDeleteId(closing.id)}><Trash2 className="h-3.5 w-3.5 mr-1.5" /> Excluir</Button>
        </div>
      )}
    </>
  )
}

function InfoRow({ icon: Icon, text, highlight }: { icon: any; text: string; highlight?: boolean }) {
  return (
    <div className="flex items-center gap-2 text-muted-foreground">
      <Icon className="h-4 w-4 shrink-0" />
      <span className={cn("text-xs", highlight && "font-medium text-foreground")}>{text}</span>
    </div>
  )
}

function MobileInfoRow({ icon: Icon, label, value, valueClass, bold, last }: { icon: any; label: string; value: string; valueClass?: string; bold?: boolean; last?: boolean }) {
  return (
    <div className={cn("flex items-center justify-between py-1.5", !last && "border-b border-border/50")}>
      <span className="text-muted-foreground flex items-center gap-1.5"><Icon className="h-3.5 w-3.5" /> {label}</span>
      <span className={cn("text-foreground", bold && "font-medium", valueClass)}>{value}</span>
    </div>
  )
}

function EmptyState({ filteredCount, clearFilters }: any) {
  return (
    <div className="flex flex-col items-center gap-3 text-muted-foreground p-8">
      <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center"><FileText className="h-7 w-7 opacity-50" /></div>
      <div className="text-center">
        <p className="font-medium text-sm">Nenhum fechamento encontrado</p>
        <p className="text-xs mt-1">Tente ajustar seus filtros</p>
      </div>
      {filteredCount === 0 && <Button variant="outline" size="sm" className="mt-2 text-xs"><RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Limpar filtros</Button>}
    </div>
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