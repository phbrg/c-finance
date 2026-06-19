import { describe, expect, it } from 'vitest'
import type { Transaction } from '../types/transaction'
import { parseBackup, serializeBackup } from '../services/backupService'

const transaction: Transaction = {
  id: 'transaction-1',
  title: 'Groceries',
  type: 'expense',
  amount: 25_050,
  paymentDate: '2026-06-18',
  category: 'Food',
  createdAt: '2026-06-18T12:00:00.000Z',
  updatedAt: '2026-06-18T12:00:00.000Z',
}

describe('backup service', () => {
  it('round-trips a valid backup', () => {
    const serialized = serializeBackup([transaction], new Date('2026-06-19T12:00:00.000Z'))
    expect(parseBackup(serialized)).toEqual([transaction])
  })

  it('rejects malformed JSON', () => {
    expect(() => parseBackup('{nope')).toThrow('JSON válido')
  })

  it('rejects an unsupported version', () => {
    expect(() =>
      parseBackup(JSON.stringify({ version: 2, exportedAt: new Date().toISOString(), transactions: [] })),
    ).toThrow('inválido')
  })

  it('rejects invalid transactions without changing persistence', () => {
    expect(() =>
      parseBackup(JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), transactions: [{}] })),
    ).toThrow('inválido')
  })
})
