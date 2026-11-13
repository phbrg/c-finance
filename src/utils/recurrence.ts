import type {
  FinancialItem,
  FinancialOccurrence,
  OccurrenceRecord,
} from '../types/finance'

export function daysInMonth(month: string): number {
  const [year, monthNumber] = month.split('-').map(Number)
  return new Date(year, monthNumber, 0).getDate()
}

export function occurrenceDate(month: string, dayOfMonth: number): string {
  return `${month}-${String(Math.min(dayOfMonth, daysInMonth(month))).padStart(2, '0')}`
}

export function monthEndDate(month: string): string {
  return `${month}-${String(daysInMonth(month)).padStart(2, '0')}`
}

export function addMonth(month: string, offset: number): string {
  const [year, monthNumber] = month.split('-').map(Number)
  const result = new Date(year, monthNumber - 1 + offset, 1)
  return `${result.getFullYear()}-${String(result.getMonth() + 1).padStart(2, '0')}`
}

/** Amount of an item in a given month, honoring "from this month on" changes. */
export function amountAt(item: Pick<FinancialItem, 'amount' | 'amountChanges'>, month: string): number {
  let amount = item.amount
  for (const change of item.amountChanges ?? []) {
    if (change.from <= month) amount = change.amount
  }
  return amount
}

export function splitInstallments(total: number, count: number): number[] {
  const base = Math.floor(total / count)
  const remainder = total - base * count
  return Array.from({ length: count }, (_, index) => base + (index < remainder ? 1 : 0))
}

export function monthsBetween(from: string, to: string): number {
  const [fromYear, fromMonth] = from.split('-').map(Number)
  const [toYear, toMonth] = to.split('-').map(Number)
  return (toYear - fromYear) * 12 + (toMonth - fromMonth)
}

/** 0-based installment of a purchase in `month`, or undefined when it has none there. */
function installmentIndex(item: FinancialItem, month: string): number | undefined {
  if (item.kind !== 'one-time' || !item.dueDate || !item.installments || item.installments < 2) return undefined
  const index = monthsBetween(item.dueDate.slice(0, 7), month)
  return index >= 0 && index < item.installments ? index : undefined
}

/** Date the item happens in `month`, or undefined when it does not happen then. */
export function itemDateInMonth(item: FinancialItem, month: string): string | undefined {
  if (item.kind === 'recurring' && item.recurrence?.active) {
    const { startMonth, endMonth, dayOfMonth } = item.recurrence
    if (month >= startMonth && (!endMonth || month <= endMonth)) return occurrenceDate(month, dayOfMonth)
    return undefined
  }
  if (item.kind !== 'one-time' || !item.dueDate) return undefined
  if (item.installments && item.installments > 1) {
    return installmentIndex(item, month) === undefined
      ? undefined
      : occurrenceDate(month, Number(item.dueDate.slice(8, 10)))
  }
  return item.dueDate.startsWith(month) ? item.dueDate : undefined
}

/** Occurrences of a month: recurring items, one-time items and one installment per purchase. */
export function generateOccurrences(
  items: FinancialItem[],
  records: OccurrenceRecord[],
  month: string,
): FinancialOccurrence[] {
  const recordMap = new Map(records.map((record) => [record.key, record]))

  return items
    .flatMap((item): FinancialOccurrence[] => {
      const dueDate = itemDateInMonth(item, month)
      if (!dueDate) return []

      const key = `${item.id}:${month}`
      const record = recordMap.get(key)
      const index = installmentIndex(item, month)
      const plannedAmount = index === undefined
        ? amountAt(item, month)
        : splitInstallments(item.amount, item.installments!)[index]
      return [{
        key,
        itemId: item.id,
        title: item.title,
        type: item.type,
        kind: item.kind,
        amount: record?.status === 'completed' && record.amount !== undefined ? record.amount : plannedAmount,
        plannedAmount,
        category: item.category,
        dueDate,
        status: record?.status ?? 'planned',
        ...(item.cardId ? { cardId: item.cardId } : {}),
        ...(record?.paidDate ? { paidDate: record.paidDate } : {}),
        ...(record?.confirmedAt ? { confirmedAt: record.confirmedAt } : {}),
        ...(index === undefined ? {} : { installment: { number: index + 1, total: item.installments! } }),
      }]
    })
    .sort((first, second) => first.dueDate.localeCompare(second.dueDate))
}
