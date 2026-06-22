import { describe, expect, it } from 'vitest'
import type { Investment } from '../types/finance'
import { filterInvestments, portfolioAllocation, summarizePortfolio } from '../utils/portfolio'

function investment(overrides: Partial<Investment> = {}): Investment {
  return {
    id: 'reserve',
    name: 'Reserva',
    institution: 'Banco A',
    currentBalance: 100_000,
    balanceDate: '2026-06-22',
    annualRateBps: 1_000,
    monthlyContribution: 20_000,
    contributionDay: 10,
    createdAt: '2026-06-22T12:00:00.000Z',
    updatedAt: '2026-06-22T12:00:00.000Z',
    ...overrides,
  }
}

describe('portfolio utilities', () => {
  it('summarizes balances, contributions, links and weighted rate', () => {
    expect(summarizePortfolio([
      investment({ linkedFinancialItemId: 'item' }),
      investment({ id: 'two', institution: 'Banco B', currentBalance: 300_000, annualRateBps: 1_200, monthlyContribution: 30_000 }),
    ])).toEqual({
      totalBalance: 400_000,
      monthlyContribution: 50_000,
      weightedAnnualRateBps: 1_150,
      linkedCount: 1,
      institutionCount: 2,
    })
  })

  it('calculates allocation percentages ordered by balance', () => {
    const allocation = portfolioAllocation([
      investment(),
      investment({ id: 'two', currentBalance: 300_000 }),
    ])
    expect(allocation.map(({ investment: item, percentage }) => [item.id, percentage])).toEqual([
      ['two', 75],
      ['reserve', 25],
    ])
  })

  it('filters normalized text and sorts by contribution', () => {
    const result = filterInvestments([
      investment(),
      investment({ id: 'two', name: 'Caixinha Férias', institution: 'Banco B', monthlyContribution: 50_000 }),
    ], 'ferias', 'all', 'contribution')
    expect(result.map(({ id }) => id)).toEqual(['two'])
  })
})
