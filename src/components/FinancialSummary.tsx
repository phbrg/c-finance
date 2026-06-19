import type { FinancialSummaryData } from '../types/transaction'
import { formatCurrency } from '../utils/currency'

interface FinancialSummaryProps {
  summary: FinancialSummaryData
}

export function FinancialSummary({ summary }: FinancialSummaryProps) {
  const cards = [
    { label: 'Ganhos', value: formatCurrency(summary.totalIncome), tone: 'text-cyan-400' },
    { label: 'Gastos', value: formatCurrency(summary.totalExpenses), tone: 'text-rose-400' },
    {
      label: 'Saldo',
      value: formatCurrency(summary.balance),
      tone: summary.balance < 0 ? 'text-rose-400' : 'text-slate-100',
    },
    {
      label: 'Comprometimento',
      value:
        summary.expensePercentage === null
          ? '—'
          : `${summary.expensePercentage.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`,
      tone: 'text-amber-400',
    },
  ]

  return (
    <section aria-labelledby="summary-title">
      <div className="mb-4 flex items-end justify-between">
        <div>
          <p className="eyebrow">Visão do período</p>
          <h2 id="summary-title" className="section-title">Resumo financeiro</h2>
        </div>
        {summary.largestExpense && (
          <p className="hidden text-right text-sm text-slate-400 sm:block">
            Maior gasto: <strong className="text-slate-200">{summary.largestExpense.title}</strong>
            <br />{formatCurrency(summary.largestExpense.amount)}
          </p>
        )}
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <article key={card.label} className="summary-card">
            <p className="text-sm font-medium text-slate-400">{card.label}</p>
            <p className={`mt-2 text-2xl font-bold tracking-tight ${card.tone}`}>{card.value}</p>
          </article>
        ))}
      </div>
      {summary.expensePercentage === null && summary.totalExpenses > 0 && (
        <p className="mt-3 text-sm text-amber-400">
          Não há ganhos no período para calcular o percentual de gastos.
        </p>
      )}
    </section>
  )
}
