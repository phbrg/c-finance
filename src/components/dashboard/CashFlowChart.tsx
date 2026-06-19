import type { FinancialOccurrence } from '../../types/finance'
import { formatCurrency } from '../../utils/currency'
import { dailyCashFlow } from '../../utils/projections'

export function CashFlowChart({ occurrences }: { occurrences: FinancialOccurrence[] }) {
  const data = dailyCashFlow(occurrences)
  const values = data.map((point) => point.balance)
  const minimum = Math.min(0, ...values)
  const maximum = Math.max(0, ...values)
  const span = Math.max(maximum - minimum, 1)
  const points = data.map((point, index) => {
    const x = data.length === 1 ? 50 : (index / (data.length - 1)) * 100
    const y = 88 - ((point.balance - minimum) / span) * 72
    return `${x},${y}`
  }).join(' ')

  return (
    <section className="workspace-card chart-card cashflow-card">
      <div className="card-heading"><div><span className="overline">Projeção diária</span><h2>Fluxo de caixa no mês</h2></div>{data.length > 0 && <strong className={data.at(-1)!.balance >= 0 ? 'amount-income' : 'amount-expense'}>{formatCurrency(data.at(-1)!.balance)}</strong>}</div>
      {data.length === 0 ? <div className="chart-empty">Adicione itens para visualizar o fluxo.</div> : (
        <div className="line-chart">
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label="Evolução do saldo projetado durante o mês">
            <line x1="0" y1="88" x2="100" y2="88" className="chart-grid" />
            <line x1="0" y1="52" x2="100" y2="52" className="chart-grid" />
            <line x1="0" y1="16" x2="100" y2="16" className="chart-grid" />
            <polyline points={points} className="chart-line" />
          </svg>
          <div className="chart-days">{data.map((point) => <span key={`${point.day}-${point.balance}`}>dia {point.day}</span>)}</div>
        </div>
      )}
    </section>
  )
}
