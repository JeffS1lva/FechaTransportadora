"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Truck,
  LayoutDashboard,
  Users,
  FileText,
  LogOut,
  Zap,
  Activity,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Sparkles,
  Settings,
} from "lucide-react"
import { useState, useEffect, useRef } from "react"

const adminNavItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, pulse: true },
  { href: "/motoristas", label: "Motoristas", icon: Users, pulse: false },
  { href: "/fechamentos", label: "Fechamentos", icon: FileText, pulse: true },
]

const usersNavItem = { href: "/usuarios", label: "Usuários", icon: Users, pulse: false }

const viewerNavItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, pulse: true },
  { href: "/fechamentos", label: "Fechamentos", icon: FileText, pulse: false },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [energyLevel, setEnergyLevel] = useState(100)
  const sidebarRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024)
      if (window.innerWidth >= 1024) {
        setMobileOpen(false)
      }
    }

    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
    }
    return () => {
      document.body.style.overflow = "unset"
    }
  }, [mobileOpen])

  // Efeito de energia pulsante
  useEffect(() => {
    const interval = setInterval(() => {
      setEnergyLevel(prev => {
        const change = Math.random() > 0.5 ? 2 : -2
        return Math.max(70, Math.min(100, prev + change))
      })
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  const handleMouseMove = (e: React.MouseEvent) => {
    if (sidebarRef.current) {
      const rect = sidebarRef.current.getBoundingClientRect()
      setMousePosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      })
    }
  }

  const isManager = user?.role === "admin" || user?.role === "editor"
  const isAdmin = user?.role === "admin"  // Nova verificação apenas para admin
  const navItems = isManager ? adminNavItems : viewerNavItems
  const usersNav = isManager ? usersNavItem : null

  const [settingsOpen, setSettingsOpen] = useState(false)

  const handleNavClick = () => {
    if (isMobile) {
      setMobileOpen(false)
    }
    setSettingsOpen(false)
  }

  return (
    <>
      {/* Mobile Header - Estilo Glassmorphism Elevado */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 z-50 flex items-center justify-between px-4">
        <div className="absolute inset-0 bg-linear-to-r from-background/80 via-background/60 to-background/80 backdrop-blur-xl border-b border-white/10" />
        <div className="relative flex items-center gap-3 z-10">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-primary via-primary to-primary/80 shadow-lg shadow-primary/20 ring-1 ring-white/20">
            <Truck className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="overflow-hidden">
            <h1 className="font-bold truncate text-sm bg-linear-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Fechamentos
            </h1>
            <p className="text-xs text-muted-foreground/80 truncate flex items-center gap-1">
              <Zap className="h-3 w-3 text-yellow-500" />
              Sistema Ativo
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="relative z-10 shrink-0 rounded-full bg-white/5 hover:bg-white/10 backdrop-blur-md"
        >
          {mobileOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </Button>
      </header>

      {/* Mobile Overlay com efeito de profundidade */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-all duration-500"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Principal - Liquid Rail Design */}
      <aside
        ref={sidebarRef}
        onMouseMove={handleMouseMove}
        className={cn(
          "fixed flex flex-col transition-all duration-500 ease-out z-50",
          // Desktop positioning
          "lg:left-4 lg:top-4 lg:bottom-4 lg:rounded-2xl",
          collapsed ? "lg:w-20" : "lg:w-72",
          // Mobile positioning
          "inset-y-0 left-0 w-72 transform",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
          "lg:transform-none lg:translate-x-0",
          // Glassmorphism avançado
          "bg-linear-to-b from-background/40 via-background/60 to-background/40",
          "backdrop-blur-2xl",
          "border border-white/10",
          "shadow-2xl shadow-black/20",
          "overflow-hidden"
        )}
      >
        {/* Efeito de brilho dinâmico seguindo o mouse */}
        <div
          className="absolute pointer-events-none transition-opacity duration-300"
          style={{
            left: mousePosition.x - 100,
            top: mousePosition.y - 100,
            width: 200,
            height: 200,
            background: 'radial-gradient(circle, rgba(var(--primary), 0.15) 0%, transparent 70%)',
            opacity: hoveredIndex !== null ? 1 : 0,
          }}
        />

        {/* Barra de energia superior */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-transparent via-primary/50 to-transparent opacity-50">
          <div
            className="h-full bg-linear-to-r from-primary to-primary/80 transition-all duration-1000 ease-out"
            style={{ width: `${energyLevel}%` }}
          />
        </div>

        {/* Logo Section - Estilo Orbital */}
        <div className={cn(
          "relative flex items-center gap-3 p-5 border-b border-white/5",
          collapsed && "lg:justify-center lg:p-4"
        )}>
          <div className="relative group">
            <div className="absolute inset-0 bg-primary/20 rounded-xl blur-xl group-hover:bg-primary/30 transition-all duration-500" />
            <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-primary via-primary to-primary/80 shadow-lg shadow-primary/30 ring-1 ring-white/20 group-hover:scale-105 transition-transform duration-300">
              <Truck className="h-6 w-6 text-primary-foreground" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-background animate-pulse" />
            </div>
          </div>

          {!collapsed && (
            <div className="overflow-hidden flex-1">
              <h1 className="font-bold text-lg leading-tight bg-linear-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                Fechamentos
              </h1>
              <div className="flex items-center gap-1.5 mt-1">
                <Activity className="h-3 w-3 text-green-500" />
                <p className="text-xs text-muted-foreground font-medium">
                  Sistema Online
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Mobile Spacer */}
        <div className="lg:hidden h-16 shrink-0" />

        {/* Navegação - Estilo Floating Cards */}
        <div className="flex-1 flex flex-col">
          <nav className="flex-1 p-3 space-y-2 overflow-y-auto scrollbar-hide">
            {navItems.map((item, index) => {
              const isActive = pathname === item.href
              const isHovered = hoveredIndex === index

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={handleNavClick}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  className={cn(
                    "group relative flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300",
                    "hover:scale-[1.02] active:scale-[0.98]",
                    isActive
                      ? "bg-linear-to-r from-primary/20 to-primary/5 text-primary border border-primary/20"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/5 border border-transparent"
                  )}
                >
                  {/* Indicador de atividade pulsante */}
                  {item.pulse && (
                    <span className="absolute right-2 top-2 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                    </span>
                  )}

                  {/* Ícone com efeito de brilho */}
                  <div className={cn(
                    "relative flex items-center justify-center",
                    "transition-all duration-300",
                    isActive && "text-primary"
                  )}>
                    <item.icon className={cn(
                      "h-5 w-5 shrink-0 transition-transform duration-300",
                      isHovered && "scale-110"
                    )} />
                    {isActive && (
                      <div className="absolute inset-0 bg-primary/20 blur-lg rounded-full" />
                    )}
                  </div>

                  {/* Label com animação de revelação */}
                  <span className={cn(
                    "font-medium text-sm transition-all duration-300",
                    collapsed && "lg:hidden",
                    isActive && "text-primary"
                  )}>
                    {item.label}
                  </span>

                  {/* Indicador ativo - linha lateral */}
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full shadow-lg shadow-primary/50" />
                  )}
                </Link>
              )
            })}
          </nav>

          {/* Botão de Configurações - Apenas para Admin */}
          {isAdmin && usersNav && (
            <div className="mt-auto p-3">
              <div className="relative">
                <Button
                  variant="ghost"
                  onClick={() => setSettingsOpen((o) => !o)}
                  className={cn(
                    "w-full justify-start text-muted-foreground rounded-xl transition-all duration-300 group",
                    "hover:text-foreground hover:bg-white/10",
                    settingsOpen && "scale-[1.02] bg-white/10 shadow-lg shadow-white/10",
                    collapsed && "lg:justify-center lg:px-2",
                    !collapsed && "px-3"
                  )}
                >
                  <Settings
                    className={cn(
                      "h-5 w-5 shrink-0 transition-transform duration-300",
                      settingsOpen && "rotate-12",
                      collapsed && "transition-transform duration-300"
                    )}
                  />

                  {!collapsed && (
                    <span
                      className={cn(
                        "ml-3 flex-1 text-left font-medium transition-all duration-300",
                        settingsOpen && "text-foreground"
                      )}
                    >
                      Configurações
                    </span>
                  )}

                  {!collapsed && (
                    <ChevronRight
                      className={cn(
                        "h-4 w-4 text-muted-foreground transition-transform duration-300",
                        settingsOpen && "rotate-90 text-foreground"
                      )}
                    />
                  )}
                </Button>

                {/* Expansão inline (sem popover) */}
                <div
                  className={cn(
                    "overflow-hidden transition-all duration-300",
                    settingsOpen ? "max-h-40 opacity-100" : "max-h-0 opacity-0",
                    collapsed
                      ? "lg:absolute lg:left-full lg:top-0 lg:mt-2 lg:w-56 lg:rounded-xl lg:bg-background/70 lg:border lg:border-white/10 lg:shadow-xl lg:backdrop-blur-xl"
                      : "lg:mt-3"
                  )}
                >
                  <div className="space-y-2 p-2">
                    <Link
                      href={usersNav.href}
                      onClick={handleNavClick}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 transition",
                        pathname === usersNav.href && "bg-white/10 text-foreground"
                      )}
                    >
                      <Users className="h-4 w-4" />
                      Usuários
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Seção inferior - User & Controls */}
        <div className="p-3 border-t border-white/5 space-y-3 shrink-0">
          {/* User Card - Estilo Glass */}
          {!collapsed && user && (
            <div className="hidden lg:block relative overflow-hidden rounded-xl bg-linear-to-br from-white/5 to-white/2 border border-white/5 p-3">
              <div className="absolute top-0 right-0 w-20 h-20 bg-primary/10 rounded-full blur-2xl -mr-10 -mt-10" />
              <div className="relative flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-linear-to-br from-primary/30 to-primary/10 flex items-center justify-center border border-white/10">
                  <span className="text-sm font-bold text-primary">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate text-foreground">{user.name}</p>
                  <div className="flex items-center gap-1">
                    <Sparkles className="h-3 w-3 text-yellow-500/70" />
                    <p className="text-xs text-muted-foreground">
                      {user.role === "admin" ? "Administrador" : "Visualizador"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Mobile User Info */}
          {user && (
            <div className="lg:hidden flex items-center gap-3 px-3 py-2 rounded-xl bg-white/5 border border-white/5">
              <div className="h-10 w-10 rounded-full bg-linear-to-br from-primary/30 to-primary/10 flex items-center justify-center border border-white/10">
                <span className="text-sm font-bold text-primary">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.name}</p>
                <p className="text-xs text-muted-foreground">
                  {user.role === "admin" ? "Administrador" : "Visualizador"}
                </p>
              </div>
            </div>
          )}

          {/* Botão Logout - Estilo Danger Zone */}
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start text-muted-foreground hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all duration-300 group",
              collapsed && "lg:justify-center lg:px-2"
            )}
            onClick={logout}
          >
            <LogOut className="h-5 w-5 shrink-0 transition-transform duration-300 group-hover:-translate-x-1" />
            <span className={cn("ml-3 lg:hidden", collapsed && "lg:hidden")}>
              Sair
            </span>
            {!collapsed && <span className="ml-3 hidden lg:inline">Sair</span>}
          </Button>

          {/* Toggle Collapse - Desktop Only */}
          <Button
            variant="ghost"
            size="sm"
            className="hidden lg:flex w-full justify-center rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all duration-300"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronLeft className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>
        </div>

        {/* Decoração de fundo - Grid sutil */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '20px 20px'
          }}
        />
      </aside>

      {/* Spacer para mobile */}
      <div className="lg:hidden h-16" />

      {/* Spacer para desktop quando expandido */}
      <div className={cn(
        "hidden lg:block transition-all duration-500",
        collapsed ? "w-24" : "w-80"
      )} />
    </>
  )
}