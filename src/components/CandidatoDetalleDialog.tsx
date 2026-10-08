import type { ReactNode } from 'react'
import { EstadoBadge } from '@/components/shared'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { CandidatoDetalle } from '@/lib/types'
import { formatCedula, formatDate, formatMoney } from '@/lib/utils'

function Item({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium">{children}</dd>
    </div>
  )
}

/** Vista de consulta (solo lectura) de un candidato con todas sus relaciones. */
export function CandidatoDetalleDialog({ candidato, onClose }: { candidato: CandidatoDetalle | null; onClose: () => void }) {
  return (
    <Dialog open={candidato !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        {candidato && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                {candidato.nombre} <EstadoBadge estado={candidato.estado} />
              </DialogTitle>
            </DialogHeader>

            <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <Item label="Identificador">{candidato.id}</Item>
              <Item label="Cédula">{formatCedula(candidato.cedula)}</Item>
              <Item label="Puesto al que aspira">{candidato.puestos?.nombre ?? '—'}</Item>
              <Item label="Departamento">{candidato.departamento}</Item>
              <Item label="Salario aspirado">{formatMoney(candidato.salario_aspirado)}</Item>
              <Item label="Recomendado por">{candidato.recomendado_por || '—'}</Item>
            </dl>

            <div>
              <h3 className="mb-2 text-sm font-semibold">Competencias</h3>
              <div className="flex flex-wrap gap-1.5">
                {candidato.candidato_competencias.length === 0 && <span className="text-sm text-muted-foreground">—</span>}
                {candidato.candidato_competencias.map((c) => (
                  <Badge key={c.competencias?.id} variant="secondary">
                    {c.competencias?.descripcion}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <h3 className="mb-2 text-sm font-semibold">Capacitaciones</h3>
              <div className="flex flex-wrap gap-1.5">
                {candidato.candidato_capacitaciones.length === 0 && <span className="text-sm text-muted-foreground">—</span>}
                {candidato.candidato_capacitaciones.map((c) => (
                  <Badge key={c.capacitaciones?.id} variant="outline">
                    {c.capacitaciones?.descripcion} ({c.capacitaciones?.nivel})
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <h3 className="mb-2 text-sm font-semibold">Experiencia laboral</h3>
              {candidato.experiencias_laborales.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sin experiencia registrada.</p>
              ) : (
                <ul className="divide-y rounded-md border text-sm">
                  {candidato.experiencias_laborales.map((e) => (
                    <li key={e.id} className="flex flex-col gap-1 p-3 sm:flex-row sm:justify-between">
                      <span>
                        <span className="font-medium">{e.puesto}</span> · {e.empresa}
                      </span>
                      <span className="text-muted-foreground">
                        {formatDate(e.fecha_desde)} – {e.fecha_hasta ? formatDate(e.fecha_hasta) : 'Actual'} · {formatMoney(e.salario)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
