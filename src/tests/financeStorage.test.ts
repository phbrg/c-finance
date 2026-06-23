import { describe, expect, it } from 'vitest'
import type { LegacyTransaction } from '../schemas/legacyTransactionSchema'
import { FINANCE_STORAGE_KEY, loadFinanceData, migrateTransactions, saveFinanceData } from '../services/financeStorage'

const oldTransaction: LegacyTransaction = {
  id: 'old-1',
  title: 'Old salary',
  type: 'income',
  amount: 200_000,
  paymentDate: '2026-06-05',
  category: 'Salary',
  createdAt: '2026-06-01T12:00:00.000Z',
  updatedAt: '2026-06-01T12:00:00.000Z',
}

describe('finance storage', () => {
  it('migrates old transactions into completed one-time items', () => {
    const data = migrateTransactions([oldTransaction])
    expect(data.items[0]).toMatchObject({ kind: 'one-time', dueDate: '2026-06-05' })
    expect(data.occurrenceRecords[0]).toMatchObject({ status: 'completed' })
  })

  it('loads a legacy key and removes it after saving the current format', () => {
    const legacyKey = 'c-finance:transactions:v1'
    window.localStorage.setItem(legacyKey, JSON.stringify([oldTransaction]))
    const data = loadFinanceData()
    saveFinanceData(data)

    expect(window.localStorage.getItem(FINANCE_STORAGE_KEY)).not.toBeNull()
    expect(window.localStorage.getItem(legacyKey)).toBeNull()
  })

  it('reports corrupted data', () => {
    window.localStorage.setItem(FINANCE_STORAGE_KEY, '{broken')
    expect(() => loadFinanceData()).toThrow('corrompidos')
  })

  it('adds an empty investment portfolio to data saved before the module existed', () => {
    window.localStorage.setItem(FINANCE_STORAGE_KEY, JSON.stringify({
      version: 2,
      items: [],
      occurrenceRecords: [],
    }))
    const loaded = loadFinanceData()
    expect(loaded.investments).toEqual([])
    expect(loaded.welcomeCompleted).toBe(false)
  })
})
