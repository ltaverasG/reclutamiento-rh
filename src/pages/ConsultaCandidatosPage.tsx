import { useEffect, useState } from 'react'
import { Eye, Loader2, Search, X } from 'lucide-react'
import { toast } from 'sonner'
import { CandidatoDetalleDialog } from '@/components/CandidatoDetalleDialog'
import { CheckList, EstadoBadge, Field, PageHeader, TableMessage } from '@/components/shared'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { supabase } from '@/lib/supabase'
import { CANDIDATO_SELECT, type Capacitacion, type CandidatoDetalle, type Competencia, type Puesto } from '@/lib/types'
import { formatCedula, formatMoney } from '@/lib/utils'

const TODOS = 'todos'

export default function ConsultaCandidatosPage() {
  const [puestos, setPuestos] = useState<Puesto[]>([])
  const [competencias, setCompetencias] = useState<Competencia[]>([])
  const [capacitaciones, setCapacitaciones] = useState<Capacitacion[]>([])

  const [puestoId, setPuestoId] = useState(TODOS)
  const [compIds, setCompIds] = useState<number[]>([])
  const [capIds, setCapIds] = useState<number[]>([])

  const [results, setResults] = useState<CandidatoDetalle[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [viewing, setViewing] = useState<CandidatoDetalle | null>(null)

  useEffect(() => {
    Promise.all([
      supabase.from('puestos').select('*').order('nombre').returns<Puesto[]>(),
      supabase.from('competencias').select('*').order('descripcion').returns<Competencia[]>(),
      supabase.from('capacitaciones').select('*').order('descripcion').returns<Capacitacion[]>(),
    ]).then(([p, c, k]) => {
      setPuestos(p.data ?? [])
      setCompetencias(c.data ?? [])
      setCapacitaciones(k.data ?? [])
    })
  }, [])

  async function buscar() {
    setLoading(true)
    let query = supabase.from('candidatos').select(CANDIDATO_SELECT).order('nombre')
    if (puestoId !== TODOS) query = query.eq('puesto_id', Number(puestoId))
    const { data, error } = await query.returns<CandidatoDetalle[]>()
    setLoading(false)
    if (error) return toast.error(error.message)

    // El candidato debe tener TODAS las competencias y capacitaciones seleccionadas
    const filtrados = (data ?? []).filter((c) => {
      const comps = c.candidato_competencias.map((x) => x.competencias?.id)
      const caps = c.candidato_capacitaciones.map((x) => x.capacitaciones?.id)
      return compIds.every((id) => comps.includes(id)) && capIds.every((id) => caps.includes(id))
    })
    setResults(filtrados)
  }

  function limpiar() {
    setPuestoId(TODOS)
    setCompIds([])
    setCapIds([])
    setResults(null)
  }

  return (
    <>
      <PageHeader title="Consulta de Candidatos" description="Busque candidatos combinando puesto, competencias y capacitaciones." />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Criterios de búsqueda</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-3">
          <Field label="Puesto al que aspira">
            <Select value={puestoId} onValueChange={setPuestoId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={TODOS}>Todos los puestos</SelectItem>
                {puestos.map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>
                    {p.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Competencias (debe tener todas)">
            <CheckList options={competencias.map((c) => ({ id: c.id, label: c.descripcion }))} selected={compIds} onChange={setCompIds} />
          </Field>
          <Field label="Capacitaciones (debe tener todas)">
            <CheckList
              options={capacitaciones.map((c) => ({ id: c.id, label: c.descripcion, detail: c.nivel }))}
              selected={capIds}
              onChange={setCapIds}
            />
          </Field>
          <div className="flex gap-2 lg:col-span-3 lg:justify-end">
            <Button variant="outline" onClick={limpiar}>
              <X /> Limpiar
            </Button>
            <Button onClick={buscar} disabled={loading}>
              {loading ? <Loader2 className="animate-spin" /> : <Search />} Buscar
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="gap-0 py-0">
        <div className="border-b p-4 text-sm text-muted-foreground">
          {results === null ? 'Seleccione los criterios y presione Buscar.' : `${results.length} candidato(s) encontrado(s)`}
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cédula</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Puesto</TableHead>
              <TableHead>Competencias</TableHead>
              <TableHead>Capacitaciones</TableHead>
              <TableHead className="text-right">Salario aspirado</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading || !results || results.length === 0 ? (
              <TableMessage colSpan={8} loading={loading} empty={results ? 'Ningún candidato cumple los criterios.' : '—'} />
            ) : (
              results.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>{formatCedula(c.cedula)}</TableCell>
                  <TableCell className="font-medium">{c.nombre}</TableCell>
                  <TableCell>{c.puestos?.nombre}</TableCell>
                  <TableCell className="whitespace-normal">
                    <div className="flex max-w-xs flex-wrap gap-1">
                      {c.candidato_competencias.map((x) => (
                        <Badge key={x.competencias?.id} variant="secondary">
                          {x.competencias?.descripcion}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-normal">
                    <div className="flex max-w-xs flex-wrap gap-1">
                      {c.candidato_capacitaciones.map((x) => (
                        <Badge key={x.capacitaciones?.id} variant="outline">
                          {x.capacitaciones?.descripcion}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">{formatMoney(c.salario_aspirado)}</TableCell>
                  <TableCell>
                    <EstadoBadge estado={c.estado} />
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => setViewing(c)}>
                      <Eye /> Ver
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <CandidatoDetalleDialog candidato={viewing} onClose={() => setViewing(null)} />
    </>
  )
}
