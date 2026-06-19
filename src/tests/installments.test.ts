import { describe, expect, it } from 'vitest'
import { addMonths } from '../utils/date'
import { createTransactionsFromDraft } from '../utils/installments'

describe('installments', () => {
  it('splits the total exactly and advances payment months', () => {
    const result = createTransactionsFromDraft(
      {
        title: 'Notebook',
        type: 'expense',
        amount: 10_000,
        paymentDate: '2026-01-31',
        category: 'Work',
        installments: 3,
      },
      new Date('2026-01-01T12:00:00.000Z'),
    )

    expect(result.map(({ amount }) => amount)).toEqual([3_334, 3_333, 3_333])
    expect(result.reduce((total, item) => total + item.amount, 0)).toBe(10_000)
    expect(result.map(({ paymentDate }) => paymentDate)).toEqual([
      '2026-01-31',
      '2026-02-28',
      '2026-03-31',
    ])
    expect(result.map(({ installment }) => installment?.current)).toEqual([1, 2, 3])
  })

  it('handles leap years and month ends', () => {
    expect(addMonths('2024-01-31', 1)).toBe('2024-02-29')
    expect(addMonths('2026-12-31', 2)).toBe('2027-02-28')
  })

  it('does not create installments for income', () => {
    const [result] = createTransactionsFromDraft({
      title: 'Salary',
      type: 'income',
      amount: 500_000,
      paymentDate: '2026-06-05',
      category: 'Salary',
      installments: 12,
    })
    expect(result.installment).toBeUndefined()
    expect(result.amount).toBe(500_000)
  })
})
