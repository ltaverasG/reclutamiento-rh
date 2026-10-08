import { useState, type FormEvent } from 'react'
import { Loader2, Search } from 'lucide-react'
import { toast } from 'sonner'
import { z } from 'zod'
import { Field, PageHeader, TableMessage } from '@/components/shared'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { zodErrors } from '@/lib/hooks'
import { supabase } from '@/lib/supabase'
import type { Empleado } from '@/lib/types'
import { formatCedula, formatDate, formatMoney } from '@/lib/utils'

const schema = z
  .object({
    desde: z.string().min(1, 'Seleccione la fecha inicial'),
    hasta: z.string().min(1, 'Seleccione la fecha final'),
  })
  .refine((d) => d.hasta >= d.desde, { path: ['hasta'], message: 'La fecha final no puede ser anterior a la inicial' })

export default function ReporteIngresosPage() {
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [rows, setRows] = useState<Empleado[] | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    const parsed = schema.safeParse({ desde, hasta })
    if (!parsed.success) return setErrors(zodErrors(parsed.error))
    setErrors({})

    setLoading(true)
    const { data, error } = await supabase
      .from('empleados')
      .select('*, puestos ( nombre )')
      .gte('fecha_ingreso', parsed.data.desde)
      .lte('fecha_ingreso', parsed.data.hasta)
      .order('fecha_ingreso')
      .returns<Empleado[]>()
    setLoading(false)
    if (error) return toast.error(error.message)
    setRows(data)
  }

  const total = (rows ?? []).reduce((sum, r) => sum + Number(r.salario), 0)

  return (
    <>
      <PageHeader title="Reporte de Nuevos Ingresos" description="Empleados que ingresaron a la empresa en un rango de fechas." />

      <Card className="mb-6">
        <CardContent>
          <form onSubmit={onSubmit} className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <Field label="Fecha inicial" htmlFor="desde" error={errors.desde}>
              <Input id="desde" type="date" value={desde} onChange={(e) => setDesde(e.target.value)} aria-invalid={!!errors.desde} />
            </Field>
            <Field label="Fecha final" htmlFor="hasta" error={errors.hasta}>
              <Input id="hasta" type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} aria-invalid={!!errors.hasta} />
            </Field>
            <Button type="submit" className="sm:mt-[22px]" disabled={loading}>
              {loading ? <Loader2 className="animate-spin" /> : <Search />} Generar reporte
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="gap-0 py-0">
        <div className="border-b p-4 text-sm text-muted-foreground">
          {rows === null
            ? 'Seleccione un rango de fechas y presione Generar reporte.'
            : `${rows.length} empleado(s) de nuevo ingreso entre ${formatDate(desde)} y ${formatDate(hasta)}`}
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Cédula</TableHead>
              <TableHead>Departamento</TableHead>
              <TableHead>Puesto</TableHead>
              <TableHead>Fecha de ingreso</TableHead>
              <TableHead className="text-right">Salario</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading || !rows || rows.length === 0 ? (
              <TableMessage colSpan={6} loading={loading} empty={rows ? 'No hubo ingresos en ese período.' : '—'} />
            ) : (
              <>
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.nombre}</TableCell>
                    <TableCell>{formatCedula(r.cedula)}</TableCell>
                    <TableCell>{r.departamento}</TableCell>
                    <TableCell>{r.puestos?.nombre}</TableCell>
                    <TableCell>{formatDate(r.fecha_ingreso)}</TableCell>
                    <TableCell className="text-right">{formatMoney(r.salario)}</TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted/50 font-semibold">
                  <TableCell colSpan={5}>Total nómina mensual de nuevos ingresos</TableCell>
                  <TableCell className="text-right">{formatMoney(total)}</TableCell>
                </TableRow>
              </>
            )}
          </TableBody>
        </Table>
      </Card>
    </>
  )
}
