import { describe, expect, it } from 'vitest'
import type { FinancialItem } from '../types/finance'
import { filterPlannedItems, isCurrentPlannedItem, monthLabel, summarizePlanning } from '../utils/planning'

function item(overrides: Partial<FinancialItem> = {}): FinancialItem {
  return {
    id: 'item',
    title: 'Aluguel',
    type: 'expense',
    kind: 'recurring',
    amount: 100_000,
    category: 'Moradia',
    recurrence: { active: true, dayOfMonth: 10, startMonth: '2026-01' },
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

const oneTime = (overrides: Partial<FinancialItem> = {}) => item({ kind: 'one-time', recurrence: undefined, ...overrides })

describe('planning utilities', () => {
  it('separates current items from ended items', () => {
    expect(isCurrentPlannedItem(item({ recurrence: { active: true, dayOfMonth: 10, startMonth: '2026-01', endMonth: '2026-05' } }), '2026-06-22')).toBe(false)
    expect(isCurrentPlannedItem(oneTime({ dueDate: '2026-06-23' }), '2026-06-22')).toBe(true)
    expect(isCurrentPlannedItem(oneTime({ dueDate: '2026-06-21' }), '2026-06-22')).toBe(true)
  })

  it('keeps a past one-time item current only while its occurrence is pending', () => {
    const past = oneTime({ id: 'old', dueDate: '2026-06-01' })
    expect(isCurrentPlannedItem(past, '2026-06-22', [])).toBe(true)
    expect(isCurrentPlannedItem(past, '2026-06-22', [{ key: 'old:2026-06', status: 'planned' }])).toBe(true)
    expect(isCurrentPlannedItem(past, '2026-06-22', [{ key: 'old:2026-06', status: 'completed' }])).toBe(false)
    expect(isCurrentPlannedItem(past, '2026-06-22', [{ key: 'old:2026-06', status: 'skipped' }])).toBe(false)
  })

  it('keeps installment purchases until their last installment', () => {
    const purchase = oneTime({ dueDate: '2026-04-10', installments: 3 })
    expect(isCurrentPlannedItem(purchase, '2026-06-22')).toBe(true)
    expect(isCurrentPlannedItem(purchase, '2026-07-01')).toBe(false)
  })

  it('filters by scope, type, kind and normalized search text', () => {
    const records = [{ key: 'ended:2026-05', status: 'completed' as const }]
    const result = filterPlannedItems([
      item(),
      item({ id: 'income', title: 'Salário', category: 'Renda', type: 'income', amount: 500_000 }),
      oneTime({ id: 'ended', title: 'Curso', dueDate: '2026-05-01' }),
    ], { query: 'salario', scope: 'current', type: 'income', kind: 'recurring' }, '2026-06-22', records)

    expect(result.map(({ id }) => id)).toEqual(['income'])
  })

  it('summarizes the recurring base of the month using amount changes', () => {
    const items = [
      item({ id: 'income', type: 'income', amount: 500_000 }),
      item({ id: 'expense', amount: 150_000, amountChanges: [{ from: '2026-07', amount: 200_000 }] }),
      item({ id: 'future', type: 'income', amount: 900_000, recurrence: { active: true, dayOfMonth: 1, startMonth: '2026-08' } }),
      oneTime({ id: 'one-time', dueDate: '2026-06-30' }),
    ]
    expect(summarizePlanning(items, '2026-06')).toEqual({
      recurringIncome: 500_000,
      recurringExpenses: 150_000,
      recurringBalance: 350_000,
      oneTimeCount: 1,
    })
    expect(summarizePlanning(items, '2026-07').recurringExpenses).toBe(200_000)
  })

  it('names the month', () => {
    expect(monthLabel('2026-11')).toBe('novembro de 2026')
  })
})
