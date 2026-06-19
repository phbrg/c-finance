import { z } from 'zod'
import { financeDataSchema } from '../schemas/financeSchema'
import { transactionSchema } from '../schemas/transactionSchema'
import type { FinanceData, FinancialItem, OccurrenceRecord } from '../types/finance'
import type { Transaction } from '../types/transaction'

export const FINANCE_STORAGE_KEY = 'c-finance:data:v2'
const LEGACY_TRANSACTION_KEYS = [
  'c-finance:transactions:v1',
  'financeiro-local:transactions:v1',
]
const transactionListSchema = z.array(transactionSchema)

export function emptyFinanceData(): FinanceData {
  return { version: 2, items: [], occurrenceRecords: [], investments: [] }
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
    if (current) return financeDataSchema.parse(JSON.parse(current))

    for (const key of LEGACY_TRANSACTION_KEYS) {
      const legacy = storage().getItem(key)
      if (legacy) return migrateTransactions(transactionListSchema.parse(JSON.parse(legacy)))
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

export function migrateTransactions(transactions: Transaction[]): FinanceData {
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
    completedAt: `${transaction.paymentDate}T12:00:00.000Z`,
  }))
  return { version: 2, items, occurrenceRecords, investments: [] }
}
