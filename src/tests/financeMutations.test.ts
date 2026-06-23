import { describe, expect, it } from 'vitest'
import type { FinanceData, FinancialItemDraft, InvestmentDraft } from '../types/finance'
import {
  addPortfolioInvestment,
  changeOccurrenceStatus,
  deleteFinancialItem,
  updateFinancialItem,
  updatePortfolioInvestment,
} from '../utils/financeMutations'

const timestamp = '2026-06-01T12:00:00.000Z'
const data: FinanceData = {
  version: 3,
  welcomeCompleted: true,
  items: [],
  occurrenceRecords: [],
  investments: [],
}
const investmentDraft: InvestmentDraft = {
  name: 'Reserva', institution: 'Banco', currentBalance: 100_000,
  balanceDate: '2026-06-01', annualRateBps: 1_000, monthlyContribution: 20_000,
  contributionDay: 10, createPlannedExpense: true,
}

describe('finance mutations', () => {
  it('creates and updates a linked planned contribution', () => {
    const created = addPortfolioInvestment(data, investmentDraft, { id: 'investment', timestamp }, 'item')
    expect(created.investments[0].linkedFinancialItemId).toBe('item')
    expect(created.items[0]).toMatchObject({ investmentId: 'investment', amount: 20_000 })

    const updated = updatePortfolioInvestment(
      created,
      'investment',
      { ...investmentDraft, monthlyContribution: 30_000 },
      'unused',
      '2026-06-02T12:00:00.000Z',
    )
    expect(updated?.items).toHaveLength(1)
    expect(updated?.items[0].amount).toBe(30_000)
  })

  it('clears confirmations when the linked contribution schedule changes', () => {
    const created = addPortfolioInvestment(data, investmentDraft, { id: 'investment', timestamp }, 'item')
    const withRecord: FinanceData = {
      ...created,
      occurrenceRecords: [{ key: 'item:2026-06-10', status: 'completed', confirmedAt: timestamp }],
    }
    const updated = updatePortfolioInvestment(
      withRecord,
      'investment',
      { ...investmentDraft, contributionDay: 15 },
      'unused',
      '2026-06-02T12:00:00.000Z',
    )
    expect(updated?.occurrenceRecords).toEqual([])
  })

  it('keeps the planned expense and unlinks it when an investment is removed', () => {
    const created = addPortfolioInvestment(data, investmentDraft, { id: 'investment', timestamp }, 'item')
    const result = deleteFinancialItem(created, 'item', timestamp)
    expect(result.items).toEqual([])
    expect(result.investments[0].linkedFinancialItemId).toBeUndefined()
  })

  it('clears occurrence records when an item schedule changes', () => {
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
      occurrenceRecords: [{ key: 'item:2026-06-10', status: 'completed', confirmedAt: timestamp }],
    }
    const result = updateFinancialItem(withItem, 'item', { ...itemDraft, dueDate: '2026-06-11' }, timestamp)
    expect(result?.scheduleChanged).toBe(true)
    expect(result?.data.occurrenceRecords).toEqual([])
  })

  it('records the real confirmation time separately from the due date', () => {
    const result = changeOccurrenceStatus(data, 'item:2026-06-10', 'completed', '2026-06-15T18:30:00.000Z')
    expect(result.occurrenceRecords[0].confirmedAt).toBe('2026-06-15T18:30:00.000Z')
  })
})
