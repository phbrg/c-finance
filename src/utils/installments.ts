import type { Transaction, TransactionDraft } from '../types/transaction'
import { addMonths } from './date'

function createId(): string {
  return crypto.randomUUID()
}

export function createTransactionsFromDraft(
  draft: TransactionDraft,
  now = new Date(),
): Transaction[] {
  const count = draft.type === 'expense' ? (draft.installments ?? 1) : 1
  const baseAmount = Math.floor(draft.amount / count)
  const remainder = draft.amount % count
  const timestamp = now.toISOString()
  const seriesId = count > 1 ? createId() : undefined

  return Array.from({ length: count }, (_, index) => ({
    id: createId(),
    title: draft.title.trim(),
    type: draft.type,
    amount: baseAmount + (index < remainder ? 1 : 0),
    paymentDate: addMonths(draft.paymentDate, index),
    category: draft.category.trim(),
    ...(draft.notes?.trim() ? { notes: draft.notes.trim() } : {}),
    ...(seriesId
      ? { installment: { seriesId, current: index + 1, total: count } }
      : {}),
    createdAt: timestamp,
    updatedAt: timestamp,
  }))
}
