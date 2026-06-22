import type { Investment } from '../../types/finance'
import { formatCurrency } from '../../utils/currency'
import { portfolioAllocation, summarizePortfolio } from '../../utils/portfolio'

export function PortfolioAllocation({ investments }: { investments: Investment[] }) {
  const allocation = portfolioAllocation(investments).slice(0, 5)
  const summary = summarizePortfolio(investments)
  const largestPercentage = allocation[0]?.percentage ?? 0

  return (
    <section className="workspace-card portfolio-allocation-card">
      <div className="card-heading"><div><span className="overline">Distribuição</span><h2>Composição da carteira</h2><p>Quanto cada investimento representa no patrimônio atual.</p></div></div>
      {allocation.length === 0 ? <div className="investment-panel-empty">A distribuição aparecerá quando você adicionar investimentos.</div> : (
        <>
          <div className="portfolio-allocation-list">
            {allocation.map(({ investment, percentage }) => (
              <div key={investment.id}>
                <div><span>{investment.name}</span><strong>{percentage.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%</strong></div>
                <div className="portfolio-allocation-meta"><small>{investment.institution}</small><span>{formatCurrency(investment.currentBalance)}</span></div>
                <div className="portfolio-allocation-track"><span style={{ width: `${percentage}%` }} /></div>
              </div>
            ))}
          </div>
          <div className="portfolio-insights">
            <article className={largestPercentage > 60 ? 'warning' : ''}><span>Maior concentração</span><strong>{largestPercentage.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%</strong><small>{largestPercentage > 60 ? 'Uma aplicação concentra boa parte da carteira.' : 'A carteira está distribuída entre as aplicações.'}</small></article>
            <article><span>Instituições</span><strong>{summary.institutionCount}</strong><small>{summary.institutionCount === 1 ? 'instituição cadastrada' : 'instituições cadastradas'}</small></article>
            <article><span>Taxa média estimada</span><strong>{(summary.weightedAnnualRateBps / 100).toLocaleString('pt-BR', { maximumFractionDigits: 2 })}%</strong><small>ao ano, ponderada pelo saldo</small></article>
          </div>
        </>
      )}
    </section>
  )
}
