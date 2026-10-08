import { SimpleCatalogPage } from '@/components/SimpleCatalogPage'

export default function CompetenciasPage() {
  return (
    <SimpleCatalogPage
      table="competencias"
      field="descripcion"
      fieldLabel="Descripción"
      title="Competencias"
      singular="Competencia"
      genero="a"
      description="Competencias organizacionales y técnico-operativas que se evalúan en los candidatos."
    />
  )
}
