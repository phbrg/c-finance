import { describe, expect, it } from 'vitest'
import type { Investment } from '../types/finance'
import { effectiveMonthlyRate, portfolioProjectionSeries, projectInvestment, projectPortfolio } from '../utils/investmentProjections'

function investment(overrides: Partial<Investment> = {}): Investment {
  return {
    id: 'investment-1',
    name: 'Reserve',
    institution: 'Bank',
    currentBalance: 100_000,
    balanceDate: '2026-06-19',
    annualRateBps: 1_200,
    monthlyContribution: 0,
    contributionDay: 10,
    createdAt: '2026-06-19T12:00:00.000Z',
    updatedAt: '2026-06-19T12:00:00.000Z',
    ...overrides,
  }
}

describe('investment projections', () => {
  it('converts an effective annual rate into its monthly equivalent', () => {
    expect(Math.pow(1 + effectiveMonthlyRate(1_200), 12) - 1).toBeCloseTo(0.12)
  })

  it('compounds the current balance for one year', () => {
    expect(projectInvestment(investment(), 12)).toEqual({
      balance: 112_000,
      principal: 100_000,
      earnings: 12_000,
    })
  })

  it('supports starting from zero with monthly contributions', () => {
    expect(projectInvestment(investment({ currentBalance: 0, annualRateBps: 0, monthlyContribution: 25_000 }), 12)).toEqual({
      balance: 300_000,
      principal: 300_000,
      earnings: 0,
    })
  })

  it('aggregates multiple investments and builds a yearly series', () => {
    const investments = [investment(), investment({ id: 'investment-2', currentBalance: 50_000 })]
    expect(projectPortfolio(investments, 0).balance).toBe(150_000)
    const series = portfolioProjectionSeries(investments, 5)
    expect(series).toHaveLength(6)
    expect(series[0].year).toBe(0)
    expect(series[5].balance).toBeGreaterThan(series[0].balance)
  })
})
