import { z } from 'zod'
import { financeDataSchema, parseFinanceData } from '../schemas/financeSchema'
import { legacyTransactionListSchema } from '../schemas/legacyTransactionSchema'
import type { FinanceData, FinancialItem, OccurrenceRecord } from '../types/finance'
import type { LegacyTransaction } from '../schemas/legacyTransactionSchema'

export const FINANCE_STORAGE_KEY = 'c-finance:data:v2'
const LEGACY_TRANSACTION_KEYS = [
  'c-finance:transactions:v1',
  'financeiro-local:transactions:v1',
]

export function emptyFinanceData(): FinanceData {
  return { version: 3, welcomeCompleted: false, items: [], occurrenceRecords: [], investments: [] }
}

function storage(): Storage {
  if (typeof window === 'undefined' || !window.localStorage) {
    throw new Error('O armazenamento local não está disponível.')
  }
  return window.localStorage
}

export function loadFinanceData(): FinanceData {
  try {
    const current = storage().getItem(FINANCE_STORAGE_KEY)
    if (current) return parseFinanceData(JSON.parse(current))

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
    key: `${transaction.id}:${transaction.paymentDate}`,
    status: 'completed',
  }))
  return { version: 3, welcomeCompleted: true, items, occurrenceRecords, investments: [] }
}
