import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const moneda = new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP' })

export function formatMoney(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === '') return '—'
  return moneda.format(Number(value))
}

/** Las fechas llegan como 'YYYY-MM-DD'; se formatean sin conversión de zona horaria. */
export function formatDate(value: string | null | undefined) {
  if (!value) return '—'
  const [y, m, d] = value.split('-')
  return `${d}/${m}/${y}`
}

export function formatCedula(cedula: string) {
  const c = cedula.replace(/\D/g, '')
  if (c.length !== 11) return cedula
  return `${c.slice(0, 3)}-${c.slice(3, 10)}-${c.slice(10)}`
}

/** Traduce errores de PostgreSQL/Supabase a mensajes comprensibles. */
export function dbErrorMessage(error: { code?: string; message: string }) {
  if (error.code === '23505') return 'Ya existe un registro con esos datos (valor duplicado).'
  if (error.code === '23503') return 'No se puede completar: el registro está relacionado con otros datos.'
  if (error.code === '23514') return 'Los datos no cumplen las reglas de validación.'
  return error.message
}
