import type { FinancialOccurrence } from '../../types/finance'
import { formatCurrency } from '../../utils/currency'
import { categoryTotals } from '../../utils/projections'

export function CategoryChart({ occurrences }: { occurrences: FinancialOccurrence[] }) {
  const categories = categoryTotals(occurrences).slice(0, 5)
  const maximum = Math.max(...categories.map((item) => item.amount), 1)

  return (
    <section className="workspace-card chart-card">
      <div className="card-heading"><div><span className="overline">Distribuição</span><h2>Gastos por categoria</h2></div></div>
      {categories.length === 0 ? <div className="chart-empty">Nenhum gasto previsto no período.</div> : (
        <div className="category-chart">
          {categories.map((item) => (
            <div key={item.category}>
              <div><span>{item.category}</span><strong>{formatCurrency(item.amount)}</strong></div>
              <div className="bar-track"><span style={{ width: `${(item.amount / maximum) * 100}%` }} /></div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
