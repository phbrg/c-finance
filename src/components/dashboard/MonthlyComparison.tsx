import type { FinancialOccurrence } from '../../types/finance'
import { formatCurrency } from '../../utils/currency'

interface MonthData { month: string; occurrences: FinancialOccurrence[] }

export function MonthlyComparison({ months }: { months: MonthData[] }) {
  const values = months.map(({ month, occurrences }) => ({
    month,
    income: occurrences.filter((item) => item.type === 'income' && item.status !== 'skipped').reduce((sum, item) => sum + item.amount, 0),
    expenses: occurrences.filter((item) => item.type === 'expense' && item.status !== 'skipped').reduce((sum, item) => sum + item.amount, 0),
  }))
  const maximum = Math.max(...values.flatMap((item) => [item.income, item.expenses]), 1)

  return (
    <section className="workspace-card comparison-card">
      <div className="card-heading"><div><span className="overline">Últimos seis meses</span><h2>Ganhos × gastos</h2></div><div className="chart-legend"><span className="income">Ganhos</span><span className="expense">Gastos</span></div></div>
      <div className="comparison-chart">
        {values.map((item) => (
          <div key={item.month} className="month-column" title={`${formatCurrency(item.income)} em ganhos e ${formatCurrency(item.expenses)} em gastos`}>
            <div className="bar-pair"><span className="income" style={{ height: `${Math.max((item.income / maximum) * 100, item.income ? 3 : 0)}%` }} /><span className="expense" style={{ height: `${Math.max((item.expenses / maximum) * 100, item.expenses ? 3 : 0)}%` }} /></div>
            <small>{item.month.slice(5, 7)}/{item.month.slice(2, 4)}</small>
          </div>
        ))}
      </div>
    </section>
  )
}
