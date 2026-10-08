import type { ReactNode } from 'react'
import { Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { TableCell, TableRow } from '@/components/ui/table'

export function PageHeader({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  )
}

export function Field({
  label,
  htmlFor,
  error,
  hint,
  children,
  className,
}: {
  label: string
  htmlFor?: string
  error?: string
  hint?: string
  children: ReactNode
  className?: string
}) {
  return (
    <div className={`grid gap-1.5 ${className ?? ''}`}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error ? (
        <p className="text-xs font-medium text-destructive">{error}</p>
      ) : (
        hint && <p className="text-xs text-muted-foreground">{hint}</p>
      )}
    </div>
  )
}

export function EstadoBadge({ estado }: { estado: string }) {
  const variant = estado === 'Activo' ? 'success' : estado === 'Contratado' ? 'default' : estado === 'En proceso' ? 'warning' : 'secondary'
  return <Badge variant={variant}>{estado}</Badge>
}

/** Fila de tabla para estados de carga / vacío. */
export function TableMessage({ colSpan, loading, empty = 'No hay registros.' }: { colSpan: number; loading: boolean; empty?: string }) {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} className="py-10 text-center text-muted-foreground">
        {loading ? (
          <span className="inline-flex items-center gap-2">
            <Loader2 className="size-4 animate-spin" /> Cargando…
          </span>
        ) : (
          empty
        )}
      </TableCell>
    </TableRow>
  )
}

/** Lista de casillas para selección múltiple (competencias, capacitaciones). */
export function CheckList({
  options,
  selected,
  onChange,
  empty = 'No hay opciones disponibles.',
}: {
  options: { id: number; label: string; detail?: string }[]
  selected: number[]
  onChange: (ids: number[]) => void
  empty?: string
}) {
  if (options.length === 0) return <p className="rounded-md border p-3 text-sm text-muted-foreground">{empty}</p>
  return (
    <div className="max-h-48 space-y-1 overflow-y-auto rounded-md border p-2">
      {options.map((o) => {
        const checked = selected.includes(o.id)
        return (
          <label key={o.id} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-muted">
            <Checkbox
              checked={checked}
              onCheckedChange={(v) => onChange(v ? [...selected, o.id] : selected.filter((id) => id !== o.id))}
            />
            <span>{o.label}</span>
            {o.detail && <span className="text-xs text-muted-foreground">· {o.detail}</span>}
          </label>
        )
      })}
    </div>
  )
}
