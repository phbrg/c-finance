import { describe, expect, it } from 'vitest'
import type { FinanceData } from '../types/finance'
import { simulatePurchase } from '../utils/simulation'

const stamp = '2026-01-01T00:00:00.000Z'
const data: FinanceData = {
  version: 5,
  welcomeCompleted: true,
  openingBalance: { amount: 100_000, month: '2026-06' },
  items: [
    {
      id: 'salary', title: 'Salário', type: 'income', kind: 'recurring', amount: 300_000, category: 'Renda',
      recurrence: { dayOfMonth: 5, startMonth: '2026-06', active: true }, createdAt: stamp, updatedAt: stamp,
    },
    {
      id: 'rent', title: 'Aluguel', type: 'expense', kind: 'recurring', amount: 290_000, category: 'Casa',
      recurrence: { dayOfMonth: 10, startMonth: '2026-06', active: true }, createdAt: stamp, updatedAt: stamp,
    },
  ],
  occurrenceRecords: [],
  cards: [{ id: 'nu', name: 'Nubank', dueDay: 12, limit: 100_000, createdAt: stamp, updatedAt: stamp }],
}
const input = { title: 'Notebook', amount: 60_000, installments: 3, date: '2026-07-15', category: 'Nubank' }

describe('simulatePurchase', () => {
  it('compares the balance before and after, starting in the purchase month', () => {
    const result = simulatePurchase(data, input, 4)
    expect(result.months.map((point) => point.month)).toEqual(['2026-07', '2026-08', '2026-09', '2026-10'])
    // Each month nets +10000 from the opening balance of 100000 in June.
    expect(result.months.map((point) => point.closingBefore)).toEqual([120_000, 130_000, 140_000, 150_000])
    expect(result.months.map((point) => point.added)).toEqual([20_000, 20_000, 20_000, 0])
    expect(result.months.map((point) => point.closingAfter)).toEqual([100_000, 90_000, 80_000, 90_000])
    expect(result.firstNegativeMonth).toBeUndefined()
    expect(result.worstMonth).toBe('2026-09')
  })

  it('finds the first month that goes negative', () => {
    const result = simulatePurchase(data, { ...input, amount: 600_000, installments: 1, date: '2026-08-01' }, 3)
    expect(result.months[0]).toMatchObject({ month: '2026-08', added: 600_000 })
    expect(result.firstNegativeMonth).toBe('2026-08')
    expect(result.worstMonth).toBe('2026-08')
  })

  it('with a card each installment lands on the invoice of its month and the limit is reported', () => {
    // Bought 07-15 in 3x: July, August and September invoices, no closing day pushing it to August.
    const result = simulatePurchase(data, { ...input, cardId: 'nu' }, 5)
    expect(result.months.map((point) => point.added)).toEqual([20_000, 20_000, 20_000, 0, 0])
    expect(result.months.map((point) => point.closingAfter)).toEqual([100_000, 90_000, 80_000, 90_000, 100_000])
    expect(result.limit).toEqual({ before: 0, after: 60_000, limit: 100_000 })
  })

  it('reports a limit that would be exceeded', () => {
    const result = simulatePurchase(data, { ...input, cardId: 'nu', amount: 150_000 }, 3)
    expect(result.limit).toMatchObject({ after: 150_000, limit: 100_000 })
  })

  it('has no limit info without a card', () => {
    expect(simulatePurchase(data, input, 3).limit).toBeUndefined()
  })

  it('does not change the data', () => {
    const before = JSON.stringify(data)
    simulatePurchase(data, input, 3)
    expect(JSON.stringify(data)).toBe(before)
  })
})
