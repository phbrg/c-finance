import type { FinancialOccurrence, OccurrenceStatus } from '../types/finance'
import type { TransactionType } from '../types/common'
import { normalizeSearchText } from './text'

export type OccurrenceSort = 'date' | 'pending-first' | 'amount'

export interface OccurrenceFilters {
  query: string
  type: 'all' | TransactionType
  status: 'all' | OccurrenceStatus
  category: string
  sort: OccurrenceSort
}

export interface OccurrenceSummary {
  expectedIncome: number
  receivedIncome: number
  expectedExpenses: number
  paidExpenses: number
  pendingIncome: number
  pendingExpenses: number
  pendingCount: number
  realizedBalance: number
  statusCounts: Record<OccurrenceStatus, number>
}

export function summarizeOccurrences(occurrences: FinancialOccurrence[]): OccurrenceSummary {
  const active = occurrences.filter((item) => item.status !== 'skipped')
  const completed = active.filter((item) => item.status === 'completed')
  const pending = active.filter((item) => item.status === 'planned')
  const receivedIncome = sum(completed.filter((item) => item.type === 'income'))
  const paidExpenses = sum(completed.filter((item) => item.type === 'expense'))

  return {
    expectedIncome: sum(active.filter((item) => item.type === 'income')),
    receivedIncome,
    expectedExpenses: sum(active.filter((item) => item.type === 'expense')),
    paidExpenses,
    pendingIncome: sum(pending.filter((item) => item.type === 'income')),
    pendingExpenses: sum(pending.filter((item) => item.type === 'expense')),
    pendingCount: pending.length,
    realizedBalance: receivedIncome - paidExpenses,
    statusCounts: {
      planned: occurrences.filter((item) => item.status === 'planned').length,
      completed: occurrences.filter((item) => item.status === 'completed').length,
      skipped: occurrences.filter((item) => item.status === 'skipped').length,
    },
  }
}

export function filterOccurrences(
  occurrences: FinancialOccurrence[],
  filters: OccurrenceFilters,
): FinancialOccurrence[] {
  const query = normalizeSearchText(filters.query)
  return occurrences
    .filter((item) => (
      (filters.type === 'all' || item.type === filters.type) &&
      (filters.status === 'all' || item.status === filters.status) &&
      (filters.category === 'all' || item.category === filters.category) &&
      (!query || normalizeSearchText(`${item.title} ${item.category}`).includes(query))
    ))
    .sort((first, second) => compareOccurrences(first, second, filters.sort))
}

function compareOccurrences(first: FinancialOccurrence, second: FinancialOccurrence, sort: OccurrenceSort): number {
  if (sort === 'amount') return second.amount - first.amount || first.dueDate.localeCompare(second.dueDate)
  if (sort === 'pending-first') {
    const priority: Record<OccurrenceStatus, number> = { planned: 0, completed: 1, skipped: 2 }
    return priority[first.status] - priority[second.status] || first.dueDate.localeCompare(second.dueDate)
  }
  return first.dueDate.localeCompare(second.dueDate)
}

function sum(occurrences: FinancialOccurrence[]): number {
  return occurrences.reduce((total, item) => total + item.amount, 0)
}
