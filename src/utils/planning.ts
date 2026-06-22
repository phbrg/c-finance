import type { FinancialItem, FinancialItemKind } from '../types/finance'
import type { TransactionType } from '../types/transaction'

export type PlannedItemScope = 'current' | 'ended'

export interface PlannedItemFilters {
  query: string
  scope: PlannedItemScope
  type: 'all' | TransactionType
  kind: 'all' | FinancialItemKind
}

export interface PlanningSummary {
  recurringIncome: number
  recurringExpenses: number
  recurringBalance: number
  upcomingOneTimeCount: number
}

export function isCurrentPlannedItem(item: FinancialItem, referenceDate: string): boolean {
  const referenceMonth = referenceDate.slice(0, 7)
  if (item.kind === 'one-time') return Boolean(item.dueDate && item.dueDate >= referenceDate)
  if (!item.recurrence?.active) return false
  return !item.recurrence.endMonth || item.recurrence.endMonth >= referenceMonth
}

export function filterPlannedItems(
  items: FinancialItem[],
  filters: PlannedItemFilters,
  referenceDate: string,
): FinancialItem[] {
  const normalizedQuery = normalize(filters.query)

  return items
    .filter((item) => {
      const isCurrent = isCurrentPlannedItem(item, referenceDate)
      if ((filters.scope === 'current') !== isCurrent) return false
      if (filters.type !== 'all' && item.type !== filters.type) return false
      if (filters.kind !== 'all' && item.kind !== filters.kind) return false
      if (!normalizedQuery) return true
      return normalize(`${item.title} ${item.category}`).includes(normalizedQuery)
    })
    .sort(comparePlannedItems)
}

export function summarizePlanning(items: FinancialItem[], referenceDate: string): PlanningSummary {
  const referenceMonth = referenceDate.slice(0, 7)
  const recurring = items.filter((item) => (
    item.kind === 'recurring' &&
    item.recurrence?.active &&
    item.recurrence.startMonth <= referenceMonth &&
    (!item.recurrence.endMonth || item.recurrence.endMonth >= referenceMonth)
  ))
  const recurringIncome = sum(recurring.filter((item) => item.type === 'income'))
  const recurringExpenses = sum(recurring.filter((item) => item.type === 'expense'))

  return {
    recurringIncome,
    recurringExpenses,
    recurringBalance: recurringIncome - recurringExpenses,
    upcomingOneTimeCount: items.filter((item) => item.kind === 'one-time' && item.dueDate && item.dueDate >= referenceDate).length,
  }
}

function comparePlannedItems(first: FinancialItem, second: FinancialItem): number {
  if (first.kind !== second.kind) return first.kind === 'recurring' ? -1 : 1
  const firstDate = first.kind === 'recurring'
    ? String(first.recurrence?.dayOfMonth ?? 32).padStart(2, '0')
    : first.dueDate ?? ''
  const secondDate = second.kind === 'recurring'
    ? String(second.recurrence?.dayOfMonth ?? 32).padStart(2, '0')
    : second.dueDate ?? ''
  return firstDate.localeCompare(secondDate) || first.title.localeCompare(second.title, 'pt-BR')
}

function normalize(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLocaleLowerCase('pt-BR')
}

function sum(items: FinancialItem[]): number {
  return items.reduce((total, item) => total + item.amount, 0)
}
