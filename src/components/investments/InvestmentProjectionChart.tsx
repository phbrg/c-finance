import type { Investment } from '../../types/finance'
import { formatCurrency } from '../../utils/currency'
import { portfolioProjectionSeries } from '../../utils/investmentProjections'

interface InvestmentProjectionChartProps {
  investments: Investment[]
  years: number
}

export function InvestmentProjectionChart({ investments, years }: InvestmentProjectionChartProps) {
  const series = portfolioProjectionSeries(investments, years)
  const maximum = Math.max(...series.map((point) => point.balance), 1)
  const balancePoints = series.map((point, index) => `${(index / years) * 100},${88 - (point.balance / maximum) * 72}`).join(' ')
  const principalPoints = series.map((point, index) => `${(index / years) * 100},${88 - (point.principal / maximum) * 72}`).join(' ')
  const final = series.at(-1)!

  return (
    <section className="workspace-card investment-chart-card">
      <div className="card-heading">
        <div><span className="overline">Juros compostos</span><h2>Evolução estimada da carteira</h2></div>
        <strong>{formatCurrency(final.balance)}</strong>
      </div>
      {investments.length === 0 ? <div className="chart-empty">Adicione um investimento para visualizar a projeção.</div> : (
        <>
          <div className="investment-chart-legend"><span className="projected">Saldo projetado</span><span className="principal">Valor aportado</span></div>
          <div className="line-chart investment-line-chart">
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label={`Projeção da carteira para ${years} anos`}>
              <line x1="0" y1="88" x2="100" y2="88" className="chart-grid" />
              <line x1="0" y1="52" x2="100" y2="52" className="chart-grid" />
              <line x1="0" y1="16" x2="100" y2="16" className="chart-grid" />
              <polyline points={principalPoints} className="investment-principal-line" />
              <polyline points={balancePoints} className="chart-line" />
            </svg>
            <div className="chart-days">{series.map((point) => <span key={point.year}>{point.year === 0 ? 'Hoje' : `${point.year}a`}</span>)}</div>
          </div>
        </>
      )}
      <p className="projection-disclaimer">Estimativa baseada na taxa informada e em aportes mensais constantes. Rentabilidade passada ou estimada não garante resultados futuros.</p>
    </section>
  )
}
