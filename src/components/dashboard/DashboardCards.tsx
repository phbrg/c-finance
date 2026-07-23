import type { DashboardSummary } from '../../types/finance'
import { formatCurrency } from '../../utils/currency'
import { CurrencyAmount } from '../shared/CurrencyAmount'

interface DashboardCardsProps {
  summary: DashboardSummary
  cutoffDate: string
}

type BalanceState = 'positive' | 'negative' | 'neutral'

function getBalanceState(value: number): BalanceState {
  if (value > 0) return 'positive'
  if (value < 0) return 'negative'
  return 'neutral'
}

function getBalanceLabel(state: BalanceState): string {
  if (state === 'positive') return 'Saldo positivo'
  if (state === 'negative') return 'Saldo negativo'
  return 'Saldo zerado'
}

export function DashboardCards({ summary, cutoffDate }: DashboardCardsProps) {
  const cutoffDay = Number(cutoffDate.slice(8, 10))
  const projectedState = getBalanceState(summary.projectedBalance)
  const realizedState = getBalanceState(summary.realizedBalance)

  return (
    <section className="dashboard-cards" aria-label="Resumo financeiro">
      <article className={`metric-card metric-card-featured balance-${projectedState}`}>
        <div className="metric-card-label"><span>Previsão de fechamento</span><em>{getBalanceLabel(projectedState)}</em></div>
        <CurrencyAmount value={summary.projectedBalance} tone={projectedState} />
        <small>{formatCurrency(summary.expectedIncome)} em ganhos <i>−</i> {formatCurrency(summary.expectedExpenses)} em gastos previstos</small>
      </article>

      <article className={`metric-card balance-${realizedState}`}>
        <div className="metric-card-label"><span>Saldo confirmado</span><em>{getBalanceLabel(realizedState)}</em></div>
        <CurrencyAmount value={summary.realizedBalance} tone={realizedState} />
        <small>Recebido menos pago até o dia {cutoffDay}</small>
      </article>

      <article className="metric-card cyan">
        <span>Ainda a receber</span>
        <CurrencyAmount value={summary.pendingIncome} tone="income" />
        <small>Ganhos do mês ainda não confirmados</small>
      </article>

      <article className="metric-card amber">
        <span>Ainda a pagar</span>
        <CurrencyAmount value={summary.pendingExpenses} tone="warning" />
        <small>Gastos do mês ainda pendentes</small>
      </article>
    </section>
  )
}
