import type { TransactionType } from './common'

export type FinancialItemKind = 'recurring' | 'one-time'
export type OccurrenceStatus = 'planned' | 'completed' | 'skipped'

export interface RecurrenceRule {
  dayOfMonth: number
  startMonth: string
  endMonth?: string
  active: boolean
}

/** A change of amount that applies from `from` (YYYY-MM) onward, so past months keep their value. */
export interface AmountChange {
  from: string
  amount: number
}

export interface FinancialItem {
  id: string
  title: string
  type: TransactionType
  kind: FinancialItemKind
  amount: number
  amountChanges?: AmountChange[]
  category: string
  notes?: string
  /** Expense paid with this credit card: it goes into the invoice of its month, which leaves the balance on the payment day. */
  cardId?: string
  /** One-time expense paid in N monthly installments, starting in the month of `dueDate`. `amount` is the total. */
  installments?: number
  recurrence?: RecurrenceRule
  dueDate?: string
  createdAt: string
  updatedAt: string
}

export interface CreditCard {
  id: string
  name: string
  /** Old field from when invoices had a closing day. Kept so saved data stays valid; ignored. */
  closingDay?: number
  /** Day the invoice is paid; the purchases of the month go into that month's invoice. */
  dueDay: number
  /** Credit limit in cents. */
  limit?: number
  createdAt: string
  updatedAt: string
}

export interface CreditCardDraft {
  name: string
  dueDay: number
  limit?: number
}

/** One purchase, installment or subscription charge that lands in a card invoice. */
export interface CardCharge {
  itemId: string
  title: string
  category: string
  /** Date of the charge, YYYY-MM-DD: the purchase day, or for installment k the same day k-1 months later. */
  date: string
  amount: number
  installment?: { number: number; total: number }
}

export interface InvoiceInfo {
  cardId: string
  cardName: string
  lines: CardCharge[]
}

export interface FinancialItemDraft {
  title: string
  type: TransactionType
  kind: FinancialItemKind
  amount: number
  category: string
  notes?: string
  cardId?: string
  installments?: number
  dayOfMonth?: number
  startMonth?: string
  endMonth?: string
  dueDate?: string
}

/** key: `${itemId}:${YYYY-MM}` */
export interface OccurrenceRecord {
  key: string
  status: OccurrenceStatus
  confirmedAt?: string
  /** What really was paid/received, when different from the planned amount. */
  amount?: number
  /** Day it really happened (YYYY-MM-DD). */
  paidDate?: string
}

export interface OpeningBalance {
  amount: number
  /** First month (YYYY-MM) the balance counts from. */
  month: string
}

export interface FinanceData {
  version: 5
  welcomeCompleted: boolean
  items: FinancialItem[]
  occurrenceRecords: OccurrenceRecord[]
  cards: CreditCard[]
  openingBalance?: OpeningBalance
}

export interface FinancialOccurrence {
  key: string
  itemId: string
  title: string
  type: TransactionType
  kind: FinancialItemKind
  /** Effective amount: the real one when confirmed with a different value, otherwise the planned one. */
  amount: number
  plannedAmount: number
  category: string
  /** Planned date. */
  dueDate: string
  /** Real date when confirmed on another day. */
  paidDate?: string
  status: OccurrenceStatus
  confirmedAt?: string
  /** Set when this occurrence is one installment of a purchase. */
  installment?: { number: number; total: number }
  /**
   * Set on a purchase paid with a card. It is listed on its own date but does not move cash:
   * the card invoice (an occurrence with `invoice`, no `cardId`) does, on its due date.
   */
  cardId?: string
  /** Set on a card invoice occurrence (key `card:${cardId}:${YYYY-MM}`: the month of its purchases). */
  invoice?: InvoiceInfo
}

export type AppPage = 'month' | 'planning' | 'data' | 'help'
