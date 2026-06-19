import { useState } from 'react'
import type { FinancialItem } from '../../types/finance'
import { formatCurrency } from '../../utils/currency'
import { formatDate } from '../../utils/date'
import { ConfirmDialog } from '../ConfirmDialog'

interface PlannedItemsListProps {
  items: FinancialItem[]
  onEdit: (item: FinancialItem) => void
  onDelete: (id: string) => void
}

export function PlannedItemsList({ items, onEdit, onDelete }: PlannedItemsListProps) {
  const [pendingDelete, setPendingDelete] = useState<FinancialItem | null>(null)

  return (
    <section className="workspace-card">
      <div className="card-heading">
        <div><span className="overline">Sua base</span><h2>Itens planejados</h2></div>
        <span className="count-badge">{items.length}</span>
      </div>
      {items.length === 0 ? (
        <div className="onboarding-empty">
          <span>01</span>
          <h3>Comece pelos itens que se repetem</h3>
          <p>Cadastre salário, aluguel, assinaturas e outras entradas ou saídas mensais. A dashboard será montada automaticamente.</p>
        </div>
      ) : (
        <div className="planned-list">
          {items.map((item) => (
            <article key={item.id} className="planned-row">
              <span className={`item-dot ${item.type}`} />
              <div className="planned-main">
                <div><strong>{item.title}</strong><span className="category-pill">{item.category}</span></div>
                {item.investmentId && <span className="linked-investment-label">Vinculado a investimento</span>}
                <small>
                  {item.kind === 'recurring'
                    ? `Todo dia ${item.recurrence?.dayOfMonth} · ${formatRecurrencePeriod(item)}`
                    : `Único · ${item.dueDate ? formatDate(item.dueDate) : ''}`}
                </small>
              </div>
              <strong className={item.type === 'income' ? 'amount-income' : 'amount-expense'}>
                {item.type === 'income' ? '+' : '−'} {formatCurrency(item.amount)}
              </strong>
              <div className="row-actions">
                <button type="button" className="icon-button edit-button" aria-label={`Editar ${item.title}`} title="Editar" onClick={() => onEdit(item)}>✎</button>
                <button type="button" className="icon-button" aria-label={`Excluir ${item.title}`} title="Excluir" onClick={() => setPendingDelete(item)}>×</button>
              </div>
            </article>
          ))}
        </div>
      )}
      {pendingDelete && (
        <ConfirmDialog
          title="Excluir item planejado?"
          description={`“${pendingDelete.title}” e suas confirmações mensais serão removidos permanentemente.`}
          confirmLabel="Excluir"
          onCancel={() => setPendingDelete(null)}
          onConfirm={() => {
            onDelete(pendingDelete.id)
            setPendingDelete(null)
          }}
        />
      )}
    </section>
  )
}

function formatMonth(month?: string): string {
  if (!month) return '—'
  const [year, monthNumber] = month.split('-')
  return `${monthNumber}/${year}`
}

function formatRecurrencePeriod(item: FinancialItem): string {
  const start = formatMonth(item.recurrence?.startMonth)
  return item.recurrence?.endMonth
    ? `de ${start} até ${formatMonth(item.recurrence.endMonth)}`
    : `desde ${start} · sem data final`
}
