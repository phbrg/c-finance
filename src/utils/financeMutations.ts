import type {
  CreditCard,
  CreditCardDraft,
  FinanceData,
  FinancialItem,
  FinancialItemDraft,
  OccurrenceRecord,
  OccurrenceStatus,
  OpeningBalance,
} from '../types/finance'
import { canonicalCategory } from './category'
import { amountAt } from './recurrence'

interface Identity {
  id: string
  timestamp: string
}

export function addFinancialItem(data: FinanceData, draft: FinancialItemDraft, identity: Identity): FinanceData {
  const item = itemFromDraft(normalizeDraft(data, draft), identity.id, identity.timestamp, identity.timestamp)
  return { ...data, items: [...data.items, item] }
}

export function updateFinancialItem(
  data: FinanceData,
  id: string,
  rawDraft: FinancialItemDraft,
  timestamp: string,
  options: { amountFrom?: string } = {},
): FinanceData | null {
  const current = data.items.find((item) => item.id === id)
  if (!current) return null
  const draft = normalizeDraft(data, rawDraft)
  const updated = itemFromDraft(draft, current.id, current.createdAt, timestamp)

  const { amountFrom } = options
  if (amountFrom && current.kind === 'recurring' && updated.kind === 'recurring') {
    // Future-only change: keep the base amount, so past months keep their value.
    updated.amount = current.amount
    if (current.amountChanges) updated.amountChanges = current.amountChanges
    if (draft.amount !== amountAt(current, amountFrom)) {
      updated.amountChanges = [
        ...(current.amountChanges ?? []).filter((change) => change.from !== amountFrom),
        { from: amountFrom, amount: draft.amount },
      ].sort((first, second) => first.from.localeCompare(second.from))
    }
  }

  return { ...data, items: data.items.map((item) => item.id === id ? updated : item) }
}

export function deleteFinancialItem(data: FinanceData, id: string): FinanceData {
  return {
    ...data,
    items: data.items.filter((item) => item.id !== id),
    occurrenceRecords: data.occurrenceRecords.filter((record) => !record.key.startsWith(`${id}:`)),
  }
}

export function changeOccurrenceStatus(
  data: FinanceData,
  key: string,
  status: OccurrenceStatus,
  confirmedAt: string,
  details: { amount?: number; paidDate?: string } = {},
): FinanceData {
  const others = data.occurrenceRecords.filter((item) => item.key !== key)
  if (status === 'planned') return { ...data, occurrenceRecords: others }
  const record: OccurrenceRecord = status === 'completed'
    ? {
        key,
        status,
        confirmedAt,
        ...(details.amount !== undefined ? { amount: details.amount } : {}),
        ...(details.paidDate ? { paidDate: details.paidDate } : {}),
      }
    : { key, status }
  return { ...data, occurrenceRecords: [...others, record] }
}

export function setOpeningBalance(data: FinanceData, value: OpeningBalance | null): FinanceData {
  const next = { ...data }
  if (value) next.openingBalance = value
  else delete next.openingBalance
  return next
}

export function addCard(data: FinanceData, draft: CreditCardDraft, identity: Identity): FinanceData {
  return { ...data, cards: [...data.cards, cardFromDraft(draft, identity.id, identity.timestamp, identity.timestamp)] }
}

export function updateCard(data: FinanceData, id: string, draft: CreditCardDraft, timestamp: string): FinanceData | null {
  const current = data.cards.find((card) => card.id === id)
  if (!current) return null
  return { ...data, cards: data.cards.map((card) => card.id === id ? cardFromDraft(draft, id, current.createdAt, timestamp) : card) }
}

/** Purchases stay as common expenses (installments included); the invoice records of the card go away. */
export function deleteCard(data: FinanceData, id: string): FinanceData {
  return {
    ...data,
    cards: data.cards.filter((card) => card.id !== id),
    items: data.items.map((item) => {
      if (item.cardId !== id) return item
      const rest = { ...item }
      delete rest.cardId
      return rest
    }),
    occurrenceRecords: data.occurrenceRecords.filter((record) => !record.key.startsWith(`card:${id}:`)),
  }
}

function cardFromDraft(draft: CreditCardDraft, id: string, createdAt: string, updatedAt: string): CreditCard {
  return {
    id,
    createdAt,
    updatedAt,
    name: draft.name.trim(),
    dueDay: draft.dueDay,
    ...(draft.limit ? { limit: draft.limit } : {}),
  }
}

/** Category spelling is unified; installments only make sense on a one-time expense; only expenses use a card. */
function normalizeDraft(data: FinanceData, draft: FinancialItemDraft): FinancialItemDraft {
  const category = canonicalCategory(draft.category, data.items.map((item) => item.category))
  const { installments, cardId, ...rest } = draft
  const split = draft.type === 'expense' && draft.kind === 'one-time' && installments && installments > 1
  return { ...rest, category, ...(split ? { installments } : {}), ...(draft.type === 'expense' && cardId ? { cardId } : {}) }
}

function itemFromDraft(
  draft: FinancialItemDraft,
  id: string,
  createdAt: string,
  updatedAt: string,
): FinancialItem {
  return {
    id,
    createdAt,
    updatedAt,
    title: draft.title.trim(),
    type: draft.type,
    kind: draft.kind,
    amount: draft.amount,
    category: draft.category.trim(),
    ...(draft.notes?.trim() ? { notes: draft.notes.trim() } : {}),
    ...(draft.cardId ? { cardId: draft.cardId } : {}),
    ...(draft.installments ? { installments: draft.installments } : {}),
    ...(draft.kind === 'recurring'
      ? { recurrence: {
          dayOfMonth: draft.dayOfMonth ?? 1,
          startMonth: draft.startMonth ?? updatedAt.slice(0, 7),
          ...(draft.endMonth ? { endMonth: draft.endMonth } : {}),
          active: true,
        } }
      : { dueDate: draft.dueDate }),
  }
}
