import type { FinancialOccurrence, OccurrenceStatus } from '../../types/finance'
import { formatCurrency } from '../../utils/currency'
import { formatDate } from '../../utils/date'

interface OccurrenceListProps {
  occurrences: FinancialOccurrence[]
  onStatusChange: (key: string, status: OccurrenceStatus) => void
}

const statusLabels: Record<OccurrenceStatus, string> = {
  planned: 'Pendente',
  completed: 'Confirmado',
  skipped: 'Ignorado',
}

export function OccurrenceList({ occurrences, onStatusChange }: OccurrenceListProps) {
  if (occurrences.length === 0) {
    return <div className="empty-dashboard"><strong>Nenhum lançamento neste mês.</strong><span>Adicione itens no Planejamento para começar.</span></div>
  }

  return (
    <div className="occurrence-list">
      {occurrences.map((item) => (
        <article key={item.key} className={`occurrence-row ${item.status}`}>
          <div className="date-tile"><strong>{item.dueDate.slice(8, 10)}</strong><span>{formatDate(item.dueDate).slice(3, 5)}</span></div>
          <div className="occurrence-main">
            <strong>{item.title}</strong>
            <small>{item.category} · {item.kind === 'recurring' ? 'Fixo mensal' : 'Único'}{item.investmentId ? ' · Aporte vinculado' : ''}</small>
          </div>
          <span className={`status-pill ${item.status}`}>{statusLabels[item.status]}</span>
          <strong className={item.type === 'income' ? 'amount-income' : 'amount-expense'}>{item.type === 'income' ? '+' : '−'} {formatCurrency(item.amount)}</strong>
          <select aria-label={`Situação de ${item.title}`} value={item.status} onChange={(event) => onStatusChange(item.key, event.target.value as OccurrenceStatus)}>
            <option value="planned">Pendente</option>
            <option value="completed">Confirmado</option>
            <option value="skipped">Ignorado</option>
          </select>
        </article>
      ))}
    </div>
  )
}
