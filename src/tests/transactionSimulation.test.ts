import { describe, expect, it } from 'vitest'
import type { FinancialItemDraft, FinancialOccurrence } from '../types/finance'
import { createSimulatedOccurrence, simulateTransaction, simulateTransactionHorizon } from '../utils/transactionSimulation'

function occurrence(overrides: Partial<FinancialOccurrence> = {}): FinancialOccurrence {
  return {
    key: 'salary:2026-07-05',
    itemId: 'salary',
    title: 'Salário',
    type: 'income',
    kind: 'recurring',
    amount: 500_000,
    category: 'Renda',
    dueDate: '2026-07-05',
    status: 'planned',
    ...overrides,
  }
}

const expenseDraft: FinancialItemDraft = {
  title: 'Notebook',
  type: 'expense',
  kind: 'one-time',
  amount: 120_000,
  category: 'Tecnologia',
  dueDate: '2026-07-20',
}

describe('transaction simulation', () => {
  it('compares the projected month without mutating the original occurrences', () => {
    const occurrences = [occurrence(), occurrence({ key: 'rent', itemId: 'rent', title: 'Aluguel', type: 'expense', amount: 200_000 })]
    const result = simulateTransaction(occurrences, expenseDraft, '2026-07')

    expect(occurrences).toHaveLength(2)
    expect(result.afterOccurrences).toHaveLength(3)
    expect(result.before.projectedBalance).toBe(300_000)
    expect(result.after.projectedBalance).toBe(180_000)
    expect(result.balanceImpact).toBe(-120_000)
    expect(result.relativeImpactPercentage).toBe(24)
  })

  it('applies a recurring simulation from its first month onward', () => {
    const recurringDraft: FinancialItemDraft = {
      ...expenseDraft,
      kind: 'recurring',
      dayOfMonth: 15,
      startMonth: '2026-08',
      endMonth: '2026-09',
      dueDate: undefined,
    }

    expect(createSimulatedOccurrence(recurringDraft, '2026-07')).toBeNull()
    expect(createSimulatedOccurrence(recurringDraft, '2026-08')?.dueDate).toBe('2026-08-15')
    expect(createSimulatedOccurrence(recurringDraft, '2026-09')?.dueDate).toBe('2026-09-15')
    expect(createSimulatedOccurrence(recurringDraft, '2026-10')).toBeNull()
  })

  it('builds a horizon where a one-time transaction affects only its month', () => {
    const horizon = simulateTransactionHorizon([
      { month: '2026-07', occurrences: [occurrence()] },
      { month: '2026-08', occurrences: [occurrence({ dueDate: '2026-08-05' })] },
    ], expenseDraft)

    expect(horizon.map((point) => point.impact)).toEqual([-120_000, 0])
  })
})
