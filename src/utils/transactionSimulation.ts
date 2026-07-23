import type { DashboardSummary, FinancialItemDraft, FinancialOccurrence } from '../types/finance'
import { calculateDashboardSummary } from './projections'
import { monthEndDate, occurrenceDate } from './recurrence'

export interface TransactionSimulation {
  month: string
  before: DashboardSummary
  after: DashboardSummary
  beforeOccurrences: FinancialOccurrence[]
  afterOccurrences: FinancialOccurrence[]
  simulatedOccurrence: FinancialOccurrence | null
  balanceImpact: number
  relativeImpactPercentage: number | null
  expenseRatioBefore: number | null
  expenseRatioAfter: number | null
}

export interface SimulationHorizonPoint {
  month: string
  beforeBalance: number
  afterBalance: number
  impact: number
}

interface SimulationMonth {
  month: string
  occurrences: FinancialOccurrence[]
}

export function simulateTransaction(
  occurrences: FinancialOccurrence[],
  draft: FinancialItemDraft,
  month: string,
): TransactionSimulation {
  const simulatedOccurrence = createSimulatedOccurrence(draft, month)
  const afterOccurrences = simulatedOccurrence ? [...occurrences, simulatedOccurrence] : [...occurrences]
  const cutoffDate = monthEndDate(month)
  const before = calculateDashboardSummary(occurrences, cutoffDate)
  const after = calculateDashboardSummary(afterOccurrences, cutoffDate)
  const referenceTotal = draft.type === 'expense' ? after.expectedIncome : before.expectedIncome

  return {
    month,
    before,
    after,
    beforeOccurrences: [...occurrences],
    afterOccurrences,
    simulatedOccurrence,
    balanceImpact: after.projectedBalance - before.projectedBalance,
    relativeImpactPercentage: referenceTotal > 0 ? (draft.amount / referenceTotal) * 100 : null,
    expenseRatioBefore: ratio(before.expectedExpenses, before.expectedIncome),
    expenseRatioAfter: ratio(after.expectedExpenses, after.expectedIncome),
  }
}

export function simulateTransactionHorizon(
  months: SimulationMonth[],
  draft: FinancialItemDraft,
): SimulationHorizonPoint[] {
  return months.map(({ month, occurrences }) => {
    const simulation = simulateTransaction(occurrences, draft, month)
    return {
      month,
      beforeBalance: simulation.before.projectedBalance,
      afterBalance: simulation.after.projectedBalance,
      impact: simulation.balanceImpact,
    }
  })
}

export function createSimulatedOccurrence(draft: FinancialItemDraft, month: string): FinancialOccurrence | null {
  const dueDate = draft.kind === 'one-time'
    ? draft.dueDate?.startsWith(month) ? draft.dueDate : undefined
    : draft.startMonth &&
        month >= draft.startMonth &&
        (!draft.endMonth || month <= draft.endMonth)
      ? occurrenceDate(month, draft.dayOfMonth ?? 1)
      : undefined

  if (!dueDate) return null

  return {
    key: `simulation:${dueDate}`,
    itemId: 'simulation',
    title: draft.title,
    type: draft.type,
    kind: draft.kind,
    amount: draft.amount,
    category: draft.category,
    dueDate,
    status: 'planned',
  }
}

function ratio(expenses: number, income: number): number | null {
  return income > 0 ? (expenses / income) * 100 : null
}
