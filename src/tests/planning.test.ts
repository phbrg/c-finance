import { describe, expect, it } from 'vitest'
import type { FinancialItem } from '../types/finance'
import { filterPlannedItems, isCurrentPlannedItem, summarizePlanning } from '../utils/planning'

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

describe('planning utilities', () => {
  it('separates current items from ended items', () => {
    expect(isCurrentPlannedItem(item({ recurrence: { active: true, dayOfMonth: 10, startMonth: '2026-01', endMonth: '2026-05' } }), '2026-06-22')).toBe(false)
    expect(isCurrentPlannedItem(item({ kind: 'one-time', recurrence: undefined, dueDate: '2026-06-23' }), '2026-06-22')).toBe(true)
    expect(isCurrentPlannedItem(item({ kind: 'one-time', recurrence: undefined, dueDate: '2026-06-21' }), '2026-06-22')).toBe(false)
  })

  it('filters by scope, type, kind and normalized search text', () => {
    const result = filterPlannedItems([
      item(),
      item({ id: 'income', title: 'Salário', category: 'Renda', type: 'income', amount: 500_000 }),
      item({ id: 'ended', title: 'Curso', kind: 'one-time', recurrence: undefined, dueDate: '2026-05-01' }),
    ], { query: 'salario', scope: 'current', type: 'income', kind: 'recurring' }, '2026-06-22')

    expect(result.map(({ id }) => id)).toEqual(['income'])
  })

  it('summarizes the recurring base for the reference month', () => {
    expect(summarizePlanning([
      item({ id: 'income', type: 'income', amount: 500_000 }),
      item({ id: 'expense', amount: 150_000 }),
      item({ id: 'future', type: 'income', amount: 900_000, recurrence: { active: true, dayOfMonth: 1, startMonth: '2026-07' } }),
      item({ id: 'one-time', kind: 'one-time', recurrence: undefined, dueDate: '2026-06-30' }),
    ], '2026-06-22')).toEqual({
      recurringIncome: 500_000,
      recurringExpenses: 150_000,
      recurringBalance: 350_000,
      upcomingOneTimeCount: 1,
    })
  })
})
