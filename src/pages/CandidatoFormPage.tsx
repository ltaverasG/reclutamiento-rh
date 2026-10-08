import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Loader2, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { z } from 'zod'
import { CheckList, Field, PageHeader } from '@/components/shared'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { validaCedula, normalizaCedula } from '@/lib/cedula'
import { zodErrors } from '@/lib/hooks'
import { supabase } from '@/lib/supabase'
import { CANDIDATO_SELECT, type Capacitacion, type CandidatoDetalle, type Competencia, type Puesto } from '@/lib/types'
import { dbErrorMessage, formatCedula, formatMoney } from '@/lib/utils'

const experienciaSchema = z
  .object({
    empresa: z.string().trim().min(2, 'Empresa obligatoria'),
    puesto: z.string().trim().min(2, 'Puesto obligatorio'),
    fecha_desde: z.string().min(1, 'Fecha obligatoria'),
    fecha_hasta: z.string().nullable(),
    salario: z.coerce.number('Monto inválido').min(0, 'No puede ser negativo'),
  })
  .refine((e) => !e.fecha_hasta || e.fecha_hasta >= e.fecha_desde, {
    path: ['fecha_hasta'],
    message: 'Debe ser posterior a la fecha desde',
  })

const schema = z.object({
  cedula: z
    .string()
    .transform(normalizaCedula)
    .refine((c) => c.length === 11, 'La cédula debe tener 11 dígitos')
    .refine(validaCedula, 'La cédula no es válida'),
  nombre: z.string().trim().min(3, 'El nombre es obligatorio').max(150),
  puesto_id: z.coerce.number().int().positive('Seleccione el puesto al que aspira'),
  departamento: z.string().trim().min(2, 'El departamento es obligatorio').max(100),
  salario_aspirado: z.coerce.number('Ingrese un monto válido').positive('El salario debe ser mayor que cero'),
  recomendado_por: z
    .string()
    .trim()
    .max(150)
    .transform((v) => v || null),
  competencias: z.array(z.number()).min(1, 'Seleccione al menos una competencia'),
  capacitaciones: z.array(z.number()),
  experiencias: z.array(experienciaSchema),
})

type ExpForm = { empresa: string; puesto: string; fecha_desde: string; fecha_hasta: string; salario: string }
const EMPTY_EXP: ExpForm = { empresa: '', puesto: '', fecha_desde: '', fecha_hasta: '', salario: '' }

export default function CandidatoFormPage() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()

  const [puestos, setPuestos] = useState<Puesto[]>([])
  const [competencias, setCompetencias] = useState<Competencia[]>([])
  const [capacitaciones, setCapacitaciones] = useState<Capacitacion[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [cedula, setCedula] = useState('')
  const [nombre, setNombre] = useState('')
  const [puestoId, setPuestoId] = useState('')
  const [departamento, setDepartamento] = useState('')
  const [salario, setSalario] = useState('')
  const [recomendadoPor, setRecomendadoPor] = useState('')
  const [compIds, setCompIds] = useState<number[]>([])
  const [capIds, setCapIds] = useState<number[]>([])
  const [experiencias, setExperiencias] = useState<ExpForm[]>([])

  useEffect(() => {
    async function load() {
      const [p, c, k, cand] = await Promise.all([
        supabase.from('puestos').select('*').order('nombre').returns<Puesto[]>(),
        supabase.from('competencias').select('*').order('descripcion').returns<Competencia[]>(),
        supabase.from('capacitaciones').select('*').order('descripcion').returns<Capacitacion[]>(),
        id ? supabase.from('candidatos').select(CANDIDATO_SELECT).eq('id', id).single<CandidatoDetalle>() : Promise.resolve(null),
      ])
      const error = p.error ?? c.error ?? k.error ?? cand?.error
      if (error) toast.error(`Error al cargar datos: ${error.message}`)

      const d = cand?.data
      const selComp = d?.candidato_competencias.map((x) => x.competencias?.id).filter((x): x is number => !!x) ?? []
      // Solo se ofrecen registros activos, conservando los ya asignados al candidato
      setPuestos((p.data ?? []).filter((x) => x.estado === 'Activo' || x.id === d?.puesto_id))
      setCompetencias((c.data ?? []).filter((x) => x.estado === 'Activo' || selComp.includes(x.id)))
      setCapacitaciones(k.data ?? [])

      if (d) {
        setCedula(formatCedula(d.cedula))
        setNombre(d.nombre)
        setPuestoId(String(d.puesto_id))
        setDepartamento(d.departamento)
        setSalario(String(d.salario_aspirado))
        setRecomendadoPor(d.recomendado_por ?? '')
        setCompIds(selComp)
        setCapIds(d.candidato_capacitaciones.map((x) => x.capacitaciones?.id).filter((x): x is number => !!x))
        setExperiencias(
          d.experiencias_laborales.map((e) => ({
            empresa: e.empresa,
            puesto: e.puesto,
            fecha_desde: e.fecha_desde,
            fecha_hasta: e.fecha_hasta ?? '',
            salario: String(e.salario),
          })),
        )
      }
      setLoading(false)
    }
    void load()
  }, [id])

  const puestoSel = puestos.find((p) => String(p.id) === puestoId)
  const cedulaDigits = normalizaCedula(cedula)
  const cedulaLive =
    cedulaDigits.length === 11 ? (validaCedula(cedulaDigits) ? 'valida' : 'invalida') : null

  function updateExp(i: number, key: keyof ExpForm, value: string) {
    setExperiencias((list) => list.map((e, idx) => (idx === i ? { ...e, [key]: value } : e)))
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    const parsed = schema.safeParse({
      cedula,
      nombre,
      puesto_id: puestoId,
      departamento,
      salario_aspirado: salario,
      recomendado_por: recomendadoPor,
      competencias: compIds,
      capacitaciones: capIds,
      experiencias: experiencias.map((x) => ({ ...x, fecha_hasta: x.fecha_hasta || null })),
    })
    if (!parsed.success) {
      setErrors(zodErrors(parsed.error))
      toast.error('Revise los campos marcados en el formulario')
      return
    }
    setErrors({})
    setSaving(true)

    const { competencias: comps, capacitaciones: caps, experiencias: exps, ...candidato } = parsed.data

    try {
      // 1. Candidato
      const res = isEdit
        ? await supabase.from('candidatos').update(candidato).eq('id', id!).select('id').single()
        : await supabase.from('candidatos').insert(candidato).select('id').single()
      if (res.error) {
        if (res.error.code === '23505') {
          setErrors({ cedula: 'Ya existe un candidato registrado con esta cédula' })
          throw new Error('Ya existe un candidato registrado con esta cédula.')
        }
        throw new Error(dbErrorMessage(res.error))
      }
      const candidatoId = res.data.id as number

      // 2. Relaciones: se reemplazan por la selección actual
      const steps = [
        supabase.from('candidato_competencias').delete().eq('candidato_id', candidatoId),
        supabase.from('candidato_capacitaciones').delete().eq('candidato_id', candidatoId),
        supabase.from('experiencias_laborales').delete().eq('candidato_id', candidatoId),
      ]
      for (const r of await Promise.all(steps)) if (r.error) throw new Error(dbErrorMessage(r.error))

      const inserts = [
        supabase.from('candidato_competencias').insert(comps.map((competencia_id) => ({ candidato_id: candidatoId, competencia_id }))),
        caps.length
          ? supabase.from('candidato_capacitaciones').insert(caps.map((capacitacion_id) => ({ candidato_id: candidatoId, capacitacion_id })))
          : null,
        exps.length ? supabase.from('experiencias_laborales').insert(exps.map((x) => ({ ...x, candidato_id: candidatoId }))) : null,
      ]
      for (const r of await Promise.all(inserts)) if (r?.error) throw new Error(dbErrorMessage(r.error))

      toast.success(isEdit ? 'Candidato actualizado correctamente' : 'Candidato registrado correctamente')
      navigate('/candidatos')
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <>
      <PageHeader
        title={isEdit ? 'Editar candidato' : 'Nuevo candidato'}
        description="Complete los datos del candidato, sus competencias, capacitaciones y experiencia laboral."
        action={
          <Button variant="outline" onClick={() => navigate('/candidatos')}>
            <ArrowLeft /> Volver
          </Button>
        }
      />

      <form onSubmit={onSubmit} className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Datos generales</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            {isEdit && (
              <Field label="Identificador">
                <Input value={id} disabled />
              </Field>
            )}
            <Field
              label="Cédula"
              htmlFor="cedula"
              error={errors.cedula ?? (cedulaLive === 'invalida' ? 'La cédula no es válida' : undefined)}
              hint={cedulaLive === 'valida' ? '✓ Cédula válida' : 'Formato: 000-0000000-0'}
            >
              <Input
                id="cedula"
                value={cedula}
                maxLength={13}
                placeholder="000-0000000-0"
                onChange={(e) => setCedula(e.target.value.replace(/[^\d-]/g, ''))}
                onBlur={() => cedulaDigits.length === 11 && setCedula(formatCedula(cedulaDigits))}
                aria-invalid={!!errors.cedula || cedulaLive === 'invalida'}
              />
            </Field>
            <Field label="Nombre completo" htmlFor="nombre" error={errors.nombre}>
              <Input id="nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} aria-invalid={!!errors.nombre} />
            </Field>
            <Field label="Puesto al que aspira" error={errors.puesto_id}>
              <Select value={puestoId} onValueChange={setPuestoId}>
                <SelectTrigger aria-invalid={!!errors.puesto_id}>
                  <SelectValue placeholder={puestos.length ? 'Seleccione…' : 'No hay puestos activos'} />
                </SelectTrigger>
                <SelectContent>
                  {puestos.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Departamento" htmlFor="departamento" error={errors.departamento}>
              <Input id="departamento" value={departamento} onChange={(e) => setDepartamento(e.target.value)} aria-invalid={!!errors.departamento} />
            </Field>
            <Field
              label="Salario al que aspira (RD$)"
              htmlFor="salario"
              error={errors.salario_aspirado}
              hint={puestoSel ? `Rango del puesto: ${formatMoney(puestoSel.salario_min)} – ${formatMoney(puestoSel.salario_max)}` : undefined}
            >
              <Input id="salario" type="number" min={0} step="0.01" value={salario} onChange={(e) => setSalario(e.target.value)} aria-invalid={!!errors.salario_aspirado} />
            </Field>
            <Field label="Recomendado por (opcional)" htmlFor="recomendado" error={errors.recomendado_por}>
              <Input id="recomendado" value={recomendadoPor} onChange={(e) => setRecomendadoPor(e.target.value)} />
            </Field>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Principales competencias</CardTitle>
              <CardDescription>Organizacionales, técnico-operativas, etc.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-1.5">
              <CheckList
                options={competencias.map((c) => ({ id: c.id, label: c.descripcion }))}
                selected={compIds}
                onChange={setCompIds}
                empty="No hay competencias activas. Regístrelas primero."
              />
              {errors.competencias && <p className="text-xs font-medium text-destructive">{errors.competencias}</p>}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Principales capacitaciones</CardTitle>
              <CardDescription>Grado, postgrado, técnicas, etc.</CardDescription>
            </CardHeader>
            <CardContent>
              <CheckList
                options={capacitaciones.map((c) => ({ id: c.id, label: c.descripcion, detail: `${c.nivel} · ${c.institucion}` }))}
                selected={capIds}
                onChange={setCapIds}
                empty="No hay capacitaciones registradas."
              />
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div className="grid gap-1.5">
              <CardTitle>Experiencia laboral</CardTitle>
              <CardDescription>Deje “Fecha hasta” vacía si es su empleo actual.</CardDescription>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => setExperiencias((l) => [...l, EMPTY_EXP])}>
              <Plus /> Agregar experiencia
            </Button>
          </CardHeader>
          <CardContent className="grid gap-4">
            {experiencias.length === 0 && <p className="text-sm text-muted-foreground">Sin experiencias laborales registradas.</p>}
            {experiencias.map((exp, i) => {
              const err = (k: string) => errors[`experiencias.${i}.${k}`]
              return (
                <div key={i} className="grid gap-3 rounded-lg border bg-muted/30 p-4 md:grid-cols-6">
                  <Field label="Empresa" error={err('empresa')} className="md:col-span-2">
                    <Input value={exp.empresa} onChange={(e) => updateExp(i, 'empresa', e.target.value)} aria-invalid={!!err('empresa')} />
                  </Field>
                  <Field label="Puesto ocupado" error={err('puesto')} className="md:col-span-2">
                    <Input value={exp.puesto} onChange={(e) => updateExp(i, 'puesto', e.target.value)} aria-invalid={!!err('puesto')} />
                  </Field>
                  <Field label="Salario (RD$)" error={err('salario')} className="md:col-span-2">
                    <Input type="number" min={0} step="0.01" value={exp.salario} onChange={(e) => updateExp(i, 'salario', e.target.value)} aria-invalid={!!err('salario')} />
                  </Field>
                  <Field label="Fecha desde" error={err('fecha_desde')} className="md:col-span-2">
                    <Input type="date" value={exp.fecha_desde} onChange={(e) => updateExp(i, 'fecha_desde', e.target.value)} aria-invalid={!!err('fecha_desde')} />
                  </Field>
                  <Field label="Fecha hasta" error={err('fecha_hasta')} className="md:col-span-2">
                    <Input type="date" value={exp.fecha_hasta} onChange={(e) => updateExp(i, 'fecha_hasta', e.target.value)} aria-invalid={!!err('fecha_hasta')} />
                  </Field>
                  <div className="flex items-end md:col-span-2">
                    <Button type="button" variant="ghost" className="text-destructive" onClick={() => setExperiencias((l) => l.filter((_, idx) => idx !== i))}>
                      <Trash2 /> Quitar
                    </Button>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => navigate('/candidatos')}>
            Cancelar
          </Button>
          <Button type="submit" disabled={saving}>
            {saving && <Loader2 className="animate-spin" />} Guardar candidato
          </Button>
        </div>
      </form>
    </>
  )
}
