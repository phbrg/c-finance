import type { CategoryTotal } from '../../utils/ledger'
import { formatCurrency } from '../../utils/currency'

interface CategoryBarsProps {
  totals: CategoryTotal[]
  selected: string
  onSelect: (category: string) => void
}

/** Horizontal bars as real buttons: the text stays readable at any width and every bar is clickable. */
export function CategoryBars({ totals, selected, onSelect }: CategoryBarsProps) {
  const total = totals.reduce((sum, item) => sum + item.amount, 0)
  if (total === 0) return <p className="empty">Nenhum gasto com esses filtros.</p>
  const max = totals[0].amount

  return (
    <ul className="category-bars" aria-label="Gastos por categoria">
      {totals.map((item) => (
        <li key={item.category}>
          <button
            type="button"
            aria-pressed={selected === item.category}
            className={selected && selected !== item.category ? 'is-dim' : ''}
            onClick={() => onSelect(item.category)}
          >
            <span className="category-name">{item.category}</span>
            <span className="money">{formatCurrency(item.amount)}</span>
            <span className="category-share">{item.amount / total < 0.01 ? '<1' : Math.round((item.amount / total) * 100)}%</span>
            <span className="category-track" aria-hidden="true"><span style={{ width: `${(item.amount / max) * 100}%` }} /></span>
          </button>
        </li>
      ))}
    </ul>
  )
}
