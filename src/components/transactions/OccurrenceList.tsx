import type { FinancialOccurrence, OccurrenceStatus } from '../../types/finance'
import { formatCurrency } from '../../utils/currency'

interface OccurrenceListProps {
  occurrences: FinancialOccurrence[]
  onStatusChange: (key: string, status: OccurrenceStatus) => void
  emptyTitle?: string
  emptyDescription?: string
}

const statusLabels: Record<OccurrenceStatus, string> = {
  planned: 'Pendente',
  completed: 'Confirmado',
  skipped: 'Ignorado',
}

export function OccurrenceList({ occurrences, onStatusChange, emptyTitle = 'Nenhum lançamento neste mês.', emptyDescription = 'Adicione itens no Planejamento para começar.' }: OccurrenceListProps) {
  if (occurrences.length === 0) {
    return <div className="transaction-empty"><span aria-hidden="true">◎</span><strong>{emptyTitle}</strong><small>{emptyDescription}</small></div>
  }

  return (
    <div className="occurrence-list">
      {occurrences.map((item) => (
        <article key={item.key} className={`occurrence-row ${item.status}`}>
          <time className="date-tile" dateTime={item.dueDate}><strong>{item.dueDate.slice(8, 10)}</strong><span>{new Date(`${item.dueDate}T12:00:00`).toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}</span></time>
          <div className="occurrence-main">
            <strong>{item.title}</strong>
            <small>{item.category} · {item.kind === 'recurring' ? 'Fixo mensal' : 'Único'}{item.investmentId ? ' · Aporte vinculado' : ''}</small>
          </div>
          <span className={`status-pill ${item.status}`}>{statusLabels[item.status]}</span>
          <div className="occurrence-amount"><span>{item.type === 'income' ? 'Entrada' : 'Saída'}</span><strong className={item.type === 'income' ? 'amount-income' : 'amount-expense'}>{item.type === 'income' ? '+' : '−'} {formatCurrency(item.amount)}</strong></div>
          <div className="occurrence-status-control">
            {item.status === 'planned' && <button type="button" className="confirm-occurrence-button" onClick={() => onStatusChange(item.key, 'completed')} aria-label={`Confirmar ${item.title}`}>✓ <span>Confirmar</span></button>}
            <select className={item.status} aria-label={`Situação de ${item.title}`} value={item.status} onChange={(event) => onStatusChange(item.key, event.target.value as OccurrenceStatus)}>
              <option value="planned">Pendente</option>
              <option value="completed">Confirmado</option>
              <option value="skipped">Ignorado</option>
            </select>
          </div>
        </article>
      ))}
    </div>
  )
}
