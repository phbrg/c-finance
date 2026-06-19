import { backupSchema } from '../schemas/backupSchema'
import type { FinanceBackup } from '../types/backup'
import type { Transaction } from '../types/transaction'

const MAX_BACKUP_SIZE = 10 * 1024 * 1024

export function serializeBackup(transactions: Transaction[], now = new Date()): string {
  const backup: FinanceBackup = {
    version: 1,
    exportedAt: now.toISOString(),
    transactions,
  }
  return JSON.stringify(backup, null, 2)
}

export function parseBackup(content: string): Transaction[] {
  if (new Blob([content]).size > MAX_BACKUP_SIZE) {
    throw new Error('O arquivo excede o limite de 10 MB.')
  }

  try {
    const result = backupSchema.safeParse(JSON.parse(content))
    if (!result.success) throw new Error('Formato de backup inválido ou incompatível.')
    return result.data.transactions
  } catch (error: unknown) {
    if (error instanceof SyntaxError) {
      throw new Error('O arquivo não contém um JSON válido.', { cause: error })
    }
    throw error instanceof Error ? error : new Error('Não foi possível importar o backup.')
  }
}

export function downloadBackup(transactions: Transaction[]): void {
  const blob = new Blob([serializeBackup(transactions)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `c-finance-${new Date().toISOString().slice(0, 10)}.json`
  link.click()
  URL.revokeObjectURL(url)
}
