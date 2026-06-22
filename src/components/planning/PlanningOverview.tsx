import type { FinancialItem } from '../../types/finance'
import { formatCurrency } from '../../utils/currency'
import { today } from '../../utils/date'
import { summarizePlanning } from '../../utils/planning'

export function PlanningOverview({ items }: { items: FinancialItem[] }) {
  const summary = summarizePlanning(items, today())

  return (
    <section className="planning-overview" aria-label="Resumo da base planejada">
      <article className="planning-overview-card income">
        <span>Ganhos fixos mensais</span>
        <strong>{formatCurrency(summary.recurringIncome)}</strong>
        <small>ativos no mês atual</small>
      </article>
      <article className="planning-overview-card expense">
        <span>Gastos fixos mensais</span>
        <strong>{formatCurrency(summary.recurringExpenses)}</strong>
        <small>ativos no mês atual</small>
      </article>
      <article className={`planning-overview-card balance ${summary.recurringBalance < 0 ? 'negative' : ''}`}>
        <span>Saldo da base fixa</span>
        <strong>{formatCurrency(summary.recurringBalance)}</strong>
        <small>antes dos itens únicos</small>
      </article>
      <article className="planning-overview-card one-time">
        <span>Itens únicos futuros</span>
        <strong>{summary.upcomingOneTimeCount}</strong>
        <small>aguardando acontecer</small>
      </article>
    </section>
  )
}
