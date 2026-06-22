import type { DashboardSummary } from '../../types/finance'
import { formatCurrency } from '../../utils/currency'

interface DashboardCardsProps {
  summary: DashboardSummary
  cutoffDate: string
}

export function DashboardCards({ summary, cutoffDate }: DashboardCardsProps) {
  const cutoffDay = Number(cutoffDate.slice(8, 10))
  const isPositive = summary.projectedBalance >= 0

  return (
    <section className="dashboard-cards" aria-label="Resumo financeiro">
      <article className={`metric-card metric-card-featured ${isPositive ? 'blue' : 'red'}`}>
        <div className="metric-card-label"><span>Previsão de fechamento</span><em>{isPositive ? 'Saldo positivo' : 'Atenção ao saldo'}</em></div>
        <strong>{formatCurrency(summary.projectedBalance)}</strong>
        <small>{formatCurrency(summary.expectedIncome)} em ganhos <i>−</i> {formatCurrency(summary.expectedExpenses)} em gastos previstos</small>
      </article>

      <article className={`metric-card ${summary.realizedBalance >= 0 ? 'cyan' : 'red'}`}>
        <span>Saldo confirmado</span>
        <strong>{formatCurrency(summary.realizedBalance)}</strong>
        <small>Recebido menos pago até o dia {cutoffDay}</small>
      </article>

      <article className="metric-card cyan">
        <span>Ainda a receber</span>
        <strong>{formatCurrency(summary.pendingIncome)}</strong>
        <small>Ganhos do mês ainda não confirmados</small>
      </article>

      <article className="metric-card amber">
        <span>Ainda a pagar</span>
        <strong>{formatCurrency(summary.pendingExpenses)}</strong>
        <small>Gastos do mês ainda pendentes</small>
      </article>
    </section>
  )
}
