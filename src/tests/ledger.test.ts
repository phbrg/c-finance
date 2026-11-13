import { describe, expect, it } from 'vitest'
import type { FinanceData, FinancialItem } from '../types/finance'
import type { CreditCard } from '../types/finance'
import { cardSummary, carryIn, categoryBreakdown, dailySeries, invoiceSeries, monthEntries, monthLedger, monthsSeries, summarizeEntries } from '../utils/ledger'

const stamp = '2026-01-01T00:00:00.000Z'
const item = (overrides: Partial<FinancialItem>): FinancialItem => ({
  id: 'i', title: 'Item', type: 'expense', kind: 'one-time', amount: 1_000, category: 'Casa',
  dueDate: '2026-06-10', createdAt: stamp, updatedAt: stamp, ...overrides,
})
const base: FinanceData = {
  version: 5,
  welcomeCompleted: true,
  openingBalance: { amount: 100_000, month: '2026-05' },
  items: [
    item({ id: 'salary', title: 'Salário', type: 'income', amount: 500_000, category: 'Renda', dueDate: '2026-05-05' }),
    item({ id: 'rent', title: 'Aluguel', amount: 150_000, kind: 'recurring', dueDate: undefined, recurrence: { dayOfMonth: 8, startMonth: '2026-05', active: true } }),
    item({ id: 'tv', title: 'TV', amount: 30_000, dueDate: '2026-05-20', installments: 3 }),
    item({ id: 'food', title: 'Mercado', amount: 5_000, category: 'Mercado', dueDate: '2026-06-03' }),
  ],
  occurrenceRecords: [{ key: 'salary:2026-05', status: 'completed', confirmedAt: stamp }],
  cards: [],
}

describe('ledger', () => {
  it('lists items and installments ordered by date', () => {
    const entries = monthEntries(base, '2026-06')
    expect(entries.map((entry) => entry.title)).toEqual(['Mercado', 'Aluguel', 'TV'])
    expect(entries[2].installment).toEqual({ number: 2, total: 3 })
  })

  it('summarizes expected, paid and pending, ignoring skipped', () => {
    const [salary] = monthEntries(base, '2026-05').filter((entry) => entry.itemId === 'salary')
    expect(summarizeEntries([salary, { ...salary, key: 'x', status: 'skipped' }])).toMatchObject({
      incomeExpected: 500_000, incomeReceived: 500_000, pendingCount: 0, net: 500_000, realized: 500_000,
    })
  })

  it('carries the net of every month since the opening balance', () => {
    expect(carryIn(base, '2026-04')).toEqual({ amount: 0, known: false })
    expect(carryIn(base, '2026-05')).toEqual({ amount: 100_000, known: true })
    // May: +500000 salary -150000 rent -10000 first TV installment.
    expect(carryIn(base, '2026-06')).toEqual({ amount: 440_000, known: true })
    expect(carryIn({ ...base, openingBalance: undefined }, '2026-06').known).toBe(false)
  })

  it('builds the month ledger', () => {
    const ledger = monthLedger(base, '2026-06')
    // June: -5000 mercado -150000 rent -10000 second TV installment.
    expect(ledger.totals.expenseExpected).toBe(165_000)
    expect(ledger.opening).toBe(440_000)
    expect(ledger.closingProjected).toBe(275_000)
    expect(ledger.balanceNow).toBe(440_000)
    expect(ledger.totals.pendingCount).toBe(3)
  })

  it('draws one point per day with the running balance', () => {
    const series = dailySeries(monthEntries(base, '2026-06'), '2026-06', 440_000)
    expect(series).toHaveLength(30)
    expect(series[2]).toMatchObject({ day: 3, expense: 5_000, balance: 435_000 })
    expect(series[7]).toMatchObject({ day: 8, balance: 285_000 })
    expect(series[29].balance).toBe(275_000)
    expect(series[0].entries).toEqual([])
  })

  it('breaks spending down by category', () => {
    const result = categoryBreakdown(monthEntries(base, '2026-06'))
    expect(result[0]).toEqual({ category: 'Casa', amount: 160_000, count: 2 })
    expect(result[1]).toEqual({ category: 'Mercado', amount: 5_000, count: 1 })
  })

  it('returns months from the start month on, future ones included, with closing balance', () => {
    const series = monthsSeries(base, '2026-04', 4)
    expect(series.map(({ month }) => month)).toEqual(['2026-04', '2026-05', '2026-06', '2026-07'])
    expect(series[0].closing).toBe(0)
    expect(series[1]).toMatchObject({ income: 500_000, expense: 160_000, closing: 440_000 })
    expect(series[2].closing).toBe(275_000)
    expect(series[3]).toMatchObject({ income: 0, expense: 160_000 })
  })

  it('filters the totals of each month but not the real closing balance', () => {
    const series = monthsSeries(base, '2026-05', 3, (entry) => entry.itemId === 'tv')
    expect(series.map((point) => point.expense)).toEqual([10_000, 10_000, 10_000])
    expect(series.map((point) => point.income)).toEqual([0, 0, 0])
    expect(series[1].closing).toBe(275_000)
  })
})

const nubank: CreditCard = { id: 'nu', name: 'Nubank', dueDay: 12, limit: 100_000, createdAt: stamp, updatedAt: stamp }
// Bought on 06-10: it goes into the June invoice, paid on 2026-06-12.
const withCard: FinanceData = {
  ...base,
  cards: [nubank],
  items: [...base.items, item({ id: 'shoes', title: 'Tênis', amount: 20_000, category: 'Roupa', cardId: 'nu' })],
}

describe('ledger with a card', () => {
  it('lists the purchase and the invoice of its month, on the payment day', () => {
    const june = monthEntries(withCard, '2026-06')
    expect(june.map((entry) => entry.title)).toContain('Tênis')
    const invoice = june.find((entry) => entry.invoice)
    expect(invoice).toMatchObject({ key: 'card:nu:2026-06', amount: 20_000, dueDate: '2026-06-12', category: 'Cartão' })
    expect(june.indexOf(invoice!)).toBeGreaterThan(0) // ordered among the rest (rent on the 8th comes first)
    expect(monthEntries(withCard, '2026-07').some((entry) => entry.invoice)).toBe(false)
  })

  it('the purchase does not move cash, the invoice does on the payment day', () => {
    expect(monthLedger(withCard, '2026-06').closingProjected).toBe(monthLedger(base, '2026-06').closingProjected - 20_000)
    expect(monthLedger(withCard, '2026-07').totals.net).toBe(monthLedger(base, '2026-07').totals.net)
    const days = dailySeries(monthEntries(withCard, '2026-06'), '2026-06', 0)
    expect(days[9].expense).toBe(days[9].entries.filter((entry) => !entry.cardId && entry.type === 'expense').reduce((sum, entry) => sum + entry.amount, 0))
    expect(days[11].expense).toBe(20_000)
  })

  it('pending count and totals count the invoice, not the purchase', () => {
    const june = summarizeEntries(monthEntries(withCard, '2026-06'))
    const plain = summarizeEntries(monthEntries(base, '2026-06'))
    expect(june).toMatchObject({ expenseExpected: plain.expenseExpected + 20_000, pendingCount: plain.pendingCount + 1 })
  })

  it('category breakdown counts purchases, not the invoice', () => {
    const june = categoryBreakdown(monthEntries(withCard, '2026-06'))
    expect(june.find((row) => row.category === 'Roupa')).toEqual({ category: 'Roupa', amount: 20_000, count: 1 })
    expect(june.some((row) => row.category === 'Cartão')).toBe(false)
  })

  it('invoiceSeries lists the invoice totals by month of purchase', () => {
    expect(invoiceSeries(withCard, 'nu', '2026-05', 3).map(({ month, total, count }) => [month, total, count])).toEqual([
      ['2026-05', 0, 0], ['2026-06', 20_000, 1], ['2026-07', 0, 0],
    ])
    expect(invoiceSeries(withCard, 'nope', '2026-06', 3)).toEqual([])
  })

  it('cardSummary: invoice of this month and used limit', () => {
    const summary = cardSummary(withCard, 'nu', '2026-06-20')
    expect(summary).toEqual({
      card: nubank,
      dueThisMonth: { month: '2026-06', total: 20_000, status: 'planned', dueDate: '2026-06-12' },
      used: 20_000, available: 80_000, limitPct: 20,
    })
    // Before the purchase nothing is used; in July there is no invoice.
    expect(cardSummary(withCard, 'nu', '2026-06-01')).toMatchObject({ used: 0 })
    expect(cardSummary(withCard, 'nu', '2026-07-01')?.dueThisMonth).toBeUndefined()
    expect(cardSummary(withCard, 'nope', '2026-06-20')).toBeUndefined()
  })
})
