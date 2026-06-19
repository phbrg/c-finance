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

export function addMonth(month: string, offset: number): string {
  const [year, monthNumber] = month.split('-').map(Number)
  const result = new Date(year, monthNumber - 1 + offset, 1)
  return `${result.getFullYear()}-${String(result.getMonth() + 1).padStart(2, '0')}`
}

export function monthRange(startMonth: string, endMonth: string): string[] {
  const months: string[] = []
  for (let month = startMonth; month <= endMonth; month = addMonth(month, 1)) {
    months.push(month)
    if (months.length > 1_200) break
  }
  return months
}

export function generateOccurrences(
  items: FinancialItem[],
  records: OccurrenceRecord[],
  month: string,
): FinancialOccurrence[] {
  const recordMap = new Map(records.map((record) => [record.key, record]))

  return items
    .flatMap((item): FinancialOccurrence[] => {
      let dueDate: string | undefined
      if (item.kind === 'recurring' && item.recurrence?.active) {
        const isInRange =
          month >= item.recurrence.startMonth &&
          (!item.recurrence.endMonth || month <= item.recurrence.endMonth)
        if (isInRange) dueDate = occurrenceDate(month, item.recurrence.dayOfMonth)
      } else if (item.kind === 'one-time' && item.dueDate?.startsWith(month)) {
        dueDate = item.dueDate
      }
      if (!dueDate) return []

      const key = `${item.id}:${dueDate}`
      const record = recordMap.get(key)
      return [{
        key,
        itemId: item.id,
        title: item.title,
        type: item.type,
        kind: item.kind,
        amount: item.amount,
        category: item.category,
        dueDate,
        status: record?.status ?? 'planned',
        ...(record?.completedAt ? { completedAt: record.completedAt } : {}),
        ...(item.investmentId ? { investmentId: item.investmentId } : {}),
      }]
    })
    .sort((first, second) => first.dueDate.localeCompare(second.dueDate))
}
