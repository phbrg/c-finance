import { parseFinanceData } from '../schemas/financeSchema'
import { legacyBackupSchema } from '../schemas/legacyTransactionSchema'
import type { FinanceData } from '../types/finance'
import { migrateTransactions } from './financeStorage'

export const MAX_BACKUP_SIZE = 10 * 1024 * 1024

export function serializeFinanceBackup(data: FinanceData): string {
  return JSON.stringify({ exportedAt: new Date().toISOString(), data }, null, 2)
}

export function parseFinanceBackup(content: string): FinanceData {
  if (new Blob([content]).size > MAX_BACKUP_SIZE) throw new Error('O arquivo excede 10 MB.')
  try {
    const parsed: unknown = JSON.parse(content)
    const legacy = legacyBackupSchema.safeParse(parsed)
    if (legacy.success) return migrateTransactions(legacy.data.transactions)
    if (typeof parsed !== 'object' || parsed === null || !('data' in parsed)) {
      throw new Error('Formato de backup inválido.')
    }
    return parseFinanceData((parsed as { data: unknown }).data)
  } catch (error: unknown) {
    if (error instanceof SyntaxError) throw new Error('O arquivo não contém JSON válido.', { cause: error })
    if (error instanceof Error && error.message.startsWith('Formato')) throw error
    throw new Error('Backup inválido ou incompatível.', { cause: error })
  }
}

export async function readFinanceBackupFile(file: File): Promise<string> {
  if (file.size > MAX_BACKUP_SIZE) throw new Error('O arquivo excede 10 MB.')
  try {
    return await file.text()
  } catch (error: unknown) {
    throw new Error('Não foi possível ler o arquivo selecionado.', { cause: error })
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
