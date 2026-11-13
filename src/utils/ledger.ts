import type { CreditCard, FinanceData, FinancialOccurrence } from '../types/finance'
import { invoiceForecast, invoiceOccurrences, invoiceOccurrence, usedLimit } from './cards'
import type { InvoiceForecastPoint } from './cards'
import { addMonth, daysInMonth, generateOccurrences } from './recurrence'

/**
 * Everything listed in a month, ordered by date: entries, card purchases (no cash) and the invoice
 * of each card with that month's purchases, on its payment day (the cash side of the card).
 */
export function monthEntries(data: FinanceData, month: string): FinancialOccurrence[] {
  return [...generateOccurrences(data.items, data.occurrenceRecords, month), ...invoiceOccurrences(data, month)]
    .sort((first, second) => first.dueDate.localeCompare(second.dueDate) || first.title.localeCompare(second.title, 'pt-BR'))
}

export interface MonthTotals {
  incomeExpected: number
  incomeReceived: number
  incomePending: number
  expenseExpected: number
  expensePaid: number
  expensePending: number
  pendingCount: number
  /** Expected income minus expected expenses (skipped entries excluded). */
  net: number
  /** Received minus paid so far. */
  realized: number
}

export function summarizeEntries(entries: FinancialOccurrence[]): MonthTotals {
  const totals: MonthTotals = {
    incomeExpected: 0, incomeReceived: 0, incomePending: 0,
    expenseExpected: 0, expensePaid: 0, expensePending: 0,
    pendingCount: 0, net: 0, realized: 0,
  }
  for (const entry of entries) {
    // A card purchase does not move cash: its invoice does.
    if (entry.status === 'skipped' || entry.cardId) continue
    const income = entry.type === 'income'
    const done = entry.status === 'completed'
    if (income) {
      totals.incomeExpected += entry.amount
      if (done) totals.incomeReceived += entry.amount
      else totals.incomePending += entry.amount
    } else {
      totals.expenseExpected += entry.amount
      if (done) totals.expensePaid += entry.amount
      else totals.expensePending += entry.amount
    }
    if (!done) totals.pendingCount += 1
  }
  totals.net = totals.incomeExpected - totals.expenseExpected
  totals.realized = totals.incomeReceived - totals.expensePaid
  return totals
}

const MAX_CARRY_MONTHS = 120

/** Balance that enters the month: opening balance plus the net of every month since it. */
export function carryIn(data: FinanceData, month: string): { amount: number; known: boolean } {
  const opening = data.openingBalance
  if (!opening || month < opening.month) return { amount: 0, known: false }
  let amount = opening.amount
  let cursor = opening.month
  for (let step = 0; cursor < month && step < MAX_CARRY_MONTHS; step += 1) {
    amount += summarizeEntries(monthEntries(data, cursor)).net
    cursor = addMonth(cursor, 1)
  }
  return { amount, known: true }
}

export interface MonthLedger {
  month: string
  opening: number
  openingKnown: boolean
  entries: FinancialOccurrence[]
  totals: MonthTotals
  /** Opening plus expected net: where the month should end. */
  closingProjected: number
  /** Opening plus what really came in and went out so far. */
  balanceNow: number
}

export function monthLedger(data: FinanceData, month: string): MonthLedger {
  const entries = monthEntries(data, month)
  const totals = summarizeEntries(entries)
  const carry = carryIn(data, month)
  return {
    month,
    opening: carry.amount,
    openingKnown: carry.known,
    entries,
    totals,
    closingProjected: carry.amount + totals.net,
    balanceNow: carry.amount + totals.realized,
  }
}

export interface DayPoint {
  day: number
  date: string
  income: number
  expense: number
  /** Running balance at the end of the day (opening included). */
  balance: number
  entries: FinancialOccurrence[]
}

/** One point per day of the month, so charts can draw bars and the balance line. */
export function dailySeries(entries: FinancialOccurrence[], month: string, opening = 0): DayPoint[] {
  const total = daysInMonth(month)
  const byDay = new Map<number, FinancialOccurrence[]>()
  for (const entry of entries) {
    const day = Number(entry.dueDate.slice(8, 10))
    byDay.set(day, [...(byDay.get(day) ?? []), entry])
  }
  let balance = opening
  return Array.from({ length: total }, (_, index) => {
    const day = index + 1
    const dayEntries = byDay.get(day) ?? []
    const active = dayEntries.filter((entry) => entry.status !== 'skipped' && !entry.cardId)
    const income = active.filter((entry) => entry.type === 'income').reduce((sum, entry) => sum + entry.amount, 0)
    const expense = active.filter((entry) => entry.type === 'expense').reduce((sum, entry) => sum + entry.amount, 0)
    balance += income - expense
    return { day, date: `${month}-${String(day).padStart(2, '0')}`, income, expense, balance, entries: dayEntries }
  })
}

export interface CategoryTotal {
  category: string
  amount: number
  count: number
}

/** Spending by category: the purchases themselves, not the invoice that pays them. */
export function categoryBreakdown(entries: FinancialOccurrence[]): CategoryTotal[] {
  const totals = new Map<string, CategoryTotal>()
  for (const entry of entries) {
    if (entry.type !== 'expense' || entry.status === 'skipped' || entry.invoice) continue
    const current = totals.get(entry.category) ?? { category: entry.category, amount: 0, count: 0 }
    totals.set(entry.category, { category: entry.category, amount: current.amount + entry.amount, count: current.count + 1 })
  }
  return [...totals.values()].sort((first, second) => second.amount - first.amount)
}

export interface MonthPoint {
  month: string
  income: number
  expense: number
  net: number
  closing: number
}

/**
 * `count` months from `startMonth` (future ones included). `filter` narrows income/expense/net;
 * `closing` is always the real balance.
 */
export function monthsSeries(
  data: FinanceData,
  startMonth: string,
  count: number,
  filter?: (occurrence: FinancialOccurrence) => boolean,
): MonthPoint[] {
  return Array.from({ length: count }, (_, index) => addMonth(startMonth, index)).map((month) => {
    const entries = monthEntries(data, month)
    const totals = summarizeEntries(filter ? entries.filter(filter) : entries)
    return {
      month,
      income: totals.incomeExpected,
      expense: totals.expenseExpected,
      net: totals.net,
      closing: carryIn(data, month).amount + summarizeEntries(entries).net,
    }
  })
}

/** Invoice totals by month, starting at `startMonth`. */
export function invoiceSeries(data: FinanceData, cardId: string, startMonth: string, count: number): InvoiceForecastPoint[] {
  const card = data.cards.find((item) => item.id === cardId)
  return card ? invoiceForecast(data, card, startMonth, count) : []
}

export interface CardSummary {
  card: CreditCard
  /** Invoice of the month of `todayDate`, when there is one. */
  dueThisMonth?: { month: string; total: number; status: FinancialOccurrence['status']; dueDate: string }
  /** Bought and not paid yet. */
  used: number
  available?: number
  /** Used limit in percent (can pass 100). */
  limitPct?: number
}

export function cardSummary(data: FinanceData, cardId: string, todayDate: string): CardSummary | undefined {
  const card = data.cards.find((item) => item.id === cardId)
  if (!card) return undefined
  const month = todayDate.slice(0, 7)
  const due = invoiceOccurrence(data, card, month)
  const used = usedLimit(data, card, month, 36, todayDate)
  return {
    card,
    ...(due ? { dueThisMonth: { month, total: due.status === 'skipped' ? 0 : due.amount, status: due.status, dueDate: due.dueDate } } : {}),
    used,
    ...(card.limit ? { available: card.limit - used, limitPct: Math.round((used / card.limit) * 100) } : {}),
  }
}
