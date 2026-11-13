import type { FinancialItem, FinancialItemKind, OccurrenceRecord } from '../types/finance'
import type { TransactionType } from '../types/common'
import { addMonth, amountAt, itemDateInMonth } from './recurrence'
import { normalizeSearchText } from './text'

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
  oneTimeCount: number
}

/** "2026-11" -> "novembro de 2026". */
export function monthLabel(month: string): string {
  const [year, monthNumber] = month.split('-').map(Number)
  return new Date(year, monthNumber - 1, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
}

/**
 * Recurring: still running. One-time: its date is today or later, or its occurrence was
 * never confirmed/skipped (a past date can still be pending). Installment purchases stay until
 * their last installment month.
 */
export function isCurrentPlannedItem(
  item: FinancialItem,
  referenceDate: string,
  records: OccurrenceRecord[] = [],
): boolean {
  const referenceMonth = referenceDate.slice(0, 7)
  if (item.kind === 'one-time') {
    if (!item.dueDate) return false
    if (item.dueDate >= referenceDate) return true
    if (item.installments) return addMonth(item.dueDate.slice(0, 7), item.installments - 1) >= referenceMonth
    const status = records.find((record) => record.key === `${item.id}:${item.dueDate!.slice(0, 7)}`)?.status
    return status !== 'completed' && status !== 'skipped'
  }
  if (!item.recurrence?.active) return false
  return !item.recurrence.endMonth || item.recurrence.endMonth >= referenceMonth
}

export function filterPlannedItems(
  items: FinancialItem[],
  filters: PlannedItemFilters,
  referenceDate: string,
  records: OccurrenceRecord[] = [],
): FinancialItem[] {
  const normalizedQuery = normalizeSearchText(filters.query)

  return items
    .filter((item) => {
      const isCurrent = isCurrentPlannedItem(item, referenceDate, records)
      if ((filters.scope === 'current') !== isCurrent) return false
      if (filters.type !== 'all' && item.type !== filters.type) return false
      if (filters.kind !== 'all' && item.kind !== filters.kind) return false
      if (!normalizedQuery) return true
      return normalizeSearchText(`${item.title} ${item.category}`).includes(normalizedQuery)
    })
    .sort(comparePlannedItems)
}

/** Recurring base and one-time count for one month (amount changes respected). */
export function summarizePlanning(items: FinancialItem[], month: string): PlanningSummary {
  const inMonth = items.filter((item) => itemDateInMonth(item, month))
  const recurring = inMonth.filter((item) => item.kind === 'recurring')
  const total = (type: TransactionType) => recurring
    .filter((item) => item.type === type)
    .reduce((sum, item) => sum + amountAt(item, month), 0)
  const recurringIncome = total('income')
  const recurringExpenses = total('expense')

  return {
    recurringIncome,
    recurringExpenses,
    recurringBalance: recurringIncome - recurringExpenses,
    oneTimeCount: inMonth.length - recurring.length,
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
