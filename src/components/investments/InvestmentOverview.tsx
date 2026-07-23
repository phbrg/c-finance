import type { Investment } from '../../types/finance'
import { formatDate } from '../../utils/date'
import { estimatePortfolioBalance, projectPortfolio } from '../../utils/investmentProjections'
import { summarizePortfolio } from '../../utils/portfolio'
import { CurrencyAmount } from '../shared/CurrencyAmount'

interface InvestmentOverviewProps {
  investments: Investment[]
  years: number
  referenceDate: string
}

export function InvestmentOverview({ investments, years, referenceDate }: InvestmentOverviewProps) {
  const summary = summarizePortfolio(investments)
  const current = estimatePortfolioBalance(investments, referenceDate)
  const projection = projectPortfolio(investments, years * 12, referenceDate)
  const hasAccruedEarnings = current.accruedEarnings > 0

  return (
    <section className="investment-summary" aria-label="Resumo dos investimentos">
      <article className="metric-card balance">
        <div className="metric-card-label"><span>Saldo estimado hoje</span><em>{investments.length} {investments.length === 1 ? 'ativo' : 'ativos'}</em></div>
        <CurrencyAmount value={current.estimatedBalance} tone="positive" />
        <small>{current.oldestBalanceDate ? `Saldos informados desde ${formatDate(current.oldestBalanceDate)}` : 'Adicione uma aplicação para começar'}</small>
      </article>
      <article className="metric-card earnings">
        <span>Rendimento desde os saldos</span>
        <CurrencyAmount value={current.accruedEarnings} tone="warning" />
        <small>{hasAccruedEarnings ? `aproximadamente ${formatDailyEarnings(current.estimatedDailyEarnings)} por dia` : 'Atualizado diariamente pela taxa informada'}</small>
      </article>
      <article className="metric-card contribution">
        <span>Aportes mensais</span>
        <CurrencyAmount value={summary.monthlyContribution} tone="income" />
        <small>{summary.linkedCount} {summary.linkedCount === 1 ? 'aporte vinculado' : 'aportes vinculados'} ao planejamento</small>
      </article>
      <article className="metric-card projected">
        <span>Projeção em {years} {years === 1 ? 'ano' : 'anos'}</span>
        <CurrencyAmount value={projection.balance} tone="neutral" />
        <small>{formatProjectionDetail(projection.earnings, summary.weightedAnnualRateBps)}</small>
      </article>
    </section>
  )
}

function formatDailyEarnings(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value / 100)
}

function formatProjectionDetail(earnings: number, annualRateBps: number): string {
  const rate = (annualRateBps / 100).toLocaleString('pt-BR', { maximumFractionDigits: 2 })
  const earningsLabel = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(earnings / 100)
  return `${earningsLabel} em rendimento · taxa média de ${rate}% a.a.`
}
