import type { TransactionFilters as Filters } from '../types/transaction'

interface TransactionFiltersProps {
  filters: Filters
  onChange: (filters: Filters) => void
}

export function TransactionFilters({ filters, onChange }: TransactionFiltersProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <label className="field compact-field">
        <span>Mês</span>
        <input
          type="month"
          value={filters.month}
          onChange={(event) => onChange({ ...filters, month: event.target.value })}
        />
      </label>
      <label className="field compact-field">
        <span>Tipo</span>
        <select
          value={filters.type}
          onChange={(event) =>
            onChange({ ...filters, type: event.target.value as Filters['type'] })
          }
        >
          <option value="all">Todos</option>
          <option value="income">Ganhos</option>
          <option value="expense">Gastos</option>
        </select>
      </label>
    </div>
  )
}
