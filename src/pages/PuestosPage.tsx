import { useState, type FormEvent } from 'react'
import { Pencil, Plus, Power } from 'lucide-react'
import { toast } from 'sonner'
import { z } from 'zod'
import { EstadoBadge, Field, PageHeader, TableMessage } from '@/components/shared'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useQuery, zodErrors } from '@/lib/hooks'
import { supabase } from '@/lib/supabase'
import { NIVELES_RIESGO, type Estado, type Puesto } from '@/lib/types'
import { dbErrorMessage, formatMoney } from '@/lib/utils'

const schema = z
  .object({
    nombre: z.string().trim().min(2, 'El nombre es obligatorio').max(100),
    nivel_riesgo: z.enum(NIVELES_RIESGO, 'Seleccione el nivel de riesgo'),
    salario_min: z.coerce.number('Ingrese un monto válido').min(0, 'No puede ser negativo'),
    salario_max: z.coerce.number('Ingrese un monto válido').positive('Debe ser mayor que cero'),
    estado: z.enum(['Activo', 'Inactivo']),
  })
  .refine((d) => d.salario_min <= d.salario_max, {
    path: ['salario_max'],
    message: 'El salario máximo debe ser mayor o igual al mínimo',
  })

type Form = { nombre: string; nivel_riesgo: string; salario_min: string; salario_max: string; estado: Estado }
const EMPTY: Form = { nombre: '', nivel_riesgo: '', salario_min: '', salario_max: '', estado: 'Activo' }
const RIESGO_VARIANT = { Alto: 'destructive', Medio: 'warning', Bajo: 'success' } as const

export default function PuestosPage() {
  const { data, loading, reload } = useQuery(() => supabase.from('puestos').select('*').order('id').returns<Puesto[]>())
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<Puesto | 'new' | null>(null)
  const [form, setForm] = useState<Form>(EMPTY)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  const rows = (data ?? []).filter((r) => r.nombre.toLowerCase().includes(search.toLowerCase()))
  const set = (k: keyof Form) => (v: string) => setForm((f) => ({ ...f, [k]: v }))

  function openForm(row: Puesto | 'new') {
    setEditing(row)
    setErrors({})
    setForm(
      row === 'new'
        ? EMPTY
        : { ...row, salario_min: String(row.salario_min), salario_max: String(row.salario_max) },
    )
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    const parsed = schema.safeParse(form)
    if (!parsed.success) return setErrors(zodErrors(parsed.error))

    setSaving(true)
    const { error } =
      editing === 'new'
        ? await supabase.from('puestos').insert(parsed.data)
        : await supabase.from('puestos').update(parsed.data).eq('id', (editing as Puesto).id)
    setSaving(false)

    if (error) return toast.error(dbErrorMessage(error))
    toast.success(editing === 'new' ? 'Puesto registrado correctamente' : 'Puesto actualizado correctamente')
    setEditing(null)
    reload()
  }

  async function toggleEstado(row: Puesto) {
    const nuevo: Estado = row.estado === 'Activo' ? 'Inactivo' : 'Activo'
    const { error } = await supabase.from('puestos').update({ estado: nuevo }).eq('id', row.id)
    if (error) return toast.error(dbErrorMessage(error))
    toast.success(`Puesto ${nuevo === 'Activo' ? 'activado' : 'desactivado'}`)
    reload()
  }

  return (
    <>
      <PageHeader
        title="Puestos"
        description="Puestos de trabajo disponibles con su nivel de riesgo y rango salarial."
        action={
          <Button onClick={() => openForm('new')}>
            <Plus /> Agregar
          </Button>
        }
      />

      <Card className="gap-0 py-0">
        <div className="border-b p-4">
          <Input placeholder="Buscar por nombre…" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">ID</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Riesgo</TableHead>
              <TableHead className="text-right">Salario mínimo</TableHead>
              <TableHead className="text-right">Salario máximo</TableHead>
              <TableHead>Estado</TableHead>
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
                  <TableCell className="font-medium">{row.nombre}</TableCell>
                  <TableCell>
                    <Badge variant={RIESGO_VARIANT[row.nivel_riesgo]}>{row.nivel_riesgo}</Badge>
                  </TableCell>
                  <TableCell className="text-right">{formatMoney(row.salario_min)}</TableCell>
                  <TableCell className="text-right">{formatMoney(row.salario_max)}</TableCell>
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
            <DialogTitle>{editing === 'new' ? 'Nuevo puesto' : 'Editar puesto'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={onSubmit} className="grid gap-4">
            {editing && editing !== 'new' && (
              <Field label="Identificador">
                <Input value={editing.id} disabled />
              </Field>
            )}
            <Field label="Nombre" htmlFor="nombre" error={errors.nombre}>
              <Input id="nombre" value={form.nombre} onChange={(e) => set('nombre')(e.target.value)} aria-invalid={!!errors.nombre} />
            </Field>
            <Field label="Nivel de riesgo" error={errors.nivel_riesgo}>
              <Select value={form.nivel_riesgo} onValueChange={set('nivel_riesgo')}>
                <SelectTrigger aria-invalid={!!errors.nivel_riesgo}>
                  <SelectValue placeholder="Seleccione…" />
                </SelectTrigger>
                <SelectContent>
                  {NIVELES_RIESGO.map((n) => (
                    <SelectItem key={n} value={n}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Salario mínimo (RD$)" htmlFor="min" error={errors.salario_min}>
                <Input id="min" type="number" min={0} step="0.01" value={form.salario_min} onChange={(e) => set('salario_min')(e.target.value)} aria-invalid={!!errors.salario_min} />
              </Field>
              <Field label="Salario máximo (RD$)" htmlFor="max" error={errors.salario_max}>
                <Input id="max" type="number" min={0} step="0.01" value={form.salario_max} onChange={(e) => set('salario_max')(e.target.value)} aria-invalid={!!errors.salario_max} />
              </Field>
            </div>
            <Field label="Estado">
              <Select value={form.estado} onValueChange={set('estado')}>
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
