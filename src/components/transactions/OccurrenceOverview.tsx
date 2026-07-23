import { formatCurrency } from '../../utils/currency'
import type { OccurrenceSummary } from '../../utils/occurrences'
import { CurrencyAmount, type CurrencyTone } from '../shared/CurrencyAmount'

function percentage(value: number, total: number): number {
  return total > 0 ? Math.min((value / total) * 100, 100) : 0
}

function balanceTone(value: number): CurrencyTone {
  if (value > 0) return 'positive'
  if (value < 0) return 'negative'
  return 'neutral'
}

function balanceLabel(value: number): string {
  if (value > 0) return 'Positivo'
  if (value < 0) return 'Negativo'
  return 'Zerado'
}

export function OccurrenceOverview({ summary }: { summary: OccurrenceSummary }) {
  const incomePercentage = percentage(summary.receivedIncome, summary.expectedIncome)
  const expensePercentage = percentage(summary.paidExpenses, summary.expectedExpenses)
  const realizedBalanceTone = balanceTone(summary.realizedBalance)

  return (
    <section className="transactions-overview" aria-label="Resumo dos lançamentos do mês">
      <article className={`metric-card transaction-overview-card balance balance-${realizedBalanceTone}`}>
        <div className="metric-card-label"><span>Saldo confirmado</span><em>{balanceLabel(summary.realizedBalance)}</em></div>
        <CurrencyAmount value={summary.realizedBalance} tone={realizedBalanceTone} />
        <small>Somente valores marcados como confirmados</small>
      </article>
      <article className="metric-card transaction-overview-card income">
        <span>Ganhos recebidos</span>
        <CurrencyAmount value={summary.receivedIncome} tone="income" />
        <small>de {formatCurrency(summary.expectedIncome)} previstos</small>
        <Progress percentage={incomePercentage} tone="income" />
      </article>
      <article className="metric-card transaction-overview-card expense">
        <span>Gastos pagos</span>
        <CurrencyAmount value={summary.paidExpenses} tone="expense" />
        <small>de {formatCurrency(summary.expectedExpenses)} previstos</small>
        <Progress percentage={expensePercentage} tone="expense" />
      </article>
      <article className="metric-card transaction-overview-card pending">
        <span>Movimentações pendentes</span>
        <strong className="transaction-pending-count">{summary.pendingCount}</strong>
        <small>{formatCurrency(summary.pendingIncome)} a receber · {formatCurrency(summary.pendingExpenses)} a pagar</small>
      </article>
    </section>
  )
}

function Progress({ percentage: value, tone }: { percentage: number; tone: 'income' | 'expense' }) {
  const label = `${value.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}%`

  return (
    <div className={`transaction-progress ${tone}`} aria-label={`${label} confirmado`}>
      <div className="transaction-progress-copy"><span>Progresso confirmado</span><strong>{label}</strong></div>
      <div className="transaction-mini-progress"><span style={{ width: `${value}%` }} /></div>
    </div>
  )
}
