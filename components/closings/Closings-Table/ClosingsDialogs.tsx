"use client"

import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar as CalendarIcon, Package, TrendingUp, Wallet, Clock, FileText, CheckCircle, Banknote, Pencil } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Closing } from "@/lib/types"
import { statusConfig } from "@/components/closings/closings-table"
import { formatSafeDate } from "@/lib/utils"

interface ClosingsDialogsProps {
  viewClosing: Closing | null
  setViewClosing: (c: Closing | null) => void
  deleteId: string | null
  setDeleteId: (id: string | null) => void
  canManage: boolean
  handleApprove: (id: string) => void
  handleMarkPaid: (id: string) => void
  handleDelete: () => void
  setEditClosing: (c: Closing | null) => void
}

export function ClosingsDialogs({ viewClosing, setViewClosing, deleteId, setDeleteId, canManage, handleApprove, handleMarkPaid, handleDelete, setEditClosing }: ClosingsDialogsProps) {
  return (
    <>
      <Dialog open={!!viewClosing} onOpenChange={() => setViewClosing(null)}>
        <DialogContent className="max-w-lg w-[calc(100vw-2rem)] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader className="space-y-3">
            <DialogTitle className="flex items-center gap-3 text-base sm:text-lg">
              <div className={cn("h-10 w-10 sm:h-12 sm:w-12 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold shrink-0", viewClosing?.status === "paid" ? "bg-emerald-100 text-emerald-700" : viewClosing?.status === "approved" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700")}>
                {viewClosing?.driverName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <span className="leading-tight">{viewClosing?.driverName}</span>
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">Detalhes completos do fechamento</DialogDescription>
          </DialogHeader>

          {viewClosing && <ViewContent closing={viewClosing} canManage={canManage} onApprove={() => { handleApprove(viewClosing.id); setViewClosing(null) }} onPay={() => { handleMarkPaid(viewClosing.id); setViewClosing(null) }} onClose={() => setViewClosing(null)} onEdit={() => { setViewClosing(null); setEditClosing(viewClosing) }} />}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="w-[calc(100vw-2rem)] max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base">Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription className="text-sm">Tem certeza que deseja excluir este fechamento? Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel className="mt-0 sm:mt-0 h-10 sm:h-11">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 h-10 sm:h-11">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

function ViewContent({ closing, canManage, onApprove, onPay, onClose, onEdit }: { closing: Closing; canManage: boolean; onApprove: () => void; onPay: () => void; onClose: () => void; onEdit: () => void }) {
  const status = statusConfig[closing.status]
  
  return (
    <div className="space-y-4 sm:space-y-6 mt-4">
      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
        <span className="text-sm font-medium text-foreground">Status</span>
        <Badge className={cn("px-2.5 py-1 text-xs", status.bg, status.text, status.border)}>{status.label}</Badge>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <InfoBox icon={CalendarIcon} label="Início" value={formatSafeDate(closing.period.start, "dd/MM/yyyy")} />
        <InfoBox icon={CalendarIcon} label="Fim" value={formatSafeDate(closing.period.end, "dd/MM/yyyy")} />
      </div>

      <div className="p-3 bg-muted/30 rounded-lg">
        <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1"><Package className="h-3 w-3" /> Entregas</p>
        <div className="flex justify-between items-center">
          <span className="text-sm text-foreground">Completadas</span>
          <span className="text-xl sm:text-2xl font-bold text-primary">{closing.deliveries.completed}/{closing.deliveries.total}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <InfoBox icon={TrendingUp} label="Valor Bruto" value={new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(closing.financial.grossValue)} />
        <InfoBox icon={Wallet} label="Valor Líquido" value={new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(closing.financial.netValue)} valueClass="font-bold text-emerald-600" />
      </div>

      <div className="p-3 bg-muted/30 rounded-lg">
        <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1"><Clock className="h-3 w-3" /> Horas Trabalhadas</p>
        <p className="text-xl sm:text-2xl font-bold text-foreground">{closing.hours.total}h</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 border-t pt-4">
        <InfoBox icon={FileText} label="Criado em" value={formatSafeDate(closing.createdAt, "dd/MM/yyyy")} />
        <div>
          <p className="text-xs text-muted-foreground mb-1">ID</p>
          <p className="font-mono text-xs text-muted-foreground truncate">{closing.id.slice(0, 12)}...</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 pt-2">
        {canManage && closing.status !== "paid" && (
          <Button variant="outline" size="sm" className="flex-1 h-10 sm:h-11" onClick={onEdit}>
            <Pencil className="h-4 w-4 mr-2" /> Editar
          </Button>
        )}
        {canManage && closing.status === "pending" && <Button variant="default" size="sm" className="flex-1 h-10 sm:h-11" onClick={onApprove}><CheckCircle className="h-4 w-4 mr-2" /> Aprovar</Button>}
        {canManage && closing.status === "approved" && <Button variant="default" size="sm" className="flex-1 h-10 sm:h-11 bg-emerald-600 hover:bg-emerald-700" onClick={onPay}><Banknote className="h-4 w-4 mr-2" /> Marcar como Pago</Button>}
        <Button variant="outline" size="sm" className="flex-1 h-10 sm:h-11" onClick={onClose}>Fechar</Button>
      </div>
    </div>
  )
}

function InfoBox({ icon: Icon, label, value, valueClass }: { icon: any; label: string; value: string; valueClass?: string }) {
  return (
    <div className="p-3 bg-muted/30 rounded-lg">
      <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Icon className="h-3 w-3" /> {label}</p>
      <p className={cn("font-mono text-sm text-foreground", valueClass)}>{value}</p>
    </div>
  )
}