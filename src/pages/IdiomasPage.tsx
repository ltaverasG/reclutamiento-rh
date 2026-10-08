import { SimpleCatalogPage } from '@/components/SimpleCatalogPage'

export default function IdiomasPage() {
  return (
    <SimpleCatalogPage
      table="idiomas"
      field="nombre"
      fieldLabel="Nombre"
      title="Idiomas"
      singular="Idioma"
      genero="o"
      description="Catálogo de idiomas."
    />
  )
}
