import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Eye, Pencil, Plus, UserCheck } from 'lucide-react'
import { CandidatoDetalleDialog } from '@/components/CandidatoDetalleDialog'
import { ContratarDialog } from '@/components/ContratarDialog'
import { EstadoBadge, PageHeader, TableMessage } from '@/components/shared'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useQuery } from '@/lib/hooks'
import { supabase } from '@/lib/supabase'
import { CANDIDATO_SELECT, type CandidatoDetalle } from '@/lib/types'
import { formatCedula, formatMoney } from '@/lib/utils'

export default function CandidatosPage() {
  const { data, loading, reload } = useQuery(() =>
    supabase.from('candidatos').select(CANDIDATO_SELECT).order('id', { ascending: false }).returns<CandidatoDetalle[]>(),
  )
  const [search, setSearch] = useState('')
  const [viewing, setViewing] = useState<CandidatoDetalle | null>(null)
  const [hiring, setHiring] = useState<CandidatoDetalle | null>(null)

  const q = search.toLowerCase().replace(/-/g, '')
  const rows = (data ?? []).filter((c) => c.nombre.toLowerCase().includes(q) || c.cedula.includes(q))

  return (
    <>
      <PageHeader
        title="Candidatos"
        description="Registro de candidatos y proceso de selección (contratación)."
        action={
          <Button asChild>
            <Link to="/candidatos/nuevo">
              <Plus /> Nuevo candidato
            </Link>
          </Button>
        }
      />

      <Card className="gap-0 py-0">
        <div className="border-b p-4">
          <Input placeholder="Buscar por nombre o cédula…" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">ID</TableHead>
              <TableHead>Cédula</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Puesto al que aspira</TableHead>
              <TableHead>Departamento</TableHead>
              <TableHead className="text-right">Salario aspirado</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading || rows.length === 0 ? (
              <TableMessage colSpan={8} loading={loading} />
            ) : (
              rows.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>{c.id}</TableCell>
                  <TableCell>{formatCedula(c.cedula)}</TableCell>
                  <TableCell className="font-medium">{c.nombre}</TableCell>
                  <TableCell>{c.puestos?.nombre}</TableCell>
                  <TableCell>{c.departamento}</TableCell>
                  <TableCell className="text-right">{formatMoney(c.salario_aspirado)}</TableCell>
                  <TableCell>
                    <EstadoBadge estado={c.estado} />
                  </TableCell>
                  <TableCell className="space-x-2 text-right">
                    <Button variant="ghost" size="sm" onClick={() => setViewing(c)}>
                      <Eye /> Ver
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/candidatos/${c.id}/editar`}>
                        <Pencil /> Editar
                      </Link>
                    </Button>
                    <Button size="sm" disabled={c.estado === 'Contratado'} onClick={() => setHiring(c)}>
                      <UserCheck /> {c.estado === 'Contratado' ? 'Contratado' : 'Contratar'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <CandidatoDetalleDialog candidato={viewing} onClose={() => setViewing(null)} />
      <ContratarDialog
        candidato={hiring}
        onClose={() => setHiring(null)}
        onHired={() => {
          setHiring(null)
          reload()
        }}
      />
    </>
  )
}
