import { describe, expect, it } from 'vitest'
import type { CreditCard, FinanceData, FinancialItem } from '../types/finance'
import {
  invoiceCharges,
  invoiceDueDate,
  invoiceForecast,
  invoiceMonthForDate,
  invoiceOccurrence,
  usedLimit,
} from '../utils/cards'
import { splitInstallments } from '../utils/recurrence'

const stamp = '2026-01-01T00:00:00.000Z'
const card = (dueDay: number): CreditCard => ({
  id: 'c', name: 'Nubank', dueDay, limit: 500_000, createdAt: stamp, updatedAt: stamp,
})
const nubank = card(12)

const purchase = (overrides: Partial<FinancialItem>): FinancialItem => ({
  id: 'tv', title: 'TV', type: 'expense', kind: 'one-time', amount: 10_000, category: 'Casa',
  dueDate: '2026-06-06', cardId: 'c', createdAt: stamp, updatedAt: stamp, ...overrides,
})
const dataWith = (items: FinancialItem[], cards = [nubank], records: FinanceData['occurrenceRecords'] = []): FinanceData => ({
  version: 5, welcomeCompleted: true, items, occurrenceRecords: records, cards,
})
const titles = (data: FinanceData, month: string) => invoiceCharges(data, nubank, month).map((line) => line.title)

describe('the invoice of a month holds the purchases of that month', () => {
  const data = dataWith([
    purchase({ id: 'oct', title: 'Sapato', dueDate: '2026-10-20' }),
    purchase({ id: 'tv', title: 'TV', dueDate: '2026-10-20', amount: 30_000, installments: 3 }),
    purchase({ id: 'nov3', title: 'Mercado', dueDate: '2026-11-03' }),
    purchase({ id: 'nov20', title: 'Jantar', dueDate: '2026-11-20' }),
  ])

  it('a purchase on 20/10 is not in the November invoice', () => {
    expect(titles(data, '2026-10')).toEqual(['Sapato', 'TV'])
    expect(titles(data, '2026-11')).not.toContain('Sapato')
  })

  it('November has the purchase of 03/11 and installment 2/3 of the 20/10 purchase, dated 20/11', () => {
    expect(invoiceCharges(data, nubank, '2026-11')).toEqual([
      expect.objectContaining({ title: 'Mercado', date: '2026-11-03' }),
      expect.objectContaining({ title: 'Jantar', date: '2026-11-20' }),
      expect.objectContaining({ title: 'TV', date: '2026-11-20', amount: 10_000, installment: { number: 2, total: 3 } }),
    ])
  })

  it('a purchase on 20/11 is not in the December invoice', () => {
    expect(titles(data, '2026-12')).toEqual(['TV'])
  })

  it('the invoice is paid on the payment day of its own month', () => {
    expect(invoiceOccurrence(data, nubank, '2026-11')).toMatchObject({ dueDate: '2026-11-12', amount: 30_000 })
  })

  it('every charge is dated inside the month of its invoice', () => {
    for (const month of ['2026-10', '2026-11', '2026-12', '2027-01']) {
      for (const line of invoiceCharges(data, nubank, month)) expect(line.date.slice(0, 7)).toBe(month)
    }
  })
})

describe('invoice dates', () => {
  it('a charge goes into the invoice of its own month, whatever the day', () => {
    expect(invoiceMonthForDate(nubank, '2026-06-01')).toBe('2026-06')
    expect(invoiceMonthForDate(nubank, '2026-06-30')).toBe('2026-06')
    expect(invoiceMonthForDate(card(3), '2026-12-31')).toBe('2026-12')
  })

  it('payment day 31 falls on the last day of shorter months', () => {
    expect(invoiceDueDate(card(31), '2026-02')).toBe('2026-02-28')
    expect(invoiceDueDate(card(31), '2028-02')).toBe('2028-02-29')
    expect(invoiceDueDate(card(31), '2026-04')).toBe('2026-04-30')
    expect(invoiceDueDate(nubank, '2026-07')).toBe('2026-07-12')
  })

  it('old cards with a closing day keep working and the closing day is ignored', () => {
    const old = { ...nubank, closingDay: 5 }
    const data = dataWith([purchase({ dueDate: '2026-06-20' })], [old])
    expect(invoiceOccurrence(data, old, '2026-06')).toMatchObject({ amount: 10_000, dueDate: '2026-06-12' })
    expect(invoiceOccurrence(data, old, '2026-07')).toBeNull()
  })
})

describe('installments', () => {
  it('gives the remainder cents to the first installments', () => {
    expect(splitInstallments(10_000, 3)).toEqual([3_334, 3_333, 3_333])
    expect(splitInstallments(10_000, 1)).toEqual([10_000])
  })

  it('puts installment k in the month of the purchase plus k-1, same day', () => {
    const data = dataWith([purchase({ installments: 3 })])
    expect(invoiceCharges(data, nubank, '2026-05')).toEqual([])
    expect(invoiceCharges(data, nubank, '2026-06')).toEqual([
      expect.objectContaining({ amount: 3_334, installment: { number: 1, total: 3 }, date: '2026-06-06' }),
    ])
    expect(invoiceCharges(data, nubank, '2026-08')[0]).toMatchObject({ amount: 3_333, date: '2026-08-06', installment: { number: 3, total: 3 } })
    expect(invoiceCharges(data, nubank, '2026-09')).toEqual([])
  })

  it('a purchase on the 31st lands on the last day of shorter months', () => {
    const data = dataWith([purchase({ dueDate: '2026-01-31', installments: 2 })])
    expect(invoiceCharges(data, nubank, '2026-02')[0].date).toBe('2026-02-28')
  })

  it('a single purchase has no installment label', () => {
    const [line] = invoiceCharges(dataWith([purchase({})]), nubank, '2026-06')
    expect(line.amount).toBe(10_000)
    expect(line.installment).toBeUndefined()
  })
})

describe('recurring charge on a card', () => {
  const subscription = purchase({
    id: 'sub', kind: 'recurring', dueDate: undefined, amount: 3_000,
    recurrence: { dayOfMonth: 10, startMonth: '2026-01', active: true },
    amountChanges: [{ from: '2026-08', amount: 4_000 }],
  })

  it('lands one charge per month, with the amount of that month', () => {
    const data = dataWith([subscription])
    const july = invoiceCharges(data, nubank, '2026-07')
    expect(july).toEqual([expect.objectContaining({ date: '2026-07-10', amount: 3_000 })])
    expect(invoiceCharges(data, nubank, '2026-08')[0]).toMatchObject({ date: '2026-08-10', amount: 4_000 })
  })

  it('does not charge before it starts', () => {
    expect(invoiceCharges(dataWith([subscription]), nubank, '2025-12')).toEqual([])
  })
})

describe('invoice occurrence', () => {
  it('is an expense on the payment day with its lines', () => {
    const data = dataWith([purchase({}), purchase({ id: 'b', title: 'Mercado', amount: 5_000, dueDate: '2026-05-01' })])
    const invoice = invoiceOccurrence(data, nubank, '2026-06')
    expect(invoice).toMatchObject({
      key: 'card:c:2026-06', title: 'Fatura Nubank', category: 'Cartão', type: 'expense', amount: 10_000, dueDate: '2026-06-12', status: 'planned',
    })
    expect(invoice).not.toHaveProperty('cardId')
    expect(invoice?.invoice).toEqual({ cardId: 'c', cardName: 'Nubank', lines: [expect.objectContaining({ title: 'TV' })] })
    expect(invoiceOccurrence(data, nubank, '2026-05')).toMatchObject({ amount: 5_000, dueDate: '2026-05-12' })
  })

  it('an empty invoice does not show up, unless it has a record', () => {
    const data = dataWith([purchase({})])
    expect(invoiceOccurrence(data, nubank, '2026-12')).toBeNull()
    const withRecord = dataWith([purchase({})], [nubank], [{ key: 'card:c:2026-12', status: 'skipped' }])
    expect(invoiceOccurrence(withRecord, nubank, '2026-12')).toMatchObject({ amount: 0, status: 'skipped' })
  })

  it('uses the amount really paid when completed', () => {
    const data = dataWith([purchase({})], [nubank], [{ key: 'card:c:2026-06', status: 'completed', amount: 9_500, paidDate: '2026-06-10' }])
    expect(invoiceOccurrence(data, nubank, '2026-06')).toMatchObject({ amount: 9_500, plannedAmount: 10_000, paidDate: '2026-06-10' })
  })
})

describe('forecast and limit', () => {
  const data = dataWith([purchase({ installments: 3 })])

  it('lists the total per month', () => {
    expect(invoiceForecast(data, nubank, '2026-05', 5).map(({ month, total, count }) => [month, total, count])).toEqual([
      ['2026-05', 0, 0],
      ['2026-06', 3_334, 1],
      ['2026-07', 3_333, 1],
      ['2026-08', 3_333, 1],
      ['2026-09', 0, 0],
    ])
  })

  it('counts only unpaid invoices as used limit', () => {
    expect(usedLimit(data, nubank, '2026-06')).toBe(10_000)
    const paid = dataWith([purchase({ installments: 3 })], [nubank], [{ key: 'card:c:2026-06', status: 'completed' }])
    expect(usedLimit(paid, nubank, '2026-06')).toBe(6_666)
    expect(usedLimit(paid, nubank, '2026-07')).toBe(6_666)
    expect(usedLimit(paid, nubank, '2026-08')).toBe(3_333)
  })

  it('ignores subscription charges that have not been billed yet, but keeps future installments', () => {
    const netflix = purchase({ id: 'nf', title: 'Netflix', kind: 'recurring', dueDate: undefined, amount: 5_590, recurrence: { dayOfMonth: 8, startMonth: '2026-05', active: true } })
    const sub = dataWith([netflix, purchase({ installments: 3 })])
    // On 2026-06-10: Netflix billed on 06-08 (July and later are future), the TV bought on 06-06 counts in full.
    expect(usedLimit(sub, nubank, '2026-06', 36, '2026-06-10')).toBe(5_590 + 10_000)
    // Before the TV was bought, none of its installments count.
    expect(usedLimit(sub, nubank, '2026-06', 36, '2026-06-05')).toBe(0)
  })
})
