import { formatCurrency } from '../../utils/currency'
import type { SimulationHorizonPoint } from '../../utils/transactionSimulation'

export function SimulationHorizonChart({ points }: { points: SimulationHorizonPoint[] }) {
  const values = points.flatMap((point) => [point.beforeBalance, point.afterBalance, 0])
  const minimum = Math.min(...values)
  const maximum = Math.max(...values)
  const padding = Math.max((maximum - minimum) * .12, 1)
  const chartMinimum = minimum < 0 ? minimum - padding : 0
  const chartMaximum = maximum > 0 ? maximum + padding : 0
  const span = Math.max(chartMaximum - chartMinimum, 1)
  const xForIndex = (index: number) => (index / Math.max(points.length - 1, 1)) * 100
  const yForValue = (value: number) => 88 - ((value - chartMinimum) / span) * 72
  const beforePath = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${xForIndex(index)} ${yForValue(point.beforeBalance)}`).join(' ')
  const afterPath = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${xForIndex(index)} ${yForValue(point.afterBalance)}`).join(' ')
  const cumulativeImpact = points.reduce((total, point) => total + point.impact, 0)

  return (
    <section className="workspace-card calculator-horizon-card">
      <div className="card-heading calculator-chart-heading"><div><span className="overline">Próximos meses</span><h2>Impacto ao longo de seis meses</h2><p>Itens recorrentes continuam aparecendo; itens únicos afetam apenas o mês escolhido.</p></div><div className="calculator-horizon-total"><span>Impacto acumulado</span><strong className={cumulativeImpact >= 0 ? 'amount-income' : 'amount-expense'}>{formatCurrency(cumulativeImpact)}</strong></div></div>
      <div className="calculator-horizon-plot">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label="Comparação da projeção para os próximos seis meses">
          <line x1="0" y1="16" x2="100" y2="16" className="chart-grid" /><line x1="0" y1="52" x2="100" y2="52" className="chart-grid" /><line x1="0" y1="88" x2="100" y2="88" className="chart-grid" />
          <path d={beforePath} className="calculator-horizon-line before" /><path d={afterPath} className={`calculator-horizon-line after ${cumulativeImpact >= 0 ? 'positive' : 'negative'}`} />
        </svg>
        {points.map((point, index) => <span key={point.month} aria-hidden="true" className={`calculator-horizon-point ${cumulativeImpact >= 0 ? 'positive' : 'negative'}`} style={{ left: `${xForIndex(index)}%`, top: `${yForValue(point.afterBalance)}%` }} />)}
        <div className="calculator-horizon-axis" aria-hidden="true">{points.map((point, index) => <span key={point.month} style={{ left: `${xForIndex(index)}%` }}>{new Date(`${point.month}-02T12:00:00`).toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}</span>)}</div>
      </div>
      <div className="calculator-horizon-legend"><span className="before">Projeção atual</span><span className="after">Com simulação</span></div>
    </section>
  )
}
