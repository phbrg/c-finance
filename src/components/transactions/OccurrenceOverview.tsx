import { formatCurrency } from '../../utils/currency'
import type { OccurrenceSummary } from '../../utils/occurrences'

function percentage(value: number, total: number): number {
  return total > 0 ? Math.min((value / total) * 100, 100) : 0
}

export function OccurrenceOverview({ summary }: { summary: OccurrenceSummary }) {
  const incomePercentage = percentage(summary.receivedIncome, summary.expectedIncome)
  const expensePercentage = percentage(summary.paidExpenses, summary.expectedExpenses)

  return (
    <section className="transactions-overview" aria-label="Resumo dos lançamentos do mês">
      <article className={`transaction-overview-card balance ${summary.realizedBalance < 0 ? 'negative' : ''}`}>
        <span>Saldo confirmado</span>
        <strong>{formatCurrency(summary.realizedBalance)}</strong>
        <small>Somente valores marcados como confirmados</small>
      </article>
      <article className="transaction-overview-card income">
        <div><span>Ganhos recebidos</span><em>{incomePercentage.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}%</em></div>
        <strong>{formatCurrency(summary.receivedIncome)}</strong>
        <small>de {formatCurrency(summary.expectedIncome)} previstos</small>
        <div className="transaction-mini-progress"><span style={{ width: `${incomePercentage}%` }} /></div>
      </article>
      <article className="transaction-overview-card expense">
        <div><span>Gastos pagos</span><em>{expensePercentage.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}%</em></div>
        <strong>{formatCurrency(summary.paidExpenses)}</strong>
        <small>de {formatCurrency(summary.expectedExpenses)} previstos</small>
        <div className="transaction-mini-progress"><span style={{ width: `${expensePercentage}%` }} /></div>
      </article>
      <article className="transaction-overview-card pending">
        <span>Movimentações pendentes</span>
        <strong>{summary.pendingCount}</strong>
        <small>{formatCurrency(summary.pendingIncome)} a receber · {formatCurrency(summary.pendingExpenses)} a pagar</small>
      </article>
    </section>
  )
}
