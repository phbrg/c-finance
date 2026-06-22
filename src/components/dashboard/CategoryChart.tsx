import type { FinancialOccurrence } from '../../types/finance'
import { formatCurrency } from '../../utils/currency'
import { categoryTotals } from '../../utils/projections'

export function CategoryChart({ occurrences }: { occurrences: FinancialOccurrence[] }) {
  const allCategories = categoryTotals(occurrences)
  const categories = allCategories.slice(0, 5)
  const total = allCategories.reduce((sum, item) => sum + item.amount, 0)

  return (
    <section className="workspace-card chart-card category-card">
      <div className="card-heading">
        <div><span className="overline">Para onde vai</span><h2>Gastos por categoria</h2><p>Participação de cada categoria no total previsto.</p></div>
        {total > 0 && <div className="category-total"><span>Total de gastos</span><strong>{formatCurrency(total)}</strong></div>}
      </div>
      {categories.length === 0 ? <div className="chart-empty">Nenhum gasto previsto no período.</div> : (
        <div className="category-chart">
          {categories.map((item) => {
            const percentage = (item.amount / total) * 100
            return (
              <div key={item.category}>
                <div><span>{item.category}</span><strong>{formatCurrency(item.amount)} <em>{percentage.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%</em></strong></div>
                <div className="bar-track"><span style={{ width: `${percentage}%` }} /></div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
