import type { FinancialOccurrence } from '../../types/finance'
import { formatCurrency } from '../../utils/currency'

interface MonthData { month: string; occurrences: FinancialOccurrence[] }

function formatCompactCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value / 100)
}

export function MonthlyComparison({ months }: { months: MonthData[] }) {
  const values = months.map(({ month, occurrences }) => {
    const income = occurrences.filter((item) => item.type === 'income' && item.status !== 'skipped').reduce((sum, item) => sum + item.amount, 0)
    const expenses = occurrences.filter((item) => item.type === 'expense' && item.status !== 'skipped').reduce((sum, item) => sum + item.amount, 0)
    return { month, income, expenses, balance: income - expenses }
  })
  const maximum = Math.max(...values.flatMap((item) => [item.income, item.expenses]), 1)
  const current = values.at(-1)
  const previous = values.at(-2)
  const balanceChange = current && previous ? current.balance - previous.balance : 0

  return (
    <section className="workspace-card comparison-card">
      <div className="card-heading comparison-heading">
        <div><span className="overline">Visão histórica</span><h2>Ganhos e gastos nos últimos meses</h2><p>Compare o tamanho das entradas e saídas e acompanhe o saldo de cada mês.</p></div>
        <div className="chart-legend"><span className="income">Ganhos</span><span className="expense">Gastos</span></div>
      </div>
      <div className="comparison-chart">
        {values.map((item) => (
          <div key={item.month} className="month-column" title={`${formatCurrency(item.income)} em ganhos, ${formatCurrency(item.expenses)} em gastos e saldo de ${formatCurrency(item.balance)}`}>
            <div className="month-values" aria-hidden="true"><span>{formatCompactCurrency(item.income)}</span><span>{formatCompactCurrency(item.expenses)}</span></div>
            <div className="bar-pair"><span className="income" style={{ height: `${Math.max((item.income / maximum) * 100, item.income ? 3 : 0)}%` }} /><span className="expense" style={{ height: `${Math.max((item.expenses / maximum) * 100, item.expenses ? 3 : 0)}%` }} /></div>
            <small>{new Date(`${item.month}-02T12:00:00`).toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}</small>
            <strong className={item.balance >= 0 ? 'positive' : 'negative'}>{formatCompactCurrency(item.balance)}</strong>
          </div>
        ))}
      </div>
      {current && previous && (
        <div className={`comparison-reading ${balanceChange >= 0 ? 'positive' : 'negative'}`}>
          <span>{balanceChange >= 0 ? '↗' : '↘'}</span>
          <p>O saldo projetado deste mês está <strong>{formatCurrency(Math.abs(balanceChange))} {balanceChange >= 0 ? 'acima' : 'abaixo'}</strong> do mês anterior.</p>
        </div>
      )}
    </section>
  )
}
