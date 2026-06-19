import { z } from 'zod'
import { transactionSchema } from '../schemas/transactionSchema'
import type { Transaction } from '../types/transaction'

export const STORAGE_KEY = 'c-finance:transactions:v1'
const LEGACY_STORAGE_KEY = 'financeiro-local:transactions:v1'
const storedTransactionsSchema = z.array(transactionSchema)

function getStorage(): Storage {
  if (typeof window === 'undefined' || !window.localStorage) {
    throw new Error('O armazenamento local não está disponível neste navegador.')
  }
  return window.localStorage
}

export function loadTransactions(): Transaction[] {
  try {
    const storage = getStorage()
    const rawValue = storage.getItem(STORAGE_KEY) ?? storage.getItem(LEGACY_STORAGE_KEY)
    if (!rawValue) return []
    return storedTransactionsSchema.parse(JSON.parse(rawValue))
  } catch (error: unknown) {
    if (error instanceof SyntaxError || error instanceof z.ZodError) {
      throw new Error('Os dados salvos estão corrompidos ou são incompatíveis.', {
        cause: error,
      })
    }
    throw error instanceof Error ? error : new Error('Não foi possível carregar os dados.')
  }
}

export function saveTransactions(transactions: Transaction[]): void {
  try {
    const validated = storedTransactionsSchema.parse(transactions)
    const storage = getStorage()
    storage.setItem(STORAGE_KEY, JSON.stringify(validated))
    storage.removeItem(LEGACY_STORAGE_KEY)
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      throw new Error('Não foi possível salvar dados inválidos.', { cause: error })
    }
    throw new Error('Não foi possível salvar. Verifique o espaço disponível no navegador.', {
      cause: error,
    })
  }
}
