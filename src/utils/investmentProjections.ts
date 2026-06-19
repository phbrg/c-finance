import type { Investment, InvestmentProjection } from '../types/finance'

export function effectiveMonthlyRate(annualRateBps: number): number {
  const annualRate = annualRateBps / 10_000
  return Math.pow(1 + annualRate, 1 / 12) - 1
}

export function projectInvestment(
  investment: Pick<Investment, 'currentBalance' | 'annualRateBps' | 'monthlyContribution'>,
  months: number,
): InvestmentProjection {
  const monthlyRate = effectiveMonthlyRate(investment.annualRateBps)
  let balance = investment.currentBalance
  for (let month = 0; month < months; month += 1) {
    balance = balance * (1 + monthlyRate) + investment.monthlyContribution
  }
  const principal = investment.currentBalance + investment.monthlyContribution * months
  const roundedBalance = Math.round(balance)
  return {
    balance: roundedBalance,
    principal,
    earnings: roundedBalance - principal,
  }
}

export function projectPortfolio(investments: Investment[], months: number): InvestmentProjection {
  return investments.reduce<InvestmentProjection>(
    (total, investment) => {
      const projection = projectInvestment(investment, months)
      return {
        balance: total.balance + projection.balance,
        principal: total.principal + projection.principal,
        earnings: total.earnings + projection.earnings,
      }
    },
    { balance: 0, principal: 0, earnings: 0 },
  )
}

export function portfolioProjectionSeries(
  investments: Investment[],
  years: number,
): Array<{ year: number; balance: number; principal: number }> {
  return Array.from({ length: years + 1 }, (_, year) => {
    const projection = projectPortfolio(investments, year * 12)
    return { year, balance: projection.balance, principal: projection.principal }
  })
}
