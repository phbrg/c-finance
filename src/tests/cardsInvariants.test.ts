import { describe, expect, it } from 'vitest'
import type { CreditCard, FinanceData, FinancialItem } from '../types/finance'
import { invoiceCharges, invoiceOccurrence } from '../utils/cards'
import { addMonth } from '../utils/recurrence'

const stamp = '2026-01-01T00:00:00.000Z'
const item = (overrides: Partial<FinancialItem>): FinancialItem => ({
  id: 'x', title: 'x', type: 'expense', kind: 'one-time', amount: 10_000, category: 'Casa',
  cardId: 'c', createdAt: stamp, updatedAt: stamp, ...overrides,
})
const months = (from: string, count: number) => Array.from({ length: count }, (_, index) => addMonth(from, index))

// Payment days, including the last days of the month; an old closing day must change nothing.
const cardDays: Array<[number, number | undefined]> = [[12, undefined], [5, undefined], [1, undefined], [28, undefined], [31, undefined], [10, 25]]

describe('card invoices keep every charge exactly once', () => {
  it.each(cardDays)('pays day %i (old closing day %s): purchases and installments add up to what was bought', (dueDay, closingDay) => {
    const card: CreditCard = { id: 'c', name: 'Cartão', dueDay, ...(closingDay ? { closingDay } : {}), createdAt: stamp, updatedAt: stamp }
    const purchases = [
      item({ id: 'a', dueDate: '2026-03-01', amount: 3_333 }),
      item({ id: 'b', dueDate: '2026-03-05', amount: 9_999, installments: 3 }),
      item({ id: 'c', dueDate: '2026-03-31', amount: 100_001, installments: 6 }),
      item({ id: 'd', dueDate: '2026-04-15', amount: 5_000, installments: 2 }),
      item({ id: 'e', dueDate: '2026-02-28', amount: 777 }),
    ]
    const data: FinanceData = { version: 5, welcomeCompleted: true, items: purchases, occurrenceRecords: [], cards: [card] }

    const all = months('2026-01', 24).flatMap((month) => invoiceCharges(data, card, month))
    const byItem = (id: string) => all.filter((charge) => charge.itemId === id).reduce((sum, charge) => sum + charge.amount, 0)
    for (const purchase of purchases) expect(byItem(purchase.id), `${purchase.id} total`).toBe(purchase.amount)

    // Each charge sits in the invoice of its own month, paid on the payment day of that month.
    for (const month of months('2026-01', 24)) {
      for (const charge of invoiceCharges(data, card, month)) expect(charge.date.slice(0, 7)).toBe(month)
      const invoice = invoiceOccurrence(data, card, month)
      if (invoice) expect(invoice.dueDate.slice(0, 7)).toBe(month)
    }

    const invoiced = months('2026-01', 24).reduce((sum, month) => sum + (invoiceOccurrence(data, card, month)?.amount ?? 0), 0)
    expect(invoiced).toBe(purchases.reduce((sum, purchase) => sum + purchase.amount, 0))
  })

  it.each(cardDays)('pays day %i (old closing day %s): a subscription is billed once per month', (dueDay, closingDay) => {
    const card: CreditCard = { id: 'c', name: 'Cartão', dueDay, ...(closingDay ? { closingDay } : {}), createdAt: stamp, updatedAt: stamp }
    const netflix = item({
      id: 'nf', kind: 'recurring', amount: 5_590,
      recurrence: { dayOfMonth: 31, startMonth: '2026-03', endMonth: '2026-08', active: true },
    })
    const data: FinanceData = { version: 5, welcomeCompleted: true, items: [netflix], occurrenceRecords: [], cards: [card] }
    const charges = months('2026-01', 18).flatMap((month) => invoiceCharges(data, card, month))
    expect(charges).toHaveLength(6) // March to August, one per month
    expect(new Set(charges.map((charge) => charge.date)).size).toBe(6)
  })
})
