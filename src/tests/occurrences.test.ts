import { describe, expect, it } from 'vitest'
import type { FinancialOccurrence } from '../types/finance'
import { filterOccurrences, summarizeOccurrences } from '../utils/occurrences'

function occurrence(overrides: Partial<FinancialOccurrence> = {}): FinancialOccurrence {
  return {
    key: 'item:2026-06-10',
    itemId: 'item',
    title: 'Aluguel',
    type: 'expense',
    kind: 'recurring',
    amount: 100_000,
    category: 'Moradia',
    dueDate: '2026-06-10',
    status: 'planned',
    ...overrides,
  }
}

describe('occurrence utilities', () => {
  it('summarizes expected, completed and pending values', () => {
    expect(summarizeOccurrences([
      occurrence({ key: 'salary', type: 'income', amount: 500_000, status: 'completed' }),
      occurrence({ key: 'rent', amount: 150_000, status: 'completed' }),
      occurrence({ key: 'card', amount: 80_000 }),
      occurrence({ key: 'ignored', amount: 999_000, status: 'skipped' }),
    ])).toMatchObject({
      expectedIncome: 500_000,
      receivedIncome: 500_000,
      expectedExpenses: 230_000,
      paidExpenses: 150_000,
      pendingExpenses: 80_000,
      pendingCount: 1,
      realizedBalance: 350_000,
      statusCounts: { planned: 1, completed: 2, skipped: 1 },
    })
  })

  it('filters normalized text and puts pending items first', () => {
    const result = filterOccurrences([
      occurrence({ key: 'completed', title: 'Salário', category: 'Renda', type: 'income', status: 'completed', dueDate: '2026-06-05' }),
      occurrence({ key: 'pending', title: 'Bônus salário', category: 'Renda', type: 'income', dueDate: '2026-06-20' }),
      occurrence({ key: 'expense', title: 'Mercado', dueDate: '2026-06-01' }),
    ], { query: 'salario', type: 'income', status: 'all', category: 'all', sort: 'pending-first' })

    expect(result.map(({ key }) => key)).toEqual(['pending', 'completed'])
  })
})
