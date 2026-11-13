import type { FinanceData, FinancialItem } from '../types/finance'
import { usedLimit } from './cards'
import { today } from './date'
import { monthLedger } from './ledger'
import { addMonth } from './recurrence'

export interface PurchaseInput {
  title: string
  amount: number
  installments: number
  date: string
  category: string
  /** Pay with this card: each installment goes into the invoice of its month, paid on the card's payment day. */
  cardId?: string
}

export interface SimulationMonth {
  month: string
  /** Added to the cash of this month: the installment, or the invoice increase when paid with a card. */
  added: number
  closingBefore: number
  closingAfter: number
}

export interface PurchaseSimulation {
  months: SimulationMonth[]
  firstNegativeMonth?: string
  /** Month with the lowest balance after the purchase. */
  worstMonth: string
  /** Card limit used before and after the purchase; only when paid with a card that has a limit. */
  limit?: { before: number; after: number; limit: number }
}

/** Compares the projected balance of the next months with and without a purchase. Nothing is saved. */
export function simulatePurchase(data: FinanceData, input: PurchaseInput, horizonMonths: number): PurchaseSimulation {
  const stamp = `${input.date}T00:00:00.000Z`
  const simulated: FinancialItem = {
    id: 'simulated-purchase',
    title: input.title,
    type: 'expense',
    kind: 'one-time',
    amount: input.amount,
    category: input.category,
    ...(input.cardId ? { cardId: input.cardId } : {}),
    ...(input.installments > 1 ? { installments: input.installments } : {}),
    dueDate: input.date,
    createdAt: stamp,
    updatedAt: stamp,
  }
  const withPurchase = { ...data, items: [...data.items, simulated] }
  const start = input.date.slice(0, 7)

  const months = Array.from({ length: horizonMonths }, (_, index): SimulationMonth => {
    const month = addMonth(start, index)
    const before = monthLedger(data, month)
    const after = monthLedger(withPurchase, month)
    return {
      month,
      added: before.totals.net - after.totals.net,
      closingBefore: before.closingProjected,
      closingAfter: after.closingProjected,
    }
  })
  const worst = months.reduce((low, point) => point.closingAfter < low.closingAfter ? point : low)
  const negative = months.find((point) => point.closingAfter < 0)
  const card = data.cards.find((item) => item.id === input.cardId)
  // Charges after today count only once they are made, so look at the purchase day.
  const asOf = input.date > today() ? input.date : today()
  const from = start < asOf.slice(0, 7) ? start : asOf.slice(0, 7)
  const limit = card?.limit
    ? { before: usedLimit(data, card, from, 36, asOf), after: usedLimit(withPurchase, card, from, 36, asOf), limit: card.limit }
    : undefined
  return { months, worstMonth: worst.month, ...(negative ? { firstNegativeMonth: negative.month } : {}), ...(limit ? { limit } : {}) }
}
