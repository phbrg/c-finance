import { describe, expect, it } from 'vitest'
import { parseFinanceData } from '../schemas/financeSchema'

const stamp = '2026-01-01T00:00:00.000Z'
const item = (id: string, category: string) => ({
  id, title: id, type: 'expense', kind: 'one-time', amount: 100, category, dueDate: '2026-06-10',
  createdAt: stamp, updatedAt: stamp,
})

describe('finance schema', () => {
  it('migrates v3 date keys to month keys', () => {
    const data = parseFinanceData({
      version: 3,
      welcomeCompleted: true,
      items: [item('a', 'Casa')],
      investments: [],
      occurrenceRecords: [
        { key: 'a:2026-06-10', status: 'completed', confirmedAt: stamp },
        { key: 'a:2026-07-10', status: 'skipped' },
      ],
    })
    expect(data.version).toBe(5)
    expect(data.occurrenceRecords).toEqual([
      { key: 'a:2026-06', status: 'completed', confirmedAt: stamp },
      { key: 'a:2026-07', status: 'skipped' },
    ])
  })

  it('collapses two date keys of the same month into one record', () => {
    const data = parseFinanceData({
      version: 3,
      items: [item('a', 'Casa')],
      occurrenceRecords: [
        { key: 'a:2026-06-10', status: 'planned' },
        { key: 'a:2026-06-12', status: 'completed' },
      ],
    })
    expect(data.occurrenceRecords).toEqual([{ key: 'a:2026-06', status: 'completed' }])
  })

  it('turns the v2 opening balance date into a month', () => {
    const data = parseFinanceData({
      version: 2, items: [], occurrenceRecords: [], openingBalance: { amount: 5_000, date: '2026-03-17' },
    })
    expect(data.openingBalance).toEqual({ amount: 5_000, month: '2026-03' })
  })

  it('unifies categories that differ by case', () => {
    const data = parseFinanceData({
      version: 5, items: [item('a', 'mercado'), item('b', 'Mercado'), item('c', 'MERCADO')],
      occurrenceRecords: [],
    })
    expect(new Set(data.items.map((entry) => entry.category))).toEqual(new Set(['Mercado']))
  })

  it('drops old cards, investments and what is tied to them when migrating v4', () => {
    const data = parseFinanceData({
      version: 4,
      welcomeCompleted: true,
      items: [
        item('plain', 'Casa'),
        { ...item('card-buy', 'Casa'), cardId: 'c', installments: 1 },
        { ...item('aporte', 'Investimentos'), investmentId: 'inv' },
        { ...item('split', 'Casa'), installments: 1 },
      ],
      cards: [{ id: 'c', name: 'Nubank', closingDay: 5, dueDay: 12, createdAt: stamp, updatedAt: stamp }],
      investments: [{ id: 'inv', name: 'Reserva' }],
      openingBalance: { amount: 7_000, month: '2026-02' },
      occurrenceRecords: [
        { key: 'plain:2026-06', status: 'completed' },
        { key: 'card-buy:2026-06', status: 'completed' },
        { key: 'aporte:2026-06', status: 'completed' },
        { key: 'card:c:2026-07', status: 'completed' },
      ],
    })
    expect(data.version).toBe(5)
    expect(data.items.map((entry) => entry.id)).toEqual(['plain', 'split'])
    expect(data.items[1].installments).toBeUndefined()
    expect(data.occurrenceRecords).toEqual([{ key: 'plain:2026-06', status: 'completed' }])
    expect(data.openingBalance).toEqual({ amount: 7_000, month: '2026-02' })
    expect(data.cards).toEqual([])
    expect(data).not.toHaveProperty('investments')
  })

  it('validates installments on saved items', () => {
    const base = { version: 5, items: [{ ...item('a', 'Casa'), installments: 3 }], occurrenceRecords: [] }
    expect(parseFinanceData(base).items[0].installments).toBe(3)
    expect(() => parseFinanceData({ ...base, items: [{ ...item('a', 'Casa'), installments: 1 }] })).toThrow()
  })

  it('cards default to empty and a cardId must point to a card', () => {
    const base = { version: 5, items: [{ ...item('a', 'Casa'), cardId: 'c' }], occurrenceRecords: [] }
    expect(() => parseFinanceData(base)).toThrow()
    const card = { id: 'c', name: 'Nubank', closingDay: 5, dueDay: 12, createdAt: stamp, updatedAt: stamp }
    expect(parseFinanceData({ ...base, cards: [card] }).items[0].cardId).toBe('c')
    expect(parseFinanceData({ version: 5, items: [], occurrenceRecords: [] }).cards).toEqual([])
    expect(() => parseFinanceData({ ...base, cards: [{ ...card, closingDay: 32 }] })).toThrow()
  })

  it('only expenses can have a card', () => {
    const card = { id: 'c', name: 'Nubank', closingDay: 5, dueDay: 12, createdAt: stamp, updatedAt: stamp }
    const income = { ...item('a', 'Casa'), type: 'income', cardId: 'c' }
    expect(() => parseFinanceData({ version: 5, items: [income], occurrenceRecords: [], cards: [card] })).toThrow()
  })

  it('rejects unknown versions', () => {
    expect(() => parseFinanceData({ version: 9, items: [], occurrenceRecords: [] })).toThrow()
  })
})
