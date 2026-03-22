// components/closings/ClosingsHeader.tsx
"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import {
  Search, Filter, RotateCcw, ChevronDown, List, LayoutGrid, Calendar as CalendarIcon, X, FileText
} from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import type { Filters, ViewMode } from "@/components/closings/closings-table"
import { statusConfig } from "@/components/closings/closings-table"
import { useState } from "react"

interface FiltersBaseProps {
  filters: Filters
  setFilters: (f: Filters | ((prev: Filters) => Filters)) => void
  drivers: { id: string; name: string }[]
}

interface ClosingsHeaderProps {
  filters: Filters
  setFilters: (f: Filters | ((prev: Filters) => Filters)) => void
  viewMode: ViewMode
  setViewMode: (v: ViewMode) => void
  selectedCount: number
  filteredCount: number
  activeFiltersCount: number
  clearFilters: () => void
  drivers: { id: string; name: string }[]
}

interface FiltersPopoverProps extends FiltersBaseProps {
  activeFiltersCount: number
  clearFilters: () => void
}

interface ActiveFiltersProps extends FiltersBaseProps {
  clearFilters: () => void
}

export function ClosingsHeader({
  filters, setFilters, viewMode, setViewMode, selectedCount, filteredCount, activeFiltersCount, clearFilters, drivers
}: ClosingsHeaderProps) {
  return (
    <div className="flex flex-col gap-4 p-3 sm:p-4 bg-card rounded-xl border shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-0">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-semibold truncate">Fechamentos</h2>
            <p className="text-sm text-muted-foreground truncate">
              {filteredCount} {filteredCount === 1 ? 'registro' : 'registros'}
              {selectedCount > 0 && ` • ${selectedCount} selec.`}
            </p>
          </div>
        </div>
        <div className="hidden min-[1300px]:flex items-center gap-2">
          <div className="flex items-center bg-muted rounded-lg p-1 border">
            <button onClick={() => setViewMode("list")} className={cn("p-2 rounded-md transition-all", viewMode === "list" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}>
              <List className="h-4 w-4" />
            </button>
            <button onClick={() => setViewMode("cards")} className={cn("p-2 rounded-md transition-all", viewMode === "cards" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}>
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

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
          <FiltersPopover {...{ filters, setFilters, activeFiltersCount, clearFilters, drivers }} />
        </div>

        {activeFiltersCount > 0 && <ActiveFilters {...{ filters, setFilters, clearFilters, drivers }} />}
      </div>
    </div>
  )
}

function FiltersPopover({ filters, setFilters, activeFiltersCount, clearFilters, drivers }: FiltersPopoverProps) {
  const [open, setOpen] = useState(false)
  
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant={activeFiltersCount > 0 ? "default" : "outline"} size="sm" className="gap-2 shrink-0">
          <Filter className="h-4 w-4" />
          <span className="hidden sm:inline">Filtros</span>
          {activeFiltersCount > 0 && <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">{activeFiltersCount}</Badge>}
          <ChevronDown className="h-3 w-3" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[calc(100vw-2rem)] sm:w-80 p-4" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-sm">Filtros Avançados</h4>
            {activeFiltersCount > 0 && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 text-xs text-muted-foreground hover:text-foreground">
                <RotateCcw className="h-3 w-3 mr-1" /> Limpar
              </Button>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase">Status</label>
            <Select value={filters.status} onValueChange={(v) => setFilters(p => ({ ...p, status: v as any }))}>
              <SelectTrigger><SelectValue placeholder="Todos os status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="approved">Aprovado</SelectItem>
                <SelectItem value="paid">Pago</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase">Motorista</label>
            <Select value={filters.driverId} onValueChange={(v) => setFilters(p => ({ ...p, driverId: v }))}>
              <SelectTrigger><SelectValue placeholder="Todos os motoristas" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {drivers.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase">Período de Criação</label>
            <div className="grid grid-cols-2 gap-2">
              <DatePicker label="De" date={filters.dateFrom} onSelect={(d) => setFilters(p => ({ ...p, dateFrom: d }))} />
              <DatePicker label="Até" date={filters.dateTo} onSelect={(d) => setFilters(p => ({ ...p, dateTo: d }))} align="end" />
            </div>
          </div>

          <Button className="w-full" size="sm" onClick={() => setOpen(false)}>Aplicar Filtros</Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}

function DatePicker({ label, date, onSelect, align = "start" }: { label: string; date?: Date; onSelect: (d?: Date) => void; align?: "start" | "end" }) {
  const [open, setOpen] = useState(false)
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className={cn("justify-start text-left font-normal text-xs sm:text-sm", !date && "text-muted-foreground")}>
          <CalendarIcon className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
          {date ? format(date, "dd/MM/yy") : label}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align={align}>
        <Calendar mode="single" selected={date} onSelect={(d) => { onSelect(d); setOpen(false); }} initialFocus />
      </PopoverContent>
    </Popover>
  )
}

function ActiveFilters({ filters, setFilters, clearFilters, drivers }: ActiveFiltersProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {filters.status !== "all" && (
        <FilterBadge label={`Status: ${statusConfig[filters.status as keyof typeof statusConfig].label}`} onRemove={() => setFilters(p => ({ ...p, status: "all" }))} />
      )}
      {filters.driverId !== "all" && (
        <FilterBadge label={`Motorista: ${drivers.find(d => d.id === filters.driverId)?.name}`} onRemove={() => setFilters(p => ({ ...p, driverId: "all" }))} />
      )}
      {(filters.dateFrom || filters.dateTo) && (
        <FilterBadge 
          label={`Período: ${filters.dateFrom ? format(filters.dateFrom, "dd/MM") : "Início"} - ${filters.dateTo ? format(filters.dateTo, "dd/MM") : "Hoje"}`}
          onRemove={() => setFilters(p => ({ ...p, dateFrom: undefined, dateTo: undefined }))}
        />
      )}
    </div>
  )
}

function FilterBadge({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <Badge variant="secondary" className="gap-1 px-2 py-1 text-xs">
      {label}
      <button onClick={onRemove} className="ml-1 hover:bg-muted rounded-full p-0.5"><X className="h-3 w-3" /></button>
    </Badge>
  )
}