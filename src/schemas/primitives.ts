import { z } from 'zod'

const datePattern = /^\d{4}-\d{2}-\d{2}$/
const monthPattern = /^\d{4}-\d{2}$/

export function isValidIsoDate(value: string): boolean {
  if (!datePattern.test(value)) return false
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
}

export function isValidIsoMonth(value: string): boolean {
  if (!monthPattern.test(value)) return false
  const month = Number(value.slice(5, 7))
  return month >= 1 && month <= 12
}

export const isoDateSchema = z.string().refine(isValidIsoDate, 'Informe uma data válida.')
export const isoMonthSchema = z.string().refine(isValidIsoMonth, 'Informe um mês válido.')
export const moneySchema = z.number().int().safe()
