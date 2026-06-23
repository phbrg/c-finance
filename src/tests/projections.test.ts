import { describe, expect, it } from 'vitest'
import type { FinancialOccurrence } from '../types/finance'
import { calculateDashboardSummary, categoryTotals, dailyCashFlow } from '../utils/projections'

function occurrence(overrides: Partial<FinancialOccurrence>): FinancialOccurrence {
  return {
    key: 'item:2026-06-05',
    itemId: 'item',
    title: 'Item',
    type: 'expense',
    kind: 'recurring',
    amount: 10_000,
    category: 'General',
    dueDate: '2026-06-05',
    status: 'planned',
    ...overrides,
  }
}

describe('dashboard projections', () => {
  it('separates expected, completed and pending values', () => {
    const summary = calculateDashboardSummary([
      occurrence({ key: 'salary:2026-06-05', type: 'income', amount: 300_000, status: 'completed', confirmedAt: '2026-06-18T12:00:00.000Z' }),
      occurrence({ key: 'rent:2026-06-10', dueDate: '2026-06-10', amount: 100_000, status: 'completed', confirmedAt: '2026-06-18T12:00:00.000Z' }),
      occurrence({ key: 'card:2026-06-20', dueDate: '2026-06-20', amount: 50_000 }),
    ], '2026-06-15')

    expect(summary.expectedIncome).toBe(300_000)
    expect(summary.expectedExpenses).toBe(150_000)
    expect(summary.expectedIncomeUntilCutoff).toBe(300_000)
    expect(summary.expectedExpensesUntilCutoff).toBe(100_000)
    expect(summary.receivedIncome).toBe(300_000)
    expect(summary.paidExpenses).toBe(100_000)
    expect(summary.pendingExpenses).toBe(50_000)
    expect(summary.projectedBalance).toBe(150_000)
  })

  it('ignores skipped occurrences', () => {
    const summary = calculateDashboardSummary([occurrence({ status: 'skipped' })], '2026-06-30')
    expect(summary.expectedExpenses).toBe(0)
  })

  it('groups expenses by category', () => {
    expect(categoryTotals([
      occurrence({ category: 'Home', amount: 100 }),
      occurrence({ key: 'two', category: 'Home', amount: 50 }),
      occurrence({ key: 'three', category: 'Food', amount: 70 }),
    ])).toEqual([{ category: 'Home', amount: 150 }, { category: 'Food', amount: 70 }])
  })

  it('groups daily cash flow chronologically and ignores skipped items', () => {
    expect(dailyCashFlow([
      occurrence({ key: 'late', dueDate: '2026-06-20', amount: 50 }),
      occurrence({ key: 'salary', dueDate: '2026-06-05', type: 'income', amount: 300 }),
      occurrence({ key: 'same-day', dueDate: '2026-06-05', amount: 80 }),
      occurrence({ key: 'skipped', dueDate: '2026-06-10', amount: 1_000, status: 'skipped' }),
    ])).toEqual([
      { day: 5, change: 220, balance: 220 },
      { day: 20, change: -50, balance: 170 },
    ])
  })
})
