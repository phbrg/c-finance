import type { Investment } from '../types/finance'

export type InvestmentSort = 'balance' | 'contribution' | 'rate' | 'name'

export interface PortfolioSummary {
  totalBalance: number
  monthlyContribution: number
  weightedAnnualRateBps: number
  linkedCount: number
  institutionCount: number
}

export interface PortfolioAllocation {
  investment: Investment
  percentage: number
}

export function summarizePortfolio(investments: Investment[]): PortfolioSummary {
  const totalBalance = investments.reduce((sum, item) => sum + item.currentBalance, 0)
  const weightedRate = investments.reduce((sum, item) => sum + item.currentBalance * item.annualRateBps, 0)
  return {
    totalBalance,
    monthlyContribution: investments.reduce((sum, item) => sum + item.monthlyContribution, 0),
    weightedAnnualRateBps: totalBalance > 0 ? Math.round(weightedRate / totalBalance) : 0,
    linkedCount: investments.filter((item) => item.linkedFinancialItemId).length,
    institutionCount: new Set(investments.map((item) => normalize(item.institution))).size,
  }
}

export function portfolioAllocation(investments: Investment[]): PortfolioAllocation[] {
  const total = investments.reduce((sum, item) => sum + item.currentBalance, 0)
  return [...investments]
    .sort((first, second) => second.currentBalance - first.currentBalance)
    .map((investment) => ({
      investment,
      percentage: total > 0 ? (investment.currentBalance / total) * 100 : 0,
    }))
}

export function filterInvestments(
  investments: Investment[],
  query: string,
  institution: string,
  sort: InvestmentSort,
): Investment[] {
  const normalizedQuery = normalize(query)
  return investments
    .filter((investment) => (
      (institution === 'all' || investment.institution === institution) &&
      (!normalizedQuery || normalize(`${investment.name} ${investment.institution}`).includes(normalizedQuery))
    ))
    .sort((first, second) => compareInvestments(first, second, sort))
}

function compareInvestments(first: Investment, second: Investment, sort: InvestmentSort): number {
  if (sort === 'contribution') return second.monthlyContribution - first.monthlyContribution || second.currentBalance - first.currentBalance
  if (sort === 'rate') return second.annualRateBps - first.annualRateBps || second.currentBalance - first.currentBalance
  if (sort === 'name') return first.name.localeCompare(second.name, 'pt-BR')
  return second.currentBalance - first.currentBalance
}

function normalize(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLocaleLowerCase('pt-BR')
}
