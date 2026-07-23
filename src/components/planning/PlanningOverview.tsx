import type { FinancialItem } from '../../types/finance'
import { today } from '../../utils/date'
import { summarizePlanning } from '../../utils/planning'
import { CurrencyAmount, type CurrencyTone } from '../shared/CurrencyAmount'

function balanceTone(value: number): CurrencyTone {
  if (value > 0) return 'positive'
  if (value < 0) return 'negative'
  return 'neutral'
}

function balanceLabel(value: number): string {
  if (value > 0) return 'Saldo positivo'
  if (value < 0) return 'Saldo negativo'
  return 'Saldo zerado'
}

export function PlanningOverview({ items }: { items: FinancialItem[] }) {
  const summary = summarizePlanning(items, today())

  return (
    <section className="planning-overview" aria-label="Resumo da base planejada">
      <article className="metric-card planning-overview-card income">
        <span>Ganhos fixos mensais</span>
        <CurrencyAmount value={summary.recurringIncome} tone="income" />
        <small>ativos no mês atual</small>
      </article>
      <article className="metric-card planning-overview-card expense">
        <span>Gastos fixos mensais</span>
        <CurrencyAmount value={summary.recurringExpenses} tone="expense" />
        <small>ativos no mês atual</small>
      </article>
      <article className={`metric-card planning-overview-card balance balance-${balanceTone(summary.recurringBalance)}`}>
        <div className="metric-card-label"><span>Saldo da base fixa</span><em>{balanceLabel(summary.recurringBalance)}</em></div>
        <CurrencyAmount value={summary.recurringBalance} tone={balanceTone(summary.recurringBalance)} />
        <small>antes dos itens únicos</small>
      </article>
      <article className="metric-card planning-overview-card one-time">
        <span>Itens únicos futuros</span>
        <strong className="planning-count-value">{summary.upcomingOneTimeCount}</strong>
        <small>aguardando acontecer</small>
      </article>
    </section>
  )
}
