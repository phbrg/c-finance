import type { Investment } from '../../types/finance'
import { formatCurrency } from '../../utils/currency'
import { estimateInvestmentBalance, estimatePortfolioBalance } from '../../utils/investmentProjections'
import { summarizePortfolio } from '../../utils/portfolio'

export function PortfolioAllocation({ investments, referenceDate }: { investments: Investment[]; referenceDate: string }) {
  const current = estimatePortfolioBalance(investments, referenceDate)
  const allocation = investments
    .map((investment) => ({ investment, balance: estimateInvestmentBalance(investment, referenceDate).estimatedBalance }))
    .sort((first, second) => second.balance - first.balance)
    .map((item) => ({ ...item, percentage: current.estimatedBalance > 0 ? (item.balance / current.estimatedBalance) * 100 : 0 }))
    .slice(0, 5)
  const summary = summarizePortfolio(investments)
  const largestPercentage = allocation[0]?.percentage ?? 0

  return (
    <section className={`workspace-card portfolio-allocation-card ${investments.length === 0 ? 'empty' : ''}`}>
      <div className="card-heading"><div><span className="overline">Distribuição</span><h2>Composição estimada hoje</h2><p>Quanto cada investimento representa no saldo atualizado da carteira.</p></div></div>
      {allocation.length === 0 ? <div className="investment-panel-empty">A distribuição aparecerá quando você adicionar investimentos.</div> : (
        <>
          <div className="portfolio-allocation-list">
            {allocation.map(({ investment, balance, percentage }) => (
              <div key={investment.id}>
                <div><span>{investment.name}</span><strong>{percentage.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%</strong></div>
                <div className="portfolio-allocation-meta"><small>{investment.institution}</small><span>{formatCurrency(balance)}</span></div>
                <div className="portfolio-allocation-track"><span style={{ width: `${percentage}%` }} /></div>
              </div>
            ))}
          </div>
          <div className="portfolio-insights">
            <article className={largestPercentage > 60 ? 'warning' : ''}><span>Maior concentração</span><strong>{largestPercentage.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%</strong><small>{largestPercentage > 60 ? 'Uma aplicação concentra boa parte da carteira.' : 'A carteira está distribuída entre as aplicações.'}</small></article>
            <article><span>Instituições</span><strong>{summary.institutionCount}</strong><small>{summary.institutionCount === 1 ? 'instituição cadastrada' : 'instituições cadastradas'}</small></article>
            <article><span>Ritmo diário estimado</span><strong>{formatCurrency(current.estimatedDailyEarnings)}</strong><small>por dia, antes de impostos e variações</small></article>
          </div>
        </>
      )}
    </section>
  )
}
