import { describe, expect, it } from 'vitest'
import type { FinancialItem } from '../types/finance'
import { generateOccurrences, monthEndDate, occurrenceDate } from '../utils/recurrence'

const recurringItem: FinancialItem = {
  id: 'rent',
  title: 'Rent',
  type: 'expense',
  kind: 'recurring',
  amount: 120_000,
  category: 'Home',
  recurrence: { dayOfMonth: 31, startMonth: '2026-01', active: true },
  createdAt: '2026-01-01T12:00:00.000Z',
  updatedAt: '2026-01-01T12:00:00.000Z',
}

describe('recurrence', () => {
  it('uses the final valid day for shorter months', () => {
    expect(occurrenceDate('2026-02', 31)).toBe('2026-02-28')
    expect(occurrenceDate('2024-02', 31)).toBe('2024-02-29')
  })

  it('returns the final day used by the dashboard monthly overview', () => {
    expect(monthEndDate('2026-06')).toBe('2026-06-30')
    expect(monthEndDate('2024-02')).toBe('2024-02-29')
  })

  it('generates monthly occurrences and applies saved status', () => {
    const occurrences = generateOccurrences(
      [recurringItem],
      [{ key: 'rent:2026-02-28', status: 'completed', confirmedAt: '2026-03-01T12:00:00.000Z' }],
      '2026-02',
    )
    expect(occurrences).toHaveLength(1)
    expect(occurrences[0]).toMatchObject({
      dueDate: '2026-02-28',
      status: 'completed',
      confirmedAt: '2026-03-01T12:00:00.000Z',
    })
  })

  it('respects start, end and active state', () => {
    const ended = { ...recurringItem, recurrence: { dayOfMonth: 10, startMonth: '2026-02', endMonth: '2026-03', active: true } }
    expect(generateOccurrences([ended], [], '2026-01')).toEqual([])
    expect(generateOccurrences([ended], [], '2026-04')).toEqual([])
    expect(generateOccurrences([{ ...ended, recurrence: { ...ended.recurrence, active: false } }], [], '2026-03')).toEqual([])
  })
})
