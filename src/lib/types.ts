export type Estado = 'Activo' | 'Inactivo'

export const NIVELES_CAPACITACION = ['Grado', 'Postgrado', 'Maestría', 'Doctorado', 'Técnico', 'Gestión'] as const
export const NIVELES_RIESGO = ['Alto', 'Medio', 'Bajo'] as const

export interface Competencia {
  id: number
  descripcion: string
  estado: Estado
}

export interface Idioma {
  id: number
  nombre: string
  estado: Estado
}

export interface Capacitacion {
  id: number
  descripcion: string
  nivel: (typeof NIVELES_CAPACITACION)[number]
  fecha_desde: string
  fecha_hasta: string
  institucion: string
}

export interface Puesto {
  id: number
  nombre: string
  nivel_riesgo: (typeof NIVELES_RIESGO)[number]
  salario_min: number
  salario_max: number
  estado: Estado
}

export interface ExperienciaLaboral {
  id?: number
  candidato_id?: number
  empresa: string
  puesto: string
  fecha_desde: string
  fecha_hasta: string | null
  salario: number
}

export interface Candidato {
  id: number
  cedula: string
  nombre: string
  puesto_id: number
  departamento: string
  salario_aspirado: number
  recomendado_por: string | null
  estado: 'En proceso' | 'Contratado'
}

/** Candidato con sus relaciones, tal como lo devuelve el select anidado de Supabase. */
export interface CandidatoDetalle extends Candidato {
  puestos: Pick<Puesto, 'id' | 'nombre' | 'salario_min' | 'salario_max'> | null
  candidato_competencias: { competencias: Pick<Competencia, 'id' | 'descripcion'> | null }[]
  candidato_capacitaciones: { capacitaciones: Pick<Capacitacion, 'id' | 'descripcion' | 'nivel'> | null }[]
  experiencias_laborales: ExperienciaLaboral[]
}

export interface Empleado {
  id: number
  candidato_id: number | null
  cedula: string
  nombre: string
  fecha_ingreso: string
  departamento: string
  puesto_id: number
  salario: number
  estado: Estado
  puestos: Pick<Puesto, 'nombre'> | null
}

export const CANDIDATO_SELECT = `
  *,
  puestos ( id, nombre, salario_min, salario_max ),
  candidato_competencias ( competencias ( id, descripcion ) ),
  candidato_capacitaciones ( capacitaciones ( id, descripcion, nivel ) ),
  experiencias_laborales ( * )
`
