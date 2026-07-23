import { formatCurrency } from '../../utils/currency'
import { dailyCashFlow } from '../../utils/projections'
import { daysInMonth } from '../../utils/recurrence'
import type { TransactionSimulation } from '../../utils/transactionSimulation'

export function SimulationCashFlowChart({ simulation }: { simulation: TransactionSimulation }) {
  const before = dailyCashFlow(simulation.beforeOccurrences)
  const after = dailyCashFlow(simulation.afterOccurrences)
  const monthDays = daysInMonth(simulation.month)
  const values = [0, ...before.map((point) => point.balance), ...after.map((point) => point.balance)]
  const rawMinimum = Math.min(...values)
  const rawMaximum = Math.max(...values)
  const padding = Math.max((rawMaximum - rawMinimum) * .12, 1)
  const minimum = rawMinimum < 0 ? rawMinimum - padding : 0
  const maximum = rawMaximum > 0 ? rawMaximum + padding : 0
  const span = Math.max(maximum - minimum, 1)
  const midpoint = minimum + span / 2
  const xForDay = (day: number) => ((day - 1) / Math.max(monthDays - 1, 1)) * 100
  const yForValue = (value: number) => 88 - ((value - minimum) / span) * 72
  const zeroY = yForValue(0)
  const beforePath = pathFor(before, zeroY, xForDay, yForValue)
  const afterPath = pathFor(after, zeroY, xForDay, yForValue)
  const simulationDay = simulation.simulatedOccurrence ? Number(simulation.simulatedOccurrence.dueDate.slice(8, 10)) : null
  const simulatedPoint = simulationDay ? after.find((point) => point.day === simulationDay) : null
  const axisDays = [...new Set([1, 8, 15, 22, monthDays])]

  return (
    <section className="workspace-card calculator-flow-card">
      <div className="card-heading calculator-chart-heading"><div><span className="overline">Fluxo do mês</span><h2>Onde o cenário muda seu saldo</h2><p>Compare o caminho atual com o resultado após incluir a transação simulada.</p></div><div className="calculator-chart-legend"><span className="before">Atual</span><span className="after">Com simulação</span></div></div>
      <div className="calculator-flow-visual">
        <div className="calculator-y-labels" aria-hidden="true"><span>{formatCurrency(maximum)}</span><span>{formatCurrency(midpoint)}</span><span>{formatCurrency(minimum)}</span></div>
        <div className="calculator-flow-plot">
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label="Comparação do saldo antes e depois da simulação">
            <line x1="0" y1="16" x2="100" y2="16" className="chart-grid" /><line x1="0" y1="52" x2="100" y2="52" className="chart-grid" /><line x1="0" y1="88" x2="100" y2="88" className="chart-grid" /><line x1="0" y1={zeroY} x2="100" y2={zeroY} className="cashflow-zero-line" />
            <path d={beforePath} className="calculator-flow-line before" /><path d={afterPath} className={`calculator-flow-line after ${simulation.balanceImpact >= 0 ? 'positive' : 'negative'}`} />
          </svg>
          {simulatedPoint && <span aria-hidden="true" className={`calculator-simulation-point ${simulation.balanceImpact >= 0 ? 'positive' : 'negative'}`} style={{ left: `${xForDay(simulatedPoint.day)}%`, top: `${yForValue(simulatedPoint.balance)}%` }} />}
          <div className="calculator-x-axis" aria-hidden="true">{axisDays.map((day) => <span key={day} style={{ left: `${xForDay(day)}%` }}>{day}</span>)}</div>
        </div>
      </div>
      <div className="calculator-flow-reading"><span>Momento do impacto</span><strong>{simulation.simulatedOccurrence ? `Dia ${simulation.simulatedOccurrence.dueDate.slice(8, 10)}` : 'Fora deste mês'}</strong><p>{simulation.simulatedOccurrence ? `${simulation.simulatedOccurrence.title} altera a projeção em ${formatCurrency(Math.abs(simulation.balanceImpact))}.` : 'Este cenário não altera o mês analisado.'}</p></div>
    </section>
  )
}

function pathFor(
  points: ReturnType<typeof dailyCashFlow>,
  zeroY: number,
  xForDay: (day: number) => number,
  yForValue: (value: number) => number,
): string {
  return points.reduce((path, point) => `${path} H ${xForDay(point.day)} V ${yForValue(point.balance)}`, `M 0 ${zeroY}`) + ' H 100'
}
