import { useEffect, useState, type FormEvent } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { z } from 'zod'
import { Field } from '@/components/shared'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { zodErrors } from '@/lib/hooks'
import { supabase } from '@/lib/supabase'
import type { CandidatoDetalle } from '@/lib/types'
import { formatCedula, formatMoney } from '@/lib/utils'

const schema = z.object({
  fecha_ingreso: z.string().min(1, 'La fecha de ingreso es obligatoria'),
  salario: z.coerce.number('Ingrese un monto válido').positive('El salario mensual debe ser mayor que cero'),
})

const today = () => new Date().toLocaleDateString('sv-SE') // YYYY-MM-DD en hora local

/**
 * Proceso de selección: convierte al candidato en empleado mediante la
 * función RPC `contratar_candidato` (una sola transacción en PostgreSQL).
 */
export function ContratarDialog({
  candidato,
  onClose,
  onHired,
}: {
  candidato: CandidatoDetalle | null
  onClose: () => void
  onHired: () => void
}) {
  const [fecha, setFecha] = useState(today())
  const [salario, setSalario] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (candidato) {
      setFecha(today())
      setSalario(String(candidato.salario_aspirado))
      setErrors({})
    }
  }, [candidato])

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!candidato) return
    const parsed = schema.safeParse({ fecha_ingreso: fecha, salario })
    if (!parsed.success) return setErrors(zodErrors(parsed.error))

    setSaving(true)
    const { error } = await supabase.rpc('contratar_candidato', {
      p_candidato_id: candidato.id,
      p_fecha_ingreso: parsed.data.fecha_ingreso,
      p_salario: parsed.data.salario,
    })
    setSaving(false)

    if (error) return toast.error(error.code === '23505' ? 'Este candidato ya fue contratado.' : error.message)
    toast.success(`${candidato.nombre} fue contratado y registrado como empleado`)
    onHired()
  }

  const puesto = candidato?.puestos

  return (
    <Dialog open={candidato !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Contratar candidato</DialogTitle>
          <DialogDescription>Confirme los datos para registrar al candidato como empleado.</DialogDescription>
        </DialogHeader>

        {candidato && (
          <form onSubmit={onSubmit} className="grid gap-4">
            <div className="grid grid-cols-2 gap-3 rounded-lg border bg-muted/40 p-4 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Nombre</p>
                <p className="font-medium">{candidato.nombre}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Cédula</p>
                <p className="font-medium">{formatCedula(candidato.cedula)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Puesto</p>
                <p className="font-medium">{puesto?.nombre ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Departamento</p>
                <p className="font-medium">{candidato.departamento}</p>
              </div>
            </div>

            <Field label="Fecha de ingreso" htmlFor="fecha_ingreso" error={errors.fecha_ingreso}>
              <Input id="fecha_ingreso" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} aria-invalid={!!errors.fecha_ingreso} />
            </Field>
            <Field
              label="Salario mensual (RD$)"
              htmlFor="salario_mensual"
              error={errors.salario}
              hint={puesto ? `Rango del puesto: ${formatMoney(puesto.salario_min)} – ${formatMoney(puesto.salario_max)}` : undefined}
            >
              <Input
                id="salario_mensual"
                type="number"
                min={0}
                step="0.01"
                value={salario}
                onChange={(e) => setSalario(e.target.value)}
                aria-invalid={!!errors.salario}
              />
            </Field>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="animate-spin" />} Confirmar contratación
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
