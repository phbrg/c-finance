import { describe, expect, it } from 'vitest'
import type { FinanceData, FinancialItemDraft } from '../types/finance'
import {
  addCard,
  addFinancialItem,
  changeOccurrenceStatus,
  deleteCard,
  deleteFinancialItem,
  setOpeningBalance,
  updateCard,
  updateFinancialItem,
} from '../utils/financeMutations'

const timestamp = '2026-06-01T12:00:00.000Z'
const data: FinanceData = {
  version: 5,
  welcomeCompleted: true,
  items: [],
  occurrenceRecords: [],
  cards: [],
}
const itemDraft: FinancialItemDraft = {
  title: 'Conta', type: 'expense', kind: 'one-time', amount: 10_000,
  category: 'Casa', dueDate: '2026-06-10',
}
const withItem: FinanceData = {
  ...data,
  items: [{
    id: 'item', title: 'Conta', type: 'expense', kind: 'one-time', amount: 10_000,
    category: 'Casa', dueDate: '2026-06-10', createdAt: timestamp, updatedAt: timestamp,
  }],
  occurrenceRecords: [{ key: 'item:2026-06', status: 'completed', confirmedAt: timestamp }],
}

const cardDraft = { name: ' Nubank ', dueDay: 12, limit: 500_000 }

describe('cards', () => {
  it('adds and updates a card', () => {
    const added = addCard(data, cardDraft, { id: 'nu', timestamp })
    expect(added.cards).toEqual([{ id: 'nu', name: 'Nubank', dueDay: 12, limit: 500_000, createdAt: timestamp, updatedAt: timestamp }])
    const later = '2026-07-01T00:00:00.000Z'
    const updated = updateCard(added, 'nu', { name: 'Roxinho', dueDay: 8 }, later)
    expect(updated?.cards[0]).toEqual({ id: 'nu', name: 'Roxinho', dueDay: 8, createdAt: timestamp, updatedAt: later })
    expect(updateCard(added, 'x', cardDraft, later)).toBeNull()
  })

  it('keeps cardId only on expenses', () => {
    const expense = addFinancialItem(data, { ...itemDraft, cardId: 'nu' }, { id: 'a', timestamp })
    expect(expense.items[0].cardId).toBe('nu')
    const income = addFinancialItem(data, { ...itemDraft, type: 'income', cardId: 'nu' }, { id: 'b', timestamp })
    expect(income.items[0]).not.toHaveProperty('cardId')
    const edited = updateFinancialItem(expense, 'a', { ...itemDraft, type: 'income', cardId: 'nu' }, timestamp)
    expect(edited?.items[0]).not.toHaveProperty('cardId')
  })

  it('deleting a card turns purchases into common expenses and drops its invoice records', () => {
    const base = addCard(data, cardDraft, { id: 'nu', timestamp })
    const withBuy = {
      ...addFinancialItem(base, { ...itemDraft, cardId: 'nu', installments: 3 }, { id: 'a', timestamp }),
      occurrenceRecords: [
        { key: 'card:nu:2026-07', status: 'completed' as const },
        { key: 'a:2026-06', status: 'completed' as const },
      ],
    }
    const result = deleteCard(withBuy, 'nu')
    expect(result.cards).toEqual([])
    expect(result.items[0]).not.toHaveProperty('cardId')
    expect(result.items[0].installments).toBe(3)
    expect(result.occurrenceRecords).toEqual([{ key: 'a:2026-06', status: 'completed' }])
  })
})

describe('finance mutations', () => {
  it('deletes an item with its confirmations', () => {
    const result = deleteFinancialItem({
      ...withItem, occurrenceRecords: [...withItem.occurrenceRecords, { key: 'other:2026-06', status: 'skipped' }],
    }, 'item')
    expect(result.items).toEqual([])
    expect(result.occurrenceRecords).toEqual([{ key: 'other:2026-06', status: 'skipped' }])
  })

  it('never clears occurrence records when editing an item', () => {
    const result = updateFinancialItem(withItem, 'item', { ...itemDraft, dueDate: '2026-06-11' }, timestamp)
    expect(result?.occurrenceRecords).toHaveLength(1)
    expect(result?.items[0].dueDate).toBe('2026-06-11')
    expect(updateFinancialItem(data, 'nope', itemDraft, timestamp)).toBeNull()
  })

  it('unifies the category spelling', () => {
    const added = addFinancialItem(withItem, { ...itemDraft, category: ' casa ' }, { id: 'b', timestamp })
    expect(added.items[1].category).toBe('Casa')
    const other = addFinancialItem(withItem, { ...itemDraft, category: 'mercado' }, { id: 'c', timestamp })
    expect(other.items[1].category).toBe('Mercado')
  })

  describe('amount changes', () => {
    const recurring: FinanceData = {
      ...withItem,
      items: [{
        id: 'item', title: 'Aluguel', type: 'expense', kind: 'recurring', amount: 100_000,
        category: 'Casa', recurrence: { dayOfMonth: 5, startMonth: '2026-01', active: true },
        createdAt: timestamp, updatedAt: timestamp,
      }],
    }
    const draft: FinancialItemDraft = {
      title: 'Aluguel', type: 'expense', kind: 'recurring', amount: 110_000, category: 'Casa',
      dayOfMonth: 5, startMonth: '2026-01',
    }

    it('records a change from a month on and keeps the base amount', () => {
      const first = updateFinancialItem(recurring, 'item', draft, timestamp, { amountFrom: '2026-08' })
      expect(first?.items[0]).toMatchObject({ amount: 100_000, amountChanges: [{ from: '2026-08', amount: 110_000 }] })
      const second = updateFinancialItem(first!, 'item', { ...draft, amount: 120_000 }, timestamp, { amountFrom: '2026-03' })
      expect(second?.items[0].amountChanges).toEqual([
        { from: '2026-03', amount: 120_000 },
        { from: '2026-08', amount: 110_000 },
      ])
      const replaced = updateFinancialItem(second!, 'item', { ...draft, amount: 130_000 }, timestamp, { amountFrom: '2026-08' })
      expect(replaced?.items[0].amountChanges?.[1]).toEqual({ from: '2026-08', amount: 130_000 })
    })

    it('replaces the base amount and clears changes without amountFrom', () => {
      const changed = updateFinancialItem(recurring, 'item', draft, timestamp, { amountFrom: '2026-08' })!
      const result = updateFinancialItem(changed, 'item', { ...draft, amount: 90_000 }, timestamp)
      expect(result?.items[0].amount).toBe(90_000)
      expect(result?.items[0].amountChanges).toBeUndefined()
    })
  })

  describe('installments', () => {
    const draft: FinancialItemDraft = { ...itemDraft, amount: 90_000, installments: 3 }
    const add = (override: Partial<FinancialItemDraft>) =>
      addFinancialItem(data, { ...draft, ...override }, { id: 'tv', timestamp }).items[0]

    it('keeps installments only on a one-time expense', () => {
      expect(add({})).toMatchObject({ installments: 3, amount: 90_000 })
      expect(add({ installments: 1 }).installments).toBeUndefined()
      expect(add({ type: 'income' }).installments).toBeUndefined()
      expect(add({ kind: 'recurring', dayOfMonth: 3, startMonth: '2026-06', dueDate: undefined }).installments).toBeUndefined()
    })

    it('drops the installments when an edit sets them to 1', () => {
      const created = addFinancialItem(data, draft, { id: 'tv', timestamp })
      expect(updateFinancialItem(created, 'tv', { ...draft, installments: 1 }, timestamp)?.items[0].installments).toBeUndefined()
    })
  })

  it('sets and clears the opening balance', () => {
    const set = setOpeningBalance(data, { amount: 100_000, month: '2026-06' })
    expect(set.openingBalance).toEqual({ amount: 100_000, month: '2026-06' })
    expect('openingBalance' in setOpeningBalance(set, null)).toBe(false)
  })

  it('stores the real amount and date only when completed, and removes the record when back to planned', () => {
    const done = changeOccurrenceStatus(data, 'item:2026-06', 'completed', timestamp, { amount: 9_000, paidDate: '2026-06-12' })
    expect(done.occurrenceRecords[0]).toEqual({
      key: 'item:2026-06', status: 'completed', confirmedAt: timestamp, amount: 9_000, paidDate: '2026-06-12',
    })
    const skipped = changeOccurrenceStatus(done, 'item:2026-06', 'skipped', timestamp, { amount: 1 })
    expect(skipped.occurrenceRecords).toEqual([{ key: 'item:2026-06', status: 'skipped' }])
    expect(changeOccurrenceStatus(done, 'item:2026-06', 'planned', timestamp).occurrenceRecords).toEqual([])
  })

  it('records the real confirmation time separately from the due date', () => {
    const result = changeOccurrenceStatus(data, 'item:2026-06', 'completed', '2026-06-15T18:30:00.000Z')
    expect(result.occurrenceRecords[0].confirmedAt).toBe('2026-06-15T18:30:00.000Z')
  })
})
