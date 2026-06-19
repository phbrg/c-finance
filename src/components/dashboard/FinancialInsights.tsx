import type { DashboardSummary, FinancialOccurrence } from '../../types/finance'
import { formatCurrency } from '../../utils/currency'

interface FinancialInsightsProps { summary: DashboardSummary; occurrences: FinancialOccurrence[] }

export function FinancialInsights({ summary, occurrences }: FinancialInsightsProps) {
  const nextItems = occurrences
    .filter((item) => item.type === 'expense' && item.status === 'planned')
    .slice(0, 4)
  const percentage = summary.fixedCommitmentPercentage
  const insights = [
    percentage === null
      ? 'Cadastre um ganho fixo para medir o comprometimento da sua renda.'
      : `Seus gastos fixos comprometem ${percentage.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}% da renda recorrente.`,
    summary.projectedBalance < 0
      ? `O mês está projetado para fechar ${formatCurrency(Math.abs(summary.projectedBalance))} no negativo.`
      : `Mantendo o previsto, o mês fecha com ${formatCurrency(summary.projectedBalance)} de saldo.`,
    summary.pendingExpenses > 0
      ? `Ainda há ${formatCurrency(summary.pendingExpenses)} em pagamentos pendentes.`
      : 'Todos os gastos previstos foram confirmados.',
  ]

  return (
    <div className="insight-column">
      <section className="workspace-card insights-card">
        <div className="card-heading"><div><span className="overline">Leitura rápida</span><h2>Insights do mês</h2></div></div>
        <ul>{insights.map((insight) => <li key={insight}>{insight}</li>)}</ul>
      </section>
      <section className="workspace-card upcoming-card">
        <div className="card-heading"><div><span className="overline">A seguir</span><h2>Próximos pagamentos</h2></div></div>
        {nextItems.length === 0 ? <p>Nenhum pagamento pendente.</p> : nextItems.map((item) => (
          <div key={item.key}><span><strong>{item.title}</strong><small>dia {item.dueDate.slice(8, 10)}</small></span><strong className={item.type === 'income' ? 'amount-income' : 'amount-expense'}>{formatCurrency(item.amount)}</strong></div>
        ))}
      </section>
    </div>
  )
}
