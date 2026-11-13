import type { FinancialItem } from '../../types/finance'
import { formatCurrency } from '../../utils/currency'
import { monthLabel, summarizePlanning } from '../../utils/planning'

export function PlanningOverview({ items, month }: { items: FinancialItem[]; month: string }) {
  const summary = summarizePlanning(items, month)
  const label = monthLabel(month)
  const used = summary.recurringIncome > 0 ? Math.min(100, Math.round((summary.recurringExpenses / summary.recurringIncome) * 100)) : summary.recurringExpenses > 0 ? 100 : 0

  return (
    <section aria-label={`Resumo de ${label}`}>
      <p className="muted pl-summary-title">Em {label}</p>
      <div className="stats pl-stats">
        <div className="stat is-income"><i aria-hidden="true">↑</i><span>Ganhos fixos</span><strong className="money">{formatCurrency(summary.recurringIncome)}</strong><small>entram todo mês</small></div>
        <div className="stat is-expense"><i aria-hidden="true">↓</i><span>Gastos fixos</span><strong className="money">{formatCurrency(summary.recurringExpenses)}</strong><small>saem todo mês</small></div>
        <div className="stat is-balance"><i aria-hidden="true">=</i><span>Sobra dos fixos</span><strong className={`money ${summary.recurringBalance < 0 ? 'is-expense' : ''}`}>{formatCurrency(summary.recurringBalance)}</strong><small>ganhos menos gastos</small></div>
        <div className="stat is-count"><i aria-hidden="true">#</i><span>Itens de uma vez</span><strong>{summary.oneTimeCount}</strong><small>com data neste mês</small></div>
      </div>
      <div className="pl-meter" role="img" aria-label={`Gastos fixos usam ${used}% dos ganhos fixos`}>
        <div className={`pl-meter-fill ${used >= 100 ? 'is-over' : ''}`} style={{ width: `${used}%` }} />
      </div>
      <p className="muted pl-meter-text">Gastos fixos usam {used}% dos ganhos fixos</p>
    </section>
  )
}
