import { z } from 'zod'
import { financeDataSchema, parseFinanceData } from '../schemas/financeSchema'
import { legacyTransactionListSchema } from '../schemas/legacyTransactionSchema'
import type { FinanceData, FinancialItem, OccurrenceRecord } from '../types/finance'
import type { LegacyTransaction } from '../schemas/legacyTransactionSchema'

export const FINANCE_STORAGE_KEY = 'c-finance:data:v2'
const LAST_BACKUP_KEY = 'c-finance:last-backup'
const LEGACY_TRANSACTION_KEYS = [
  'c-finance:transactions:v1',
  'financeiro-local:transactions:v1',
]

export function emptyFinanceData(): FinanceData {
  return { version: 5, welcomeCompleted: false, items: [], occurrenceRecords: [], cards: [] }
}

function storage(): Storage {
  if (typeof window === 'undefined' || !window.localStorage) {
    throw new Error('O armazenamento local não está disponível.')
  }
  return window.localStorage
}

function hasKeyWithPrefix(prefix: string): boolean {
  const store = storage()
  return Array.from({ length: store.length }, (_, index) => store.key(index)).some((key) => key?.startsWith(prefix))
}

export function loadFinanceData(): FinanceData {
  try {
    const current = storage().getItem(FINANCE_STORAGE_KEY)
    if (current) {
      try {
        const raw: unknown = JSON.parse(current)
        const data = parseFinanceData(raw)
        // v5 drops cards and investments: keep the untouched text before the first save rewrites it.
        const version = (raw as { version?: unknown } | null)?.version
        if (typeof version === 'number' && version < 5 && !hasKeyWithPrefix(`${FINANCE_STORAGE_KEY}:pre-v5-`)) {
          // One copy only: until the first save the old data stays in place and every load would add another.
          try { storage().setItem(`${FINANCE_STORAGE_KEY}:pre-v5-${Date.now()}`, current) } catch { /* storage full: migration still works */ }
        }
        return data
      } catch (error: unknown) {
        if (!(error instanceof SyntaxError || error instanceof z.ZodError)) throw error
        const copyKey = `${FINANCE_STORAGE_KEY}:corrupt-${Date.now()}`
        let saved = false
        try {
          storage().setItem(copyKey, current)
          saved = true
        } catch { /* storage full: the error below just omits the copy note */ }
        throw new Error(
          `Os dados locais estão corrompidos ou são incompatíveis.${saved ? ` Uma cópia foi guardada em "${copyKey}".` : ''}`,
          { cause: error },
        )
      }
    }

    for (const key of LEGACY_TRANSACTION_KEYS) {
      const legacy = storage().getItem(key)
      if (legacy) return migrateTransactions(legacyTransactionListSchema.parse(JSON.parse(legacy)))
    }
    return emptyFinanceData()
  } catch (error: unknown) {
    if (error instanceof SyntaxError || error instanceof z.ZodError) {
      throw new Error('Os dados locais estão corrompidos ou são incompatíveis.', { cause: error })
    }
    throw error instanceof Error ? error : new Error('Não foi possível carregar os dados.')
  }
}

export function getLastBackupAt(): string | null {
  try {
    return storage().getItem(LAST_BACKUP_KEY)
  } catch {
    return null
  }
}

export function markBackupDone(): void {
  try {
    storage().setItem(LAST_BACKUP_KEY, new Date().toISOString())
  } catch { /* the backup file was already downloaded; the reminder date is optional */ }
}

export function saveFinanceData(data: FinanceData): void {
  try {
    const validated = financeDataSchema.parse(data)
    storage().setItem(FINANCE_STORAGE_KEY, JSON.stringify(validated))
    for (const key of LEGACY_TRANSACTION_KEYS) storage().removeItem(key)
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      throw new Error('Não foi possível salvar dados inválidos.', { cause: error })
    }
    throw new Error('Não foi possível salvar. Verifique o espaço disponível.', { cause: error })
  }
}

export function migrateTransactions(transactions: LegacyTransaction[]): FinanceData {
  const items: FinancialItem[] = transactions.map((transaction) => ({
    id: transaction.id,
    title: transaction.title,
    type: transaction.type,
    kind: 'one-time',
    amount: transaction.amount,
    category: transaction.category,
    ...(transaction.notes ? { notes: transaction.notes } : {}),
    dueDate: transaction.paymentDate,
    createdAt: transaction.createdAt,
    updatedAt: transaction.updatedAt,
  }))
  const occurrenceRecords: OccurrenceRecord[] = transactions.map((transaction) => ({
    key: `${transaction.id}:${transaction.paymentDate.slice(0, 7)}`,
    status: 'completed',
  }))
  return { version: 5, welcomeCompleted: true, items, occurrenceRecords, cards: [] }
}
