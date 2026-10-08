import { useState } from 'react'
import { Power } from 'lucide-react'
import { toast } from 'sonner'
import { EstadoBadge, PageHeader, TableMessage } from '@/components/shared'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useQuery } from '@/lib/hooks'
import { supabase } from '@/lib/supabase'
import type { Empleado, Estado } from '@/lib/types'
import { dbErrorMessage, formatCedula, formatDate, formatMoney } from '@/lib/utils'

export default function EmpleadosPage() {
  const { data, loading, reload } = useQuery(() =>
    supabase.from('empleados').select('*, puestos ( nombre )').order('fecha_ingreso', { ascending: false }).returns<Empleado[]>(),
  )
  const [search, setSearch] = useState('')

  const q = search.toLowerCase().replace(/-/g, '')
  const rows = (data ?? []).filter((e) => e.nombre.toLowerCase().includes(q) || e.cedula.includes(q))

  async function toggleEstado(e: Empleado) {
    const nuevo: Estado = e.estado === 'Activo' ? 'Inactivo' : 'Activo'
    const { error } = await supabase.from('empleados').update({ estado: nuevo }).eq('id', e.id)
    if (error) return toast.error(dbErrorMessage(error))
    toast.success(`Empleado ${nuevo === 'Activo' ? 'activado' : 'desactivado'}`)
    reload()
  }

  return (
    <>
      <PageHeader title="Empleados" description="Empleados registrados a partir del proceso de selección de candidatos." />

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
              <TableHead>Fecha de ingreso</TableHead>
              <TableHead>Departamento</TableHead>
              <TableHead>Puesto</TableHead>
              <TableHead className="text-right">Salario mensual</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading || rows.length === 0 ? (
              <TableMessage colSpan={9} loading={loading} empty="Aún no hay empleados. Contrate un candidato desde el módulo Candidatos." />
            ) : (
              rows.map((e) => (
                <TableRow key={e.id}>
                  <TableCell>{e.id}</TableCell>
                  <TableCell>{formatCedula(e.cedula)}</TableCell>
                  <TableCell className="font-medium">{e.nombre}</TableCell>
                  <TableCell>{formatDate(e.fecha_ingreso)}</TableCell>
                  <TableCell>{e.departamento}</TableCell>
                  <TableCell>{e.puestos?.nombre}</TableCell>
                  <TableCell className="text-right">{formatMoney(e.salario)}</TableCell>
                  <TableCell>
                    <EstadoBadge estado={e.estado} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => toggleEstado(e)}>
                      <Power /> {e.estado === 'Activo' ? 'Desactivar' : 'Activar'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </>
  )
}
