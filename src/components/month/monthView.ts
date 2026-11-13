import type { TransactionType } from '../../types/common'
import type { FinancialOccurrence, OccurrenceStatus } from '../../types/finance'
import { formatCurrency } from '../../utils/currency'
import { normalizeSearchText } from '../../utils/text'
import type { MonthBar } from '../charts/MonthBars'

export interface MonthFilters {
  query: string
  type: 'all' | TransactionType
  status: 'all' | OccurrenceStatus
  /** '' = every category. */
  category: string
  day: number | null
  /** '' = every card. A card keeps its purchases and its invoices. */
  card: string
}

export const noFilters: MonthFilters = { query: '', type: 'all', status: 'all', category: '', day: null, card: '' }

const sum = (values: number[]) => values.reduce((total, value) => total + value, 0)

export function matchesFilters(entry: FinancialOccurrence, filters: MonthFilters): boolean {
  const query = normalizeSearchText(filters.query)
  return (filters.type === 'all' || entry.type === filters.type)
    // Card purchases are settled by the invoice, so they are neither pending nor confirmed.
    && (filters.status === 'all' || (!entry.cardId && entry.status === filters.status))
    && (!filters.day || Number(entry.dueDate.slice(8, 10)) === filters.day)
    && (!filters.category || entry.category === filters.category)
    && (!filters.card || entry.cardId === filters.card || entry.invoice?.cardId === filters.card)
    && (!query || normalizeSearchText(`${entry.title} ${entry.category}`).includes(query))
}

export function applyFilters(entries: FinancialOccurrence[], filters: MonthFilters): FinancialOccurrence[] {
  return entries.filter((entry) => matchesFilters(entry, filters))
}

export interface SelectionTotals {
  count: number
  income: number
  expense: number
  net: number
}

export function selectionTotals(entries: FinancialOccurrence[], selected: ReadonlySet<string>): SelectionTotals {
  const totals = { count: 0, income: 0, expense: 0, net: 0 }
  for (const entry of entries) {
    if (!selected.has(entry.key)) continue
    totals.count += 1
    totals[entry.type] += entry.amount
  }
  totals.net = totals.income - totals.expense
  return totals
}

export type GroupBy = 'day' | 'category' | 'none'
export type SortBy = 'date' | 'amount'

export interface EntryGroup {
  key: string
  label: string
  net: number
  entries: FinancialOccurrence[]
}

export const signed = (entry: FinancialOccurrence) => (entry.status === 'skipped' ? 0 : entry.type === 'income' ? entry.amount : -entry.amount)
export const signedMoney = (cents: number) => `${cents > 0 ? '+' : cents < 0 ? '−' : ''} ${formatCurrency(Math.abs(cents))}`.trim()

export function groupEntries(entries: FinancialOccurrence[], groupBy: GroupBy, sortBy: SortBy): EntryGroup[] {
  const sorted = [...entries].sort((first, second) =>
    sortBy === 'amount' ? second.amount - first.amount : first.dueDate.localeCompare(second.dueDate))
  if (groupBy === 'none') return [{ key: 'all', label: '', net: sum(sorted.map(signed)), entries: sorted }]

  const groups = new Map<string, EntryGroup>()
  for (const entry of sorted) {
    const key = groupBy === 'day' ? entry.dueDate : entry.category
    const group = groups.get(key) ?? { key, label: groupBy === 'day' ? dayLabel(key) : key, net: 0, entries: [] }
    group.entries.push(entry)
    group.net += signed(entry)
    groups.set(key, group)
  }
  const list = [...groups.values()]
  return groupBy === 'day'
    ? list.sort((first, second) => first.key.localeCompare(second.key))
    : list.sort((first, second) => Math.abs(second.net) - Math.abs(first.net))
}

// Capitalize only the first letter: CSS `capitalize` would turn "de" into "De".
const firstUpper = (text: string) => text.charAt(0).toLocaleUpperCase('pt-BR') + text.slice(1)

export function dayLabel(date: string): string {
  return firstUpper(new Date(`${date}T12:00:00`).toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' }).replace(/\./g, ''))
}

export function monthLabel(month: string, style: 'long' | 'short' = 'long'): string {
  const label = new Date(`${month}-02T12:00:00`).toLocaleDateString('pt-BR', style === 'long' ? { month: 'long', year: 'numeric' } : { month: 'short' })
  return firstUpper(label.replace('.', ''))
}

/** Invoice totals by due month as clickable month columns. */
export function invoiceBars(points: { month: string; total: number; status: OccurrenceStatus; count: number }[]): MonthBar[] {
  return points.map((point) => ({
    key: point.month,
    label: monthLabel(point.month, 'short'),
    name: `Fatura de ${monthLabel(point.month)}: ${formatCurrency(point.total)}${point.status === 'completed' ? ', paga' : ''}`,
    value: point.total,
  }))
}
