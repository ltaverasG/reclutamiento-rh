import { useState } from 'react'
import { Navigate, NavLink, Outlet } from 'react-router-dom'
import {
  BarChart3,
  BookOpen,
  Briefcase,
  CalendarRange,
  GraduationCap,
  Languages,
  LayoutDashboard,
  Loader2,
  LogOut,
  Menu,
  Search,
  Star,
  UserCheck,
  Users,
  X,
} from 'lucide-react'
import { useAuth } from '@/auth/AuthProvider'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/competencias', label: 'Competencias', icon: Star },
  { to: '/idiomas', label: 'Idiomas', icon: Languages },
  { to: '/capacitaciones', label: 'Capacitaciones', icon: GraduationCap },
  { to: '/puestos', label: 'Puestos', icon: Briefcase },
  { to: '/candidatos', label: 'Candidatos', icon: Users },
  { to: '/empleados', label: 'Empleados', icon: UserCheck },
  { to: '/consulta', label: 'Consulta de Candidatos', icon: Search },
  { to: '/reporte', label: 'Reporte de Nuevos Ingresos', icon: CalendarRange },
]

export function AppLayout() {
  const { session, loading } = useAuth()
  const [open, setOpen] = useState(false)

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }
  if (!session) return <Navigate to="/login" replace />

  return (
    <div className="min-h-screen">
      {/* Fondo oscuro del menú en móvil */}
      {open && <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setOpen(false)} />}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-sidebar text-sidebar-foreground transition-transform lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-16 items-center justify-between gap-2 border-b border-white/10 px-5">
          <div className="flex items-center gap-2">
            <BookOpen className="size-5 text-indigo-300" />
            <span className="font-semibold text-white">Reclutamiento RH</span>
          </div>
          <button className="lg:hidden" onClick={() => setOpen(false)} aria-label="Cerrar menú">
            <X className="size-5" />
          </button>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                  isActive ? 'bg-white/10 font-medium text-white' : 'text-slate-300 hover:bg-white/5 hover:text-white',
                )
              }
            >
              <Icon className="size-4" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-white/10 p-4 text-xs text-slate-400">
          <BarChart3 className="mr-1 inline size-3" /> UNAPEC · Proyecto Final RH
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b bg-background/95 px-4 backdrop-blur sm:px-6">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setOpen(true)} aria-label="Abrir menú">
            <Menu />
          </Button>
          <span className="hidden text-sm text-muted-foreground sm:block">Sistema de Reclutamiento y Selección</span>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted-foreground md:block">{session.user.email}</span>
            <Button variant="outline" size="sm" onClick={() => supabase.auth.signOut()}>
              <LogOut /> Salir
            </Button>
          </div>
        </header>
        <main className="mx-auto max-w-7xl p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
