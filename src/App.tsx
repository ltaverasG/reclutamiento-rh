import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { supabaseConfigured } from '@/lib/supabase'
import LoginPage from '@/pages/LoginPage'
import DashboardPage from '@/pages/DashboardPage'
import CompetenciasPage from '@/pages/CompetenciasPage'
import IdiomasPage from '@/pages/IdiomasPage'
import CapacitacionesPage from '@/pages/CapacitacionesPage'
import PuestosPage from '@/pages/PuestosPage'
import CandidatosPage from '@/pages/CandidatosPage'
import CandidatoFormPage from '@/pages/CandidatoFormPage'
import EmpleadosPage from '@/pages/EmpleadosPage'
import ConsultaCandidatosPage from '@/pages/ConsultaCandidatosPage'
import ReporteIngresosPage from '@/pages/ReporteIngresosPage'

export default function App() {
  if (!supabaseConfigured) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="max-w-md rounded-lg border bg-card p-6 text-sm shadow-sm">
          <h1 className="mb-2 text-lg font-semibold">Falta configurar Supabase</h1>
          <p className="text-muted-foreground">
            Crea el archivo <code>.env.local</code> (copia de <code>.env.example</code>) con <code>VITE_SUPABASE_URL</code> y{' '}
            <code>VITE_SUPABASE_ANON_KEY</code>, y reinicia <code>npm run dev</code>.
          </p>
        </div>
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<AppLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="competencias" element={<CompetenciasPage />} />
        <Route path="idiomas" element={<IdiomasPage />} />
        <Route path="capacitaciones" element={<CapacitacionesPage />} />
        <Route path="puestos" element={<PuestosPage />} />
        <Route path="candidatos" element={<CandidatosPage />} />
        <Route path="candidatos/nuevo" element={<CandidatoFormPage />} />
        <Route path="candidatos/:id/editar" element={<CandidatoFormPage />} />
        <Route path="empleados" element={<EmpleadosPage />} />
        <Route path="consulta" element={<ConsultaCandidatosPage />} />
        <Route path="reporte" element={<ReporteIngresosPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
