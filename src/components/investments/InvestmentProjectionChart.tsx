import type { Investment } from '../../types/finance'
import { formatCurrency } from '../../utils/currency'
import { portfolioProjectionSeries } from '../../utils/investmentProjections'

interface InvestmentProjectionChartProps {
  investments: Investment[]
  years: number
  onYearsChange: (years: number) => void
}

export function InvestmentProjectionChart({ investments, years, onYearsChange }: InvestmentProjectionChartProps) {
  const series = portfolioProjectionSeries(investments, years)
  const maximum = Math.max(...series.map((point) => point.balance), 1)
  const xForIndex = (index: number) => (index / Math.max(series.length - 1, 1)) * 100
  const yForValue = (value: number) => 88 - (value / maximum) * 72
  const balancePoints = series.map((point, index) => `${xForIndex(index)},${yForValue(point.balance)}`).join(' ')
  const principalPoints = series.map((point, index) => `${xForIndex(index)},${yForValue(point.principal)}`).join(' ')
  const areaPoints = `0,88 ${balancePoints} 100,88`
  const final = series.at(-1)!
  const earnings = final.balance - final.principal
  const labelInterval = years <= 5 ? 1 : years <= 10 ? 2 : 5
  const axisPoints = series.filter((point) => point.year === 0 || point.year === years || point.year % labelInterval === 0)

  return (
    <section className="workspace-card investment-chart-card">
      <div className="card-heading investment-projection-heading">
        <div><span className="overline">Juros compostos</span><h2>Evolução estimada da carteira</h2><p>Compare o que foi aportado com o crescimento estimado ao longo do tempo.</p></div>
        <label className="field investment-horizon-field"><span>Horizonte</span><select value={years} onChange={(event) => onYearsChange(Number(event.target.value))}><option value="1">1 ano</option><option value="3">3 anos</option><option value="5">5 anos</option><option value="10">10 anos</option><option value="20">20 anos</option></select></label>
      </div>

      {investments.length === 0 ? <div className="chart-empty investment-chart-empty">Adicione um investimento para visualizar a projeção.</div> : (
        <>
          <div className="investment-chart-legend"><span className="projected">Saldo projetado</span><span className="principal">Valor aportado</span></div>
          <div className="investment-chart-visual">
            <div className="investment-y-labels" aria-hidden="true"><span>{formatCurrency(maximum)}</span><span>{formatCurrency(maximum / 2)}</span><span>{formatCurrency(0)}</span></div>
            <div className="investment-chart-plot">
              <svg viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label={`Projeção da carteira para ${years} anos`}>
                <line x1="0" y1="16" x2="100" y2="16" className="chart-grid" />
                <line x1="0" y1="52" x2="100" y2="52" className="chart-grid" />
                <line x1="0" y1="88" x2="100" y2="88" className="chart-grid" />
                <polygon points={areaPoints} className="investment-balance-area" />
                <polyline points={principalPoints} className="investment-principal-line" />
                <polyline points={balancePoints} className="chart-line" />
              </svg>
              {series.map((point, index) => <span aria-hidden="true" className="investment-chart-point" key={point.year} style={{ left: `${xForIndex(index)}%`, top: `${yForValue(point.balance)}%` }} title={`${point.year === 0 ? 'Hoje' : `${point.year} anos`}: ${formatCurrency(point.balance)}`} />)}
              <div className="investment-x-axis" aria-hidden="true">{axisPoints.map((point) => <span key={point.year} style={{ left: `${(point.year / years) * 100}%` }}>{point.year === 0 ? 'Hoje' : `${point.year}a`}</span>)}</div>
            </div>
          </div>
          <div className="investment-projection-milestones">
            <article><span>Saldo estimado</span><strong>{formatCurrency(final.balance)}</strong><small>ao fim de {years} {years === 1 ? 'ano' : 'anos'}</small></article>
            <article><span>Total aportado</span><strong>{formatCurrency(final.principal)}</strong><small>saldo atual mais aportes mensais</small></article>
            <article className="earnings"><span>Rendimento estimado</span><strong>{formatCurrency(earnings)}</strong><small>diferença gerada pela rentabilidade</small></article>
          </div>
        </>
      )}
      <p className="projection-disclaimer"><strong>Importante:</strong> esta é uma simulação baseada nas taxas informadas e em aportes constantes. Ela não considera impostos, inflação, variações de taxa ou garantias de rentabilidade.</p>
    </section>
  )
}
