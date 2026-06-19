import { financeDataSchema } from '../schemas/financeSchema'
import type { FinanceData } from '../types/finance'

const MAX_BACKUP_SIZE = 10 * 1024 * 1024

export function serializeFinanceBackup(data: FinanceData): string {
  return JSON.stringify({ exportedAt: new Date().toISOString(), data }, null, 2)
}

export function parseFinanceBackup(content: string): FinanceData {
  if (new Blob([content]).size > MAX_BACKUP_SIZE) throw new Error('O arquivo excede 10 MB.')
  try {
    const parsed: unknown = JSON.parse(content)
    if (typeof parsed !== 'object' || parsed === null || !('data' in parsed)) {
      throw new Error('Formato de backup inválido.')
    }
    const result = financeDataSchema.safeParse((parsed as { data: unknown }).data)
    if (!result.success) throw new Error('Backup inválido ou incompatível.')
    return result.data
  } catch (error: unknown) {
    if (error instanceof SyntaxError) throw new Error('O arquivo não contém JSON válido.', { cause: error })
    throw error instanceof Error ? error : new Error('Não foi possível importar o backup.')
  }
}

export function downloadFinanceBackup(data: FinanceData): void {
  const blob = new Blob([serializeFinanceBackup(data)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `c-finance-${new Date().toISOString().slice(0, 10)}.json`
  link.click()
  URL.revokeObjectURL(url)
}
