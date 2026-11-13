import type { FinancialItem } from '../../types/finance'
import { formatCurrency } from '../../utils/currency'
import { monthLabel, summarizePlanning } from '../../utils/planning'

export function PlanningOverview({ items, month }: { items: FinancialItem[]; month: string }) {
  const summary = summarizePlanning(items, month)
  const label = monthLabel(month)

  return (
    <section aria-label={`Resumo de ${label}`}>
      <p className="muted pl-summary-title">Em {label}</p>
      <div className="stats">
        <div className="stat is-income"><span>Ganhos fixos</span><strong className="money">{formatCurrency(summary.recurringIncome)}</strong></div>
        <div className="stat is-expense"><span>Gastos fixos</span><strong className="money">{formatCurrency(summary.recurringExpenses)}</strong></div>
        <div className="stat"><span>Sobra dos fixos</span><strong className={`money ${summary.recurringBalance < 0 ? 'is-expense' : ''}`}>{formatCurrency(summary.recurringBalance)}</strong></div>
        <div className="stat"><span>Itens de uma vez</span><strong>{summary.oneTimeCount}</strong><small>com data neste mês</small></div>
      </div>
    </section>
  )
}
