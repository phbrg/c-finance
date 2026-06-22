import type { DashboardSummary, FinancialOccurrence } from '../../types/finance'
import { formatCurrency } from '../../utils/currency'

interface FinancialInsightsProps { summary: DashboardSummary; occurrences: FinancialOccurrence[] }

export function FinancialInsights({ summary, occurrences }: FinancialInsightsProps) {
  const nextItems = occurrences
    .filter((item) => item.type === 'expense' && item.status === 'planned')
    .slice(0, 4)
  const pendingPaymentCount = occurrences.filter((item) => item.type === 'expense' && item.status === 'planned').length
  const percentage = summary.fixedCommitmentPercentage
  const commitmentTone = percentage !== null && percentage > 70 ? 'warning' : 'neutral'
  const insights = [
    {
      label: 'Renda comprometida',
      value: percentage === null ? '—' : `${percentage.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`,
      detail: percentage === null ? 'Cadastre um ganho recorrente para calcular.' : percentage > 70 ? 'Seus gastos fixos estão consumindo uma parcela alta da renda.' : 'Percentual dos ganhos recorrentes usado por gastos fixos.',
      tone: commitmentTone,
    },
    {
      label: 'Fechamento esperado',
      value: formatCurrency(summary.projectedBalance),
      detail: summary.projectedBalance < 0 ? 'A projeção indica saldo negativo no fim do mês.' : 'Saldo estimado após todos os ganhos e gastos previstos.',
      tone: summary.projectedBalance < 0 ? 'danger' : 'positive',
    },
    {
      label: 'Situação das contas',
      value: summary.pendingExpenses > 0 ? formatCurrency(summary.pendingExpenses) : 'Tudo pago',
      detail: summary.pendingExpenses > 0 ? `${pendingPaymentCount} ${pendingPaymentCount === 1 ? 'pagamento aguarda' : 'pagamentos aguardam'} confirmação; os próximos aparecem logo abaixo.` : 'Nenhum gasto previsto está aguardando confirmação.',
      tone: summary.pendingExpenses > 0 ? 'neutral' : 'positive',
    },
  ]

  return (
    <div className="insight-column">
      <section className="workspace-card insights-card">
        <div className="card-heading"><div><span className="overline">Leitura rápida</span><h2>O que merece sua atenção</h2></div></div>
        <div className="insight-list">{insights.map((insight) => (
          <article className={`insight-item ${insight.tone}`} key={insight.label}>
            <span>{insight.label}</span>
            <strong>{insight.value}</strong>
            <p>{insight.detail}</p>
          </article>
        ))}</div>
      </section>

      <section className="workspace-card upcoming-card">
        <div className="card-heading"><div><span className="overline">A seguir</span><h2>Próximos pagamentos</h2></div><span className="count-badge">{pendingPaymentCount}</span></div>
        {nextItems.length === 0 ? <p className="upcoming-empty">Nenhum pagamento pendente neste mês.</p> : <div className="upcoming-list">{nextItems.map((item) => (
          <article key={item.key} className="upcoming-payment">
            <time dateTime={item.dueDate}><strong>{item.dueDate.slice(8, 10)}</strong><span>dia</span></time>
            <div><strong>{item.title}</strong><small>{item.category} · {item.kind === 'recurring' ? 'fixo' : 'único'}</small></div>
            <strong className="amount-expense">{formatCurrency(item.amount)}</strong>
          </article>
        ))}</div>}
      </section>
    </div>
  )
}
