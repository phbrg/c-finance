import type { DashboardSummary } from '../../types/finance'
import { formatCurrency } from '../../utils/currency'

interface DashboardCardsProps {
  summary: DashboardSummary
  cutoffDate: string
}

export function DashboardCards({ summary, cutoffDate }: DashboardCardsProps) {
  const cutoffDay = Number(cutoffDate.slice(8, 10))
  const cards = [
    { label: 'Saldo projetado', value: formatCurrency(summary.projectedBalance), detail: 'Resultado esperado no mês', tone: summary.projectedBalance >= 0 ? 'blue' : 'red' },
    { label: 'Ganhos', value: formatCurrency(summary.expectedIncome), detail: `Até dia ${cutoffDay}: ${formatCurrency(summary.expectedIncomeUntilCutoff)} previstos · ${formatCurrency(summary.receivedIncome)} recebidos`, tone: 'cyan' },
    { label: 'Gastos', value: formatCurrency(summary.expectedExpenses), detail: `Até dia ${cutoffDay}: ${formatCurrency(summary.expectedExpensesUntilCutoff)} previstos · ${formatCurrency(summary.paidExpenses)} pagos`, tone: 'red' },
    { label: 'Ainda comprometido', value: formatCurrency(summary.pendingExpenses), detail: 'Pagamentos pendentes', tone: 'amber' },
  ]

  return (
    <section className="dashboard-cards" aria-label="Resumo financeiro">
      {cards.map((card) => (
        <article key={card.label} className={`metric-card ${card.tone}`}>
          <span>{card.label}</span>
          <strong>{card.value}</strong>
          <small>{card.detail}</small>
        </article>
      ))}
    </section>
  )
}
