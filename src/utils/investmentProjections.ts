import type { Investment, InvestmentProjection } from '../types/finance'

const DAYS_PER_YEAR = 365

export interface InvestmentBalanceEstimate {
  reportedBalance: number
  estimatedBalance: number
  accruedEarnings: number
  estimatedDailyEarnings: number
  elapsedDays: number
}

export interface PortfolioBalanceEstimate extends InvestmentBalanceEstimate {
  oldestBalanceDate?: string
}

export function effectiveMonthlyRate(annualRateBps: number): number {
  const annualRate = annualRateBps / 10_000
  return Math.pow(1 + annualRate, 1 / 12) - 1
}

export function effectiveDailyRate(annualRateBps: number): number {
  const annualRate = annualRateBps / 10_000
  return Math.pow(1 + annualRate, 1 / DAYS_PER_YEAR) - 1
}

export function estimateInvestmentBalance(
  investment: Pick<Investment, 'currentBalance' | 'balanceDate' | 'annualRateBps'>,
  referenceDate: string,
): InvestmentBalanceEstimate {
  const elapsedDays = daysBetween(investment.balanceDate, referenceDate)
  const dailyRate = effectiveDailyRate(investment.annualRateBps)
  const estimatedBalance = Math.round(investment.currentBalance * Math.pow(1 + dailyRate, elapsedDays))

  return {
    reportedBalance: investment.currentBalance,
    estimatedBalance,
    accruedEarnings: estimatedBalance - investment.currentBalance,
    estimatedDailyEarnings: Math.round(estimatedBalance * dailyRate),
    elapsedDays,
  }
}

export function estimatePortfolioBalance(investments: Investment[], referenceDate: string): PortfolioBalanceEstimate {
  const estimate = investments.reduce<InvestmentBalanceEstimate>(
    (total, investment) => {
      const current = estimateInvestmentBalance(investment, referenceDate)
      return {
        reportedBalance: total.reportedBalance + current.reportedBalance,
        estimatedBalance: total.estimatedBalance + current.estimatedBalance,
        accruedEarnings: total.accruedEarnings + current.accruedEarnings,
        estimatedDailyEarnings: total.estimatedDailyEarnings + current.estimatedDailyEarnings,
        elapsedDays: Math.max(total.elapsedDays, current.elapsedDays),
      }
    },
    { reportedBalance: 0, estimatedBalance: 0, accruedEarnings: 0, estimatedDailyEarnings: 0, elapsedDays: 0 },
  )

  return {
    ...estimate,
    oldestBalanceDate: [...investments].sort((first, second) => first.balanceDate.localeCompare(second.balanceDate))[0]?.balanceDate,
  }
}

export function projectInvestment(
  investment: Pick<Investment, 'currentBalance' | 'annualRateBps' | 'monthlyContribution'>,
  months: number,
  startingBalance = investment.currentBalance,
): InvestmentProjection {
  const monthlyRate = effectiveMonthlyRate(investment.annualRateBps)
  let balance = startingBalance
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

export function projectPortfolio(investments: Investment[], months: number, referenceDate?: string): InvestmentProjection {
  return investments.reduce<InvestmentProjection>(
    (total, investment) => {
      const startingBalance = referenceDate
        ? estimateInvestmentBalance(investment, referenceDate).estimatedBalance
        : investment.currentBalance
      const projection = projectInvestment(investment, months, startingBalance)
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
  referenceDate?: string,
): Array<{ year: number; balance: number; principal: number }> {
  return Array.from({ length: years + 1 }, (_, year) => {
    const projection = projectPortfolio(investments, year * 12, referenceDate)
    return { year, balance: projection.balance, principal: projection.principal }
  })
}

export function portfolioMonthlyProjectionSeries(
  investments: Investment[],
  years: number,
  referenceDate: string,
): Array<{ month: number; balance: number; principal: number }> {
  return Array.from({ length: years * 12 + 1 }, (_, month) => {
    const projection = projectPortfolio(investments, month, referenceDate)
    return { month, balance: projection.balance, principal: projection.principal }
  })
}

function daysBetween(startDate: string, endDate: string): number {
  const [startYear, startMonth, startDay] = startDate.split('-').map(Number)
  const [endYear, endMonth, endDay] = endDate.split('-').map(Number)
  const start = Date.UTC(startYear, startMonth - 1, startDay)
  const end = Date.UTC(endYear, endMonth - 1, endDay)
  return Math.max(Math.floor((end - start) / 86_400_000), 0)
}
