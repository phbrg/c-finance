import { describe, expect, it } from 'vitest'
import type { LegacyTransaction } from '../schemas/legacyTransactionSchema'
import {
  emptyFinanceData,
  FINANCE_STORAGE_KEY,
  getLastBackupAt,
  loadFinanceData,
  markBackupDone,
  migrateTransactions,
  saveFinanceData,
} from '../services/financeStorage'

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
    expect(data.occurrenceRecords[0]).toEqual({ key: 'old-1:2026-06', status: 'completed' })
    expect(data.version).toBe(5)
  })

  it('starts empty in version 5', () => {
    expect(emptyFinanceData()).toEqual({ version: 5, welcomeCompleted: false, items: [], occurrenceRecords: [], cards: [] })
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
    expect(() => loadFinanceData()).toThrow('cópia foi guardada')
    const copies = Object.keys(window.localStorage).filter((key) => key.startsWith(`${FINANCE_STORAGE_KEY}:corrupt-`))
    expect(copies).toHaveLength(1)
    expect(window.localStorage.getItem(copies[0])).toBe('{broken')
    expect(window.localStorage.getItem(FINANCE_STORAGE_KEY)).toBe('{broken')
  })

  it('keeps a copy of incompatible data too', () => {
    window.localStorage.setItem(FINANCE_STORAGE_KEY, JSON.stringify({ version: 9 }))
    expect(() => loadFinanceData()).toThrow('corrompidos')
    expect(Object.keys(window.localStorage).some((key) => key.includes(':corrupt-'))).toBe(true)
  })

  it('remembers when the last backup was done', () => {
    expect(getLastBackupAt()).toBeNull()
    markBackupDone()
    expect(new Date(getLastBackupAt() ?? '').toString()).not.toBe('Invalid Date')
  })

  it('migrates old data and keeps the raw text in a pre-v5 copy first', () => {
    const raw = JSON.stringify({
      version: 4,
      welcomeCompleted: true,
      items: [{
        id: 'inv', title: 'Aporte', type: 'expense', kind: 'one-time', amount: 100, category: 'Investimentos',
        dueDate: '2026-06-10', investmentId: 'x', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z',
      }],
      investments: [{ id: 'x' }],
      cards: [],
      occurrenceRecords: [],
    })
    window.localStorage.setItem(FINANCE_STORAGE_KEY, raw)
    const loaded = loadFinanceData()
    expect(loaded).toMatchObject({ version: 5, items: [] })
    const copies = Object.keys(window.localStorage).filter((key) => key.startsWith(`${FINANCE_STORAGE_KEY}:pre-v5-`))
    expect(copies).toHaveLength(1)
    expect(window.localStorage.getItem(copies[0])).toBe(raw)
    expect(window.localStorage.getItem(FINANCE_STORAGE_KEY)).toBe(raw)
  })

  it('keeps a single pre-v5 copy however many times the old data is loaded', () => {
    window.localStorage.setItem(FINANCE_STORAGE_KEY, JSON.stringify({ version: 3, items: [], investments: [], occurrenceRecords: [] }))
    loadFinanceData()
    loadFinanceData()
    loadFinanceData()
    expect(Object.keys(window.localStorage).filter((key) => key.includes('pre-v5'))).toHaveLength(1)
  })

  it('does not copy data that is already v5, and still loads v2 without a portfolio', () => {
    saveFinanceData(emptyFinanceData())
    loadFinanceData()
    expect(Object.keys(window.localStorage).some((key) => key.includes('pre-v5'))).toBe(false)

    window.localStorage.setItem(FINANCE_STORAGE_KEY, JSON.stringify({ version: 2, items: [], occurrenceRecords: [] }))
    expect(loadFinanceData().welcomeCompleted).toBe(false)
    expect(Object.keys(window.localStorage).some((key) => key.includes('pre-v5'))).toBe(true)
  })
})
