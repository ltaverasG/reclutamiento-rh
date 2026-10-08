import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Briefcase, GraduationCap, Languages, Star, UserCheck, Users } from 'lucide-react'
import { PageHeader } from '@/components/shared'
import { Card, CardContent } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'

const CARDS = [
  { table: 'competencias', label: 'Competencias', icon: Star, to: '/competencias' },
  { table: 'idiomas', label: 'Idiomas', icon: Languages, to: '/idiomas' },
  { table: 'capacitaciones', label: 'Capacitaciones', icon: GraduationCap, to: '/capacitaciones' },
  { table: 'puestos', label: 'Puestos', icon: Briefcase, to: '/puestos' },
  { table: 'candidatos', label: 'Candidatos', icon: Users, to: '/candidatos' },
  { table: 'empleados', label: 'Empleados', icon: UserCheck, to: '/empleados' },
] as const

export default function DashboardPage() {
  const [counts, setCounts] = useState<Record<string, number | null>>({})

  useEffect(() => {
    // Conteos reales desde Supabase (head: true no descarga las filas)
    Promise.all(
      CARDS.map(async ({ table }) => {
        const { count } = await supabase.from(table).select('*', { count: 'exact', head: true })
        return [table, count] as const
      }),
    ).then((entries) => setCounts(Object.fromEntries(entries)))
  }, [])

  return (
    <>
      <PageHeader title="Dashboard" description="Resumen general del sistema de reclutamiento y selección." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CARDS.map(({ table, label, icon: Icon, to }) => (
          <Link key={table} to={to}>
            <Card className="transition-shadow hover:shadow-md">
              <CardContent className="flex items-center gap-4">
                <div className="flex size-11 items-center justify-center rounded-lg bg-primary/10">
                  <Icon className="size-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{label}</p>
                  <p className="text-2xl font-semibold">{counts[table] ?? '—'}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </>
  )
}
