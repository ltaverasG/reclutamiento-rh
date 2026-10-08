import { useState, type FormEvent } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { z } from 'zod'
import { Field, PageHeader, TableMessage } from '@/components/shared'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useQuery, zodErrors } from '@/lib/hooks'
import { supabase } from '@/lib/supabase'
import { NIVELES_CAPACITACION, type Capacitacion } from '@/lib/types'
import { dbErrorMessage, formatDate } from '@/lib/utils'

const schema = z
  .object({
    descripcion: z.string().trim().min(2, 'La descripción es obligatoria').max(150),
    nivel: z.enum(NIVELES_CAPACITACION, 'Seleccione un nivel'),
    fecha_desde: z.string().min(1, 'La fecha desde es obligatoria'),
    fecha_hasta: z.string().min(1, 'La fecha hasta es obligatoria'),
    institucion: z.string().trim().min(2, 'La institución es obligatoria').max(150),
  })
  .refine((d) => d.fecha_hasta >= d.fecha_desde, {
    path: ['fecha_hasta'],
    message: 'La fecha hasta no puede ser anterior a la fecha desde',
  })

type Form = { descripcion: string; nivel: string; fecha_desde: string; fecha_hasta: string; institucion: string }
const EMPTY: Form = { descripcion: '', nivel: '', fecha_desde: '', fecha_hasta: '', institucion: '' }

export default function CapacitacionesPage() {
  const { data, loading, reload } = useQuery(() => supabase.from('capacitaciones').select('*').order('id').returns<Capacitacion[]>())
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<Capacitacion | 'new' | null>(null)
  const [form, setForm] = useState<Form>(EMPTY)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<Capacitacion | null>(null)

  const rows = (data ?? []).filter((r) =>
    `${r.descripcion} ${r.institucion} ${r.nivel}`.toLowerCase().includes(search.toLowerCase()),
  )

  const set = (k: keyof Form) => (v: string) => setForm((f) => ({ ...f, [k]: v }))

  function openForm(row: Capacitacion | 'new') {
    setEditing(row)
    setErrors({})
    setForm(row === 'new' ? EMPTY : { ...row })
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    const parsed = schema.safeParse(form)
    if (!parsed.success) return setErrors(zodErrors(parsed.error))

    setSaving(true)
    const { error } =
      editing === 'new'
        ? await supabase.from('capacitaciones').insert(parsed.data)
        : await supabase.from('capacitaciones').update(parsed.data).eq('id', (editing as Capacitacion).id)
    setSaving(false)

    if (error) return toast.error(dbErrorMessage(error))
    toast.success(editing === 'new' ? 'Capacitación registrada correctamente' : 'Capacitación actualizada correctamente')
    setEditing(null)
    reload()
  }

  async function onDelete() {
    if (!deleting) return
    const { error } = await supabase.from('capacitaciones').delete().eq('id', deleting.id)
    setDeleting(null)
    if (error) {
      return toast.error(error.code === '23503' ? 'No se puede eliminar: la capacitación está asignada a candidatos.' : dbErrorMessage(error))
    }
    toast.success('Capacitación eliminada')
    reload()
  }

  return (
    <>
      <PageHeader
        title="Capacitaciones"
        description="Formación académica y técnica que pueden tener los candidatos."
        action={
          <Button onClick={() => openForm('new')}>
            <Plus /> Agregar
          </Button>
        }
      />

      <Card className="gap-0 py-0">
        <div className="border-b p-4">
          <Input placeholder="Buscar por descripción, nivel o institución…" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">ID</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead>Nivel</TableHead>
              <TableHead>Desde</TableHead>
              <TableHead>Hasta</TableHead>
              <TableHead>Institución</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading || rows.length === 0 ? (
              <TableMessage colSpan={7} loading={loading} />
            ) : (
              rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.id}</TableCell>
                  <TableCell className="font-medium">{row.descripcion}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{row.nivel}</Badge>
                  </TableCell>
                  <TableCell>{formatDate(row.fecha_desde)}</TableCell>
                  <TableCell>{formatDate(row.fecha_hasta)}</TableCell>
                  <TableCell>{row.institucion}</TableCell>
                  <TableCell className="space-x-2 text-right">
                    <Button variant="outline" size="sm" onClick={() => openForm(row)}>
                      <Pencil /> Editar
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setDeleting(row)}>
                      <Trash2 /> Eliminar
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
            <DialogTitle>{editing === 'new' ? 'Nueva capacitación' : 'Editar capacitación'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={onSubmit} className="grid gap-4">
            {editing && editing !== 'new' && (
              <Field label="Identificador">
                <Input value={editing.id} disabled />
              </Field>
            )}
            <Field label="Descripción" htmlFor="descripcion" error={errors.descripcion}>
              <Input id="descripcion" value={form.descripcion} onChange={(e) => set('descripcion')(e.target.value)} aria-invalid={!!errors.descripcion} />
            </Field>
            <Field label="Nivel" error={errors.nivel}>
              <Select value={form.nivel} onValueChange={set('nivel')}>
                <SelectTrigger aria-invalid={!!errors.nivel}>
                  <SelectValue placeholder="Seleccione…" />
                </SelectTrigger>
                <SelectContent>
                  {NIVELES_CAPACITACION.map((n) => (
                    <SelectItem key={n} value={n}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Fecha desde" htmlFor="desde" error={errors.fecha_desde}>
                <Input id="desde" type="date" value={form.fecha_desde} onChange={(e) => set('fecha_desde')(e.target.value)} aria-invalid={!!errors.fecha_desde} />
              </Field>
              <Field label="Fecha hasta" htmlFor="hasta" error={errors.fecha_hasta}>
                <Input id="hasta" type="date" value={form.fecha_hasta} onChange={(e) => set('fecha_hasta')(e.target.value)} aria-invalid={!!errors.fecha_hasta} />
              </Field>
            </div>
            <Field label="Institución" htmlFor="institucion" error={errors.institucion}>
              <Input id="institucion" value={form.institucion} onChange={(e) => set('institucion')(e.target.value)} aria-invalid={!!errors.institucion} />
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

      <Dialog open={deleting !== null} onOpenChange={(o) => !o && setDeleting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar capacitación?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Se eliminará «{deleting?.descripcion}». Esta acción no se puede deshacer.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={onDelete}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
