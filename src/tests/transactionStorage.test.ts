import { describe, expect, it } from 'vitest'
import type { Transaction } from '../types/transaction'
import { loadTransactions, saveTransactions, STORAGE_KEY } from '../services/transactionStorage'

const validTransaction: Transaction = {
  id: 'transaction-1',
  title: 'Salary',
  type: 'income',
  amount: 300_000,
  paymentDate: '2026-06-05',
  category: 'Salary',
  createdAt: '2026-06-05T12:00:00.000Z',
  updatedAt: '2026-06-05T12:00:00.000Z',
}

describe('transaction storage', () => {
  it('persists and loads validated transactions', () => {
    saveTransactions([validTransaction])
    expect(loadTransactions()).toEqual([validTransaction])
  })

  it('returns an empty array when there are no saved values', () => {
    expect(loadTransactions()).toEqual([])
  })

  it('reports corrupted stored data', () => {
    window.localStorage.setItem(STORAGE_KEY, '{invalid')
    expect(() => loadTransactions()).toThrow('corrompidos')
  })

  it('rejects structurally invalid stored data', () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([{ title: 'Incomplete' }]))
    expect(() => loadTransactions()).toThrow('incompatíveis')
  })

  it('loads the legacy key and migrates it on the next save', () => {
    const legacyKey = 'financeiro-local:transactions:v1'
    window.localStorage.setItem(legacyKey, JSON.stringify([validTransaction]))

    const transactions = loadTransactions()
    expect(transactions).toEqual([validTransaction])

    saveTransactions(transactions)
    expect(window.localStorage.getItem(STORAGE_KEY)).not.toBeNull()
    expect(window.localStorage.getItem(legacyKey)).toBeNull()
  })
})
