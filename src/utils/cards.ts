import type {
  CardCharge,
  CreditCard,
  FinanceData,
  FinancialOccurrence,
  OccurrenceRecord,
} from '../types/finance'
import { today } from './date'
import { addMonth, generateOccurrences, occurrenceDate } from './recurrence'

/** Month (YYYY-MM) of the invoice that receives a charge made on `date`: the month of the charge itself. */
export function invoiceMonthForDate(_card: Pick<CreditCard, 'dueDay'>, date: string): string {
  return date.slice(0, 7)
}

export function invoiceKey(cardId: string, month: string): string {
  return `card:${cardId}:${month}`
}

/** Payment day of the invoice of `month` (dueDay, clamped to the end of the month). */
export function invoiceDueDate(card: Pick<CreditCard, 'dueDay'>, month: string): string {
  return occurrenceDate(month, card.dueDay)
}

/** Charges of the card made in `month`: purchases, the installment that falls in it and subscriptions. */
export function invoiceCharges(data: FinanceData, card: CreditCard, month: string): CardCharge[] {
  const items = data.items.filter((item) => item.cardId === card.id && item.type === 'expense')
  return generateOccurrences(items, [], month)
    .map((charge): CardCharge => ({
      itemId: charge.itemId,
      title: charge.title,
      category: charge.category,
      date: charge.dueDate,
      amount: charge.plannedAmount,
      ...(charge.installment ? { installment: charge.installment } : {}),
    }))
    .sort((first, second) => first.date.localeCompare(second.date) || first.title.localeCompare(second.title, 'pt-BR'))
}

/** The invoice of a card as a cash occurrence (an expense on its payment day), or null when empty. */
export function invoiceOccurrence(
  data: FinanceData,
  card: CreditCard,
  month: string,
  records: OccurrenceRecord[] = data.occurrenceRecords,
): FinancialOccurrence | null {
  const lines = invoiceCharges(data, card, month)
  const key = invoiceKey(card.id, month)
  const record = records.find((item) => item.key === key)
  if (lines.length === 0 && !record) return null

  const plannedAmount = lines.reduce((total, line) => total + line.amount, 0)
  return {
    key,
    itemId: `card:${card.id}`,
    title: `Fatura ${card.name}`,
    type: 'expense',
    kind: 'recurring',
    amount: record?.status === 'completed' && record.amount !== undefined ? record.amount : plannedAmount,
    plannedAmount,
    category: 'Cartão',
    dueDate: invoiceDueDate(card, month),
    status: record?.status ?? 'planned',
    ...(record?.paidDate ? { paidDate: record.paidDate } : {}),
    ...(record?.confirmedAt ? { confirmedAt: record.confirmedAt } : {}),
    invoice: { cardId: card.id, cardName: card.name, lines },
  }
}

export function invoiceOccurrences(data: FinanceData, month: string): FinancialOccurrence[] {
  return data.cards.flatMap((card) => invoiceOccurrence(data, card, month) ?? [])
}

export interface InvoiceForecastPoint {
  month: string
  total: number
  status: FinancialOccurrence['status']
  count: number
}

/** Invoice totals month by month. */
export function invoiceForecast(data: FinanceData, card: CreditCard, fromMonth: string, months: number): InvoiceForecastPoint[] {
  return Array.from({ length: months }, (_, index) => {
    const month = addMonth(fromMonth, index)
    const invoice = invoiceOccurrence(data, card, month)
    return {
      month,
      total: invoice && invoice.status !== 'skipped' ? invoice.amount : 0,
      status: invoice?.status ?? 'planned',
      count: invoice?.invoice?.lines.length ?? 0,
    }
  })
}

/**
 * Limit used by unpaid invoices from `fromMonth` on. Only purchases already made count:
 * future installments of a past purchase do, but a subscription that has not been billed yet does not.
 */
export function usedLimit(
  data: FinanceData,
  card: CreditCard,
  fromMonth: string,
  lookaheadMonths = 36,
  asOf = today(),
): number {
  // An installment is dated in its own month, but the purchase happened on the item's date.
  const boughtOn = new Map(data.items.map((item) => [item.id, item.dueDate]))
  let used = 0
  for (let index = 0; index < lookaheadMonths; index += 1) {
    const invoice = invoiceOccurrence(data, card, addMonth(fromMonth, index))
    if (invoice?.status !== 'planned' || !invoice.invoice) continue
    used += invoice.invoice.lines
      .filter((line) => ((line.installment && boughtOn.get(line.itemId)) || line.date) <= asOf)
      .reduce((total, line) => total + line.amount, 0)
  }
  return used
}
