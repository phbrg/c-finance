import type {
  DashboardSummary,
  FinancialOccurrence,
} from '../types/finance'

export function calculateDashboardSummary(
  occurrences: FinancialOccurrence[],
  cutoffDate: string,
): DashboardSummary {
  const active = occurrences.filter((item) => item.status !== 'skipped')
  const expectedIncome = sum(active.filter((item) => item.type === 'income'))
  const expectedExpenses = sum(active.filter((item) => item.type === 'expense'))
  const untilCutoff = active.filter((item) => item.dueDate <= cutoffDate)
  const completed = active.filter(
    (item) => item.status === 'completed' && (item.completedAt?.slice(0, 10) ?? item.dueDate) <= cutoffDate,
  )
  const receivedIncome = sum(completed.filter((item) => item.type === 'income'))
  const paidExpenses = sum(completed.filter((item) => item.type === 'expense'))
  const fixedIncome = sum(
    active.filter((item) => item.type === 'income' && item.kind === 'recurring'),
  )
  const fixedExpenses = sum(
    active.filter((item) => item.type === 'expense' && item.kind === 'recurring'),
  )

  return {
    expectedIncome,
    expectedIncomeUntilCutoff: sum(untilCutoff.filter((item) => item.type === 'income')),
    receivedIncome,
    expectedExpenses,
    expectedExpensesUntilCutoff: sum(untilCutoff.filter((item) => item.type === 'expense')),
    paidExpenses,
    pendingIncome: expectedIncome - sum(active.filter((item) => item.type === 'income' && item.status === 'completed')),
    pendingExpenses: expectedExpenses - sum(active.filter((item) => item.type === 'expense' && item.status === 'completed')),
    realizedBalance: receivedIncome - paidExpenses,
    projectedBalance: expectedIncome - expectedExpenses,
    fixedCommitmentPercentage: fixedIncome > 0 ? (fixedExpenses / fixedIncome) * 100 : null,
  }
}

export function categoryTotals(occurrences: FinancialOccurrence[]): Array<{ category: string; amount: number }> {
  const totals = new Map<string, number>()
  for (const item of occurrences) {
    if (item.type === 'expense' && item.status !== 'skipped') {
      totals.set(item.category, (totals.get(item.category) ?? 0) + item.amount)
    }
  }
  return [...totals.entries()]
    .map(([category, amount]) => ({ category, amount }))
    .sort((first, second) => second.amount - first.amount)
}

export function dailyCashFlow(occurrences: FinancialOccurrence[]): Array<{ day: number; balance: number }> {
  if (occurrences.length === 0) return []
  let balance = 0
  return occurrences
    .filter((item) => item.status !== 'skipped')
    .map((item) => {
      balance += item.type === 'income' ? item.amount : -item.amount
      return { day: Number(item.dueDate.slice(8, 10)), balance }
    })
}

function sum(items: FinancialOccurrence[]): number {
  return items.reduce((total, item) => total + item.amount, 0)
}
