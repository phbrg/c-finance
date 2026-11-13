import { describe, expect, it } from 'vitest'
import { vi } from 'vitest'
import { getLastBackupAt } from '../services/financeStorage'
import type { FinanceData } from '../types/finance'
import { downloadFinanceBackup, parseFinanceBackup, serializeFinanceBackup } from '../services/financeBackupService'

const emptyData: FinanceData = {
  version: 5,
  welcomeCompleted: true,
  items: [],
  occurrenceRecords: [],
  cards: [],
}

describe('finance backup service', () => {
  it('round-trips the current backup format', () => {
    expect(parseFinanceBackup(serializeFinanceBackup(emptyData))).toEqual(emptyData)
  })

  it('rejects malformed JSON', () => {
    expect(() => parseFinanceBackup('{broken')).toThrow('JSON válido')
  })

  it('rejects impossible calendar dates', () => {
    const invalid = {
      exportedAt: '2026-01-01T00:00:00.000Z',
      data: {
        ...emptyData,
        items: [{
          id: 'item', title: 'Conta', type: 'expense', kind: 'one-time', amount: 100,
          category: 'Casa', dueDate: '2026-02-31', createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        }],
      },
    }
    expect(() => parseFinanceBackup(JSON.stringify(invalid))).toThrow('incompatível')
  })

  it('migrates version 2 and discards the synthetic completion timestamp', () => {
    const migrated = parseFinanceBackup(JSON.stringify({
      exportedAt: '2026-01-01T00:00:00.000Z',
      data: {
        version: 2,
        welcomeCompleted: true,
        items: [],
        investments: [],
        occurrenceRecords: [{
          key: 'item:2026-01-01',
          status: 'completed',
          completedAt: '2026-01-01T12:00:00.000Z',
        }],
      },
    }))
    expect(migrated.version).toBe(5)
    expect(migrated.occurrenceRecords[0]).toEqual({ key: 'item:2026-01', status: 'completed' })
  })

  it('migrates a version 1 transaction backup', () => {
    const migrated = parseFinanceBackup(JSON.stringify({
      version: 1,
      exportedAt: '2026-01-01T00:00:00.000Z',
      transactions: [{
        id: 'old', title: 'Salário', type: 'income', amount: 100_000,
        paymentDate: '2026-01-05', category: 'Renda',
        createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z',
      }],
    }))
    expect(migrated.items[0]).toMatchObject({ id: 'old', dueDate: '2026-01-05' })
    expect(migrated.occurrenceRecords[0]).toMatchObject({ key: 'old:2026-01', status: 'completed' })
  })

  it('marks the backup as done when downloading', () => {
    URL.createObjectURL = vi.fn(() => 'blob:x')
    URL.revokeObjectURL = vi.fn()
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined)
    downloadFinanceBackup(emptyData)
    expect(getLastBackupAt()).not.toBeNull()
  })
})
