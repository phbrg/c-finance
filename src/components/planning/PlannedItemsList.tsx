import { useMemo, useState } from 'react'
import type { FinancialItem, FinancialItemKind } from '../../types/finance'
import type { TransactionType } from '../../types/common'
import { formatCurrency } from '../../utils/currency'
import { formatDate, today } from '../../utils/date'
import { filterPlannedItems, isCurrentPlannedItem, type PlannedItemScope } from '../../utils/planning'
import { ConfirmDialog } from '../ConfirmDialog'

interface PlannedItemsListProps {
  items: FinancialItem[]
  onCreate: () => void
  onEdit: (item: FinancialItem) => void
  onDelete: (id: string) => void
}

const PAGE_SIZE = 8

export function PlannedItemsList({ items, onCreate, onEdit, onDelete }: PlannedItemsListProps) {
  const [pendingDelete, setPendingDelete] = useState<FinancialItem | null>(null)
  const [query, setQuery] = useState('')
  const [scope, setScope] = useState<PlannedItemScope>('current')
  const [type, setType] = useState<'all' | TransactionType>('all')
  const [kind, setKind] = useState<'all' | FinancialItemKind>('all')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const referenceDate = today()
  const currentCount = items.filter((item) => isCurrentPlannedItem(item, referenceDate)).length
  const endedCount = items.length - currentCount
  const filteredItems = useMemo(
    () => filterPlannedItems(items, { query, scope, type, kind }, referenceDate),
    [items, query, scope, type, kind, referenceDate],
  )
  const visibleItems = filteredItems.slice(0, visibleCount)
  const remainingCount = Math.max(filteredItems.length - visibleItems.length, 0)
  const hasSecondaryFilters = Boolean(query || type !== 'all' || kind !== 'all')

  const resetVisibleItems = () => setVisibleCount(PAGE_SIZE)
  const clearFilters = () => {
    setQuery('')
    setType('all')
    setKind('all')
    resetVisibleItems()
  }

  return (
    <section className="workspace-card planned-items-card">
      <div className="card-heading planned-items-heading">
        <div><span className="overline">Sua base</span><h2>Ganhos e gastos planejados</h2><p>Visualize valores, frequência e vigência sem precisar abrir cada item.</p></div>
        <div className="planned-heading-actions">
          <button type="button" className="button-primary planned-create-button" onClick={onCreate}><span aria-hidden="true">＋</span>Adicionar nova transação</button>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="onboarding-empty">
          <span>01</span>
          <h3>Comece pelos itens que se repetem</h3>
          <p>Cadastre salário, aluguel, assinaturas e outras entradas ou saídas mensais. A dashboard será montada automaticamente.</p>
        </div>
      ) : (
        <>
          <div className="planned-scope-tabs" role="group" aria-label="Situação dos itens">
            <button type="button" className={scope === 'current' ? 'active' : ''} aria-pressed={scope === 'current'} onClick={() => { setScope('current'); resetVisibleItems() }}>Vigentes <span>{currentCount}</span></button>
            <button type="button" className={scope === 'ended' ? 'active' : ''} aria-pressed={scope === 'ended'} onClick={() => { setScope('ended'); resetVisibleItems() }}>Encerrados <span>{endedCount}</span></button>
          </div>

          <div className="planned-filters">
            <label className="planned-search"><span className="sr-only">Buscar item</span><i aria-hidden="true">⌕</i><input type="search" value={query} onChange={(event) => { setQuery(event.target.value); resetVisibleItems() }} placeholder="Buscar por título ou categoria" /></label>
            <label className="field"><span>Tipo</span><select value={type} onChange={(event) => { setType(event.target.value as 'all' | TransactionType); resetVisibleItems() }}><option value="all">Todos</option><option value="income">Ganhos</option><option value="expense">Gastos</option></select></label>
            <label className="field"><span>Frequência</span><select value={kind} onChange={(event) => { setKind(event.target.value as 'all' | FinancialItemKind); resetVisibleItems() }}><option value="all">Todas</option><option value="recurring">Fixos</option><option value="one-time">Únicos</option></select></label>
          </div>

          <div className="planned-results-meta">
            <span>{filteredItems.length} {filteredItems.length === 1 ? 'item encontrado' : 'itens encontrados'}</span>
            {hasSecondaryFilters && <button type="button" onClick={clearFilters}>Limpar filtros</button>}
          </div>

          {filteredItems.length === 0 ? (
            <div className="planned-filter-empty"><strong>Nenhum item encontrado.</strong><span>Tente ajustar a busca ou os filtros selecionados.</span>{hasSecondaryFilters && <button type="button" className="button-secondary" onClick={clearFilters}>Limpar filtros</button>}</div>
          ) : (
            <div className="planned-table">
              <div className="planned-table-header" aria-hidden="true">
                <span>Item</span>
                <span>Movimento</span>
                <span>Frequência</span>
                <span>Vigência</span>
                <span>Valor</span>
                <span>Ações</span>
              </div>
              <div className="planned-list">
              {visibleItems.map((item) => (
                <article key={item.id} className="planned-row">
                  <div className="planned-main">
                    <div className="planned-title-row"><span className={`item-dot ${item.type}`} /><strong>{item.title}</strong><span className="category-pill">{item.category}</span></div>
                    {item.notes && <small className="planned-notes">{item.notes}</small>}
                    {item.investmentId && <span className="linked-investment-label">Vinculado a investimento</span>}
                  </div>
                  <div className="planned-type-cell" data-label="Movimento"><span className={`movement-pill ${item.type}`}>{item.type === 'income' ? 'Ganho' : 'Gasto'}</span></div>
                  <div className="planned-detail-cell planned-frequency-cell" data-label="Frequência">
                    <strong>{item.kind === 'recurring' ? 'Fixo mensal' : 'Item único'}</strong>
                    <small>{item.kind === 'recurring' ? `Todo dia ${item.recurrence?.dayOfMonth}` : 'Não se repete'}</small>
                  </div>
                  <div className="planned-detail-cell planned-period-cell" data-label="Vigência">
                    <strong>{item.kind === 'recurring' ? `Desde ${formatMonth(item.recurrence?.startMonth)}` : item.dueDate ? formatDate(item.dueDate) : '—'}</strong>
                    <small>{item.kind === 'recurring' ? formatRecurrenceEnd(item) : 'Data prevista'}</small>
                  </div>
                  <div className="planned-amount-cell" data-label="Valor"><strong className={item.type === 'income' ? 'amount-income' : 'amount-expense'}>{item.type === 'income' ? '+' : '−'} {formatCurrency(item.amount)}</strong></div>
                  <div className="row-actions" data-label="Ações">
                    <button type="button" className="icon-button edit-button" aria-label={`Editar ${item.title}`} title="Editar" onClick={() => onEdit(item)}><span aria-hidden="true">✎</span><span className="planned-action-label">Editar</span></button>
                    <button type="button" className="icon-button" aria-label={`Excluir ${item.title}`} title="Excluir" onClick={() => setPendingDelete(item)}><span aria-hidden="true">×</span><span className="planned-action-label">Excluir</span></button>
                  </div>
                </article>
              ))}
              </div>
            </div>
          )}

          {remainingCount > 0 && <button type="button" className="planned-show-more" onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}>Mostrar mais <span>{Math.min(remainingCount, PAGE_SIZE)} de {remainingCount}</span></button>}
        </>
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

function formatRecurrenceEnd(item: FinancialItem): string {
  return item.recurrence?.endMonth
    ? `Até ${formatMonth(item.recurrence.endMonth)}`
    : 'Sem data final'
}
