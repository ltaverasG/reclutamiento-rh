import { useState, type FormEvent } from 'react'
import { Pencil, Plus, Power } from 'lucide-react'
import { toast } from 'sonner'
import { z } from 'zod'
import { EstadoBadge, Field, PageHeader, TableMessage } from '@/components/shared'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useQuery, zodErrors } from '@/lib/hooks'
import { supabase } from '@/lib/supabase'
import type { Estado } from '@/lib/types'
import { dbErrorMessage } from '@/lib/utils'

type Row = { id: number; estado: Estado } & Record<string, unknown>

interface Props {
  /** Tabla en Supabase */
  table: 'competencias' | 'idiomas'
  /** Columna de texto principal (descripcion / nombre) */
  field: string
  fieldLabel: string
  title: string
  singular: string
  /** Concordancia de los mensajes: 'a' (competencia) u 'o' (idioma) */
  genero: 'a' | 'o'
  description: string
}

/**
 * CRUD reutilizable para catálogos simples: Identificador + texto + Estado.
 * Lo usan Competencias e Idiomas.
 */
export function SimpleCatalogPage({ table, field, fieldLabel, title, singular, genero, description }: Props) {
  const { data, loading, reload } = useQuery(() => supabase.from(table).select('*').order('id'), [table])
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<Row | 'new' | null>(null)
  const [value, setValue] = useState('')
  const [estado, setEstado] = useState<Estado>('Activo')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  const schema = z.object({
    [field]: z.string().trim().min(2, `${fieldLabel} debe tener al menos 2 caracteres`).max(100),
    estado: z.enum(['Activo', 'Inactivo']),
  })

  const rows = ((data ?? []) as Row[]).filter((r) => String(r[field]).toLowerCase().includes(search.toLowerCase()))

  function openForm(row: Row | 'new') {
    setEditing(row)
    setErrors({})
    setValue(row === 'new' ? '' : String(row[field]))
    setEstado(row === 'new' ? 'Activo' : row.estado)
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    const parsed = schema.safeParse({ [field]: value, estado })
    if (!parsed.success) return setErrors(zodErrors(parsed.error))

    setSaving(true)
    const { error } =
      editing === 'new'
        ? await supabase.from(table).insert(parsed.data as never) // columna dinámica (descripcion / nombre)
        : await supabase.from(table).update(parsed.data).eq('id', (editing as Row).id)
    setSaving(false)

    if (error) return toast.error(dbErrorMessage(error))
    toast.success(editing === 'new' ? `${singular} registrad${genero} correctamente` : `${singular} actualizad${genero} correctamente`)
    setEditing(null)
    reload()
  }

  async function toggleEstado(row: Row) {
    const nuevo: Estado = row.estado === 'Activo' ? 'Inactivo' : 'Activo'
    const { error } = await supabase.from(table).update({ estado: nuevo }).eq('id', row.id)
    if (error) return toast.error(dbErrorMessage(error))
    toast.success(`${singular} ${nuevo === 'Activo' ? 'activad' : 'desactivad'}${genero}`)
    reload()
  }

  return (
    <>
      <PageHeader
        title={title}
        description={description}
        action={
          <Button onClick={() => openForm('new')}>
            <Plus /> Agregar
          </Button>
        }
      />

      <Card className="gap-0 py-0">
        <div className="border-b p-4">
          <Input placeholder={`Buscar por ${fieldLabel.toLowerCase()}…`} value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-20">ID</TableHead>
              <TableHead>{fieldLabel}</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading || rows.length === 0 ? (
              <TableMessage colSpan={4} loading={loading} />
            ) : (
              rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.id}</TableCell>
                  <TableCell className="font-medium">{String(row[field])}</TableCell>
                  <TableCell>
                    <EstadoBadge estado={row.estado} />
                  </TableCell>
                  <TableCell className="space-x-2 text-right">
                    <Button variant="outline" size="sm" onClick={() => openForm(row)}>
                      <Pencil /> Editar
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => toggleEstado(row)}>
                      <Power /> {row.estado === 'Activo' ? 'Desactivar' : 'Activar'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={editing !== null} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing === 'new' ? `${genero === 'a' ? 'Nueva' : 'Nuevo'} ${singular.toLowerCase()}` : `Editar ${singular.toLowerCase()}`}</DialogTitle>
          </DialogHeader>
          <form onSubmit={onSubmit} className="grid gap-4">
            {editing && editing !== 'new' && (
              <Field label="Identificador">
                <Input value={editing.id} disabled />
              </Field>
            )}
            <Field label={fieldLabel} htmlFor="valor" error={errors[field]}>
              <Input id="valor" value={value} onChange={(e) => setValue(e.target.value)} aria-invalid={!!errors[field]} autoFocus />
            </Field>
            <Field label="Estado">
              <Select value={estado} onValueChange={(v) => setEstado(v as Estado)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Activo">Activo</SelectItem>
                  <SelectItem value="Inactivo">Inactivo</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditing(null)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                Guardar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
