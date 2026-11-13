import { describe, expect, it } from 'vitest'
import type { FinancialItem } from '../types/finance'
import { amountAt, generateOccurrences, monthEndDate, monthsBetween, occurrenceDate, splitInstallments } from '../utils/recurrence'

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
      [{ key: 'rent:2026-02', status: 'completed', confirmedAt: '2026-03-01T12:00:00.000Z' }],
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

  it('applies amount changes from their month on and keeps the past', () => {
    const raised = { ...recurringItem, amountChanges: [{ from: '2026-03', amount: 130_000 }, { from: '2026-05', amount: 140_000 }] }
    expect(amountAt(raised, '2026-02')).toBe(120_000)
    expect(amountAt(raised, '2026-04')).toBe(130_000)
    expect(amountAt(raised, '2026-09')).toBe(140_000)
    expect(generateOccurrences([raised], [], '2026-03')[0]).toMatchObject({ amount: 130_000, plannedAmount: 130_000 })
  })

  it('uses the real amount and date of a completed record', () => {
    const [occurrence] = generateOccurrences(
      [recurringItem],
      [{ key: 'rent:2026-03', status: 'completed', amount: 125_000, paidDate: '2026-03-05' }],
      '2026-03',
    )
    expect(occurrence).toMatchObject({ amount: 125_000, plannedAmount: 120_000, paidDate: '2026-03-05' })
  })

  it('splits a total into installments with the remainder in the first ones', () => {
    expect(splitInstallments(10_000, 3)).toEqual([3_334, 3_333, 3_333])
    expect(splitInstallments(9_000, 3)).toEqual([3_000, 3_000, 3_000])
    expect(monthsBetween('2026-11', '2027-02')).toBe(3)
  })

  describe('installments', () => {
    const purchase: FinancialItem = {
      id: 'tv', title: 'TV', type: 'expense', kind: 'one-time', amount: 10_000, installments: 3,
      category: 'Casa', dueDate: '2026-11-30', createdAt: recurringItem.createdAt, updatedAt: recurringItem.updatedAt,
    }

    it('generates one occurrence per month, clamping the day', () => {
      expect(generateOccurrences([purchase], [], '2026-10')).toEqual([])
      expect(generateOccurrences([purchase], [], '2026-11')[0]).toMatchObject({
        dueDate: '2026-11-30', amount: 3_334, installment: { number: 1, total: 3 },
      })
      expect(generateOccurrences([purchase], [], '2027-01')[0]).toMatchObject({
        dueDate: '2027-01-30', amount: 3_333, installment: { number: 3, total: 3 },
      })
      expect(generateOccurrences([purchase], [], '2027-02')).toEqual([])
      expect(generateOccurrences([purchase], [], '2026-12')[0].key).toBe('tv:2026-12')
      expect(generateOccurrences([{ ...purchase, dueDate: '2026-01-31' }], [], '2026-02')[0].dueDate).toBe('2026-02-28')
    })

    it('keeps each installment status apart and lets a real amount override it', () => {
      const [first, second] = ['2026-11', '2026-12'].map((month) => generateOccurrences(
        [purchase], [{ key: 'tv:2026-11', status: 'completed', amount: 3_500 }], month)[0])
      expect(first).toMatchObject({ status: 'completed', amount: 3_500, plannedAmount: 3_334 })
      expect(second).toMatchObject({ status: 'planned', amount: 3_333 })
    })

    it('treats one installment as a plain one-time item', () => {
      const [only] = generateOccurrences([{ ...purchase, installments: undefined }], [], '2026-11')
      expect(only).toMatchObject({ amount: 10_000 })
      expect(only.installment).toBeUndefined()
    })
  })
})

describe('card purchases', () => {
  it('carries the cardId onto the occurrence', () => {
    const stamp = '2026-01-01T00:00:00.000Z'
    const [occurrence] = generateOccurrences([{
      id: 'a', title: 'TV', type: 'expense', kind: 'one-time', amount: 100, category: 'Casa', dueDate: '2026-06-10',
      cardId: 'nu', createdAt: stamp, updatedAt: stamp,
    }], [], '2026-06')
    expect(occurrence.cardId).toBe('nu')
  })
})
