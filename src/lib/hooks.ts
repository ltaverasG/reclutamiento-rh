import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import type { ZodError } from 'zod'

/**
 * Ejecuta una consulta a Supabase al montar el componente y expone `reload`
 * para refrescar los datos después de guardar.
 */
export function useQuery<T>(fetcher: () => PromiseLike<{ data: T | null; error: { message: string } | null }>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    setLoading(true)
    const { data, error } = await fetcher()
    if (error) toast.error(`Error al cargar datos: ${error.message}`)
    setData(data)
    setLoading(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  useEffect(() => {
    void reload()
  }, [reload])

  return { data, loading, reload }
}

/** Convierte los errores de Zod en { campo: mensaje } para mostrarlos en el formulario. */
export function zodErrors(error: ZodError): Record<string, string> {
  const out: Record<string, string> = {}
  for (const issue of error.issues) {
    const key = issue.path.join('.')
    if (!out[key]) out[key] = issue.message
  }
  return out
}
