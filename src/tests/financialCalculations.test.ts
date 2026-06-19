import { describe, expect, it } from 'vitest'
import type { Transaction } from '../types/transaction'
import { calculateFinancialSummary, filterTransactions } from '../utils/financialCalculations'

function transaction(overrides: Partial<Transaction>): Transaction {
  return {
    id: crypto.randomUUID(),
    title: 'Example',
    type: 'expense',
    amount: 1_000,
    paymentDate: '2026-06-10',
    category: 'General',
    createdAt: '2026-06-01T12:00:00.000Z',
    updatedAt: '2026-06-01T12:00:00.000Z',
    ...overrides,
  }
}

describe('financial calculations', () => {
  it('calculates income, expenses, balance, percentage and largest expense', () => {
    const largest = transaction({ title: 'Rent', amount: 90_000 })
    const result = calculateFinancialSummary([
      transaction({ type: 'income', amount: 200_000 }),
      transaction({ amount: 25_000 }),
      largest,
    ])

    expect(result.totalIncome).toBe(200_000)
    expect(result.totalExpenses).toBe(115_000)
    expect(result.balance).toBe(85_000)
    expect(result.expensePercentage).toBeCloseTo(57.5)
    expect(result.largestExpense).toBe(largest)
  })

  it('returns no percentage when there is no income', () => {
    expect(calculateFinancialSummary([transaction({})]).expensePercentage).toBeNull()
  })

  it('filters by month and type without mutating the source', () => {
    const source = [
      transaction({ id: '1', type: 'income', paymentDate: '2026-06-01' }),
      transaction({ id: '2', paymentDate: '2026-06-20' }),
      transaction({ id: '3', paymentDate: '2026-05-10' }),
    ]
    const result = filterTransactions(source, { month: '2026-06', type: 'expense' })

    expect(result.map(({ id }) => id)).toEqual(['2'])
    expect(source.map(({ id }) => id)).toEqual(['1', '2', '3'])
  })
})
