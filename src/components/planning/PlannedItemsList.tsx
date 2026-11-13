import { useMemo, useState } from 'react'
import type { CreditCard, FinancialItem, FinancialItemKind, OccurrenceRecord } from '../../types/finance'
import type { TransactionType } from '../../types/common'
import { formatCurrency } from '../../utils/currency'
import { formatDate, today } from '../../utils/date'
import { filterPlannedItems, isCurrentPlannedItem, type PlannedItemScope } from '../../utils/planning'
import { amountAt, monthsBetween, splitInstallments } from '../../utils/recurrence'
import { ConfirmDialog } from '../ConfirmDialog'

interface PlannedItemsListProps {
  items: FinancialItem[]
  records?: OccurrenceRecord[]
  cards?: CreditCard[]
  /** Month being viewed (YYYY-MM): recurring amounts are shown as they are in it. */
  month?: string
  onCreate: () => void
  onEdit: (item: FinancialItem) => void
  onDelete: (id: string) => void
}

const PAGE_SIZE = 18

export function PlannedItemsList({ items, records = [], cards = [], month = today().slice(0, 7), onCreate, onEdit, onDelete }: PlannedItemsListProps) {
  const [pendingDelete, setPendingDelete] = useState<FinancialItem | null>(null)
  const [query, setQuery] = useState('')
  const [scope, setScope] = useState<PlannedItemScope>('current')
  const [type, setType] = useState<'all' | TransactionType>('all')
  const [kind, setKind] = useState<'all' | FinancialItemKind>('all')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const referenceDate = today()
  const currentCount = items.filter((item) => isCurrentPlannedItem(item, referenceDate, records)).length
  const endedCount = items.length - currentCount
  const filteredItems = useMemo(
    () => filterPlannedItems(items, { query, scope, type, kind }, referenceDate, records),
    [items, query, scope, type, kind, referenceDate, records],
  )
  // Incomes first, then expenses; the sort is stable so each group keeps its own order.
  const orderedItems = [...filteredItems].sort((a, b) => Number(b.type === 'income') - Number(a.type === 'income'))
  const visibleItems = orderedItems.slice(0, visibleCount)
  const groups = (['income', 'expense'] as const)
    .map((groupType) => ({
      type: groupType,
      label: groupType === 'income' ? 'Ganhos' : 'Gastos',
      total: filteredItems.filter((item) => item.type === groupType).length,
      items: visibleItems.filter((item) => item.type === groupType),
    }))
    .filter((group) => group.items.length > 0)
  const remainingCount = filteredItems.length - visibleItems.length
  const hasSecondaryFilters = Boolean(query || type !== 'all' || kind !== 'all')

  const resetVisibleItems = () => setVisibleCount(PAGE_SIZE)
  const clearFilters = () => {
    setQuery('')
    setType('all')
    setKind('all')
    resetVisibleItems()
  }

  return (
    <section className="panel">
      <div className="panel-head">
        <h2>Ganhos e gastos planejados</h2>
        <button type="button" className="btn primary" onClick={onCreate}>Novo item</button>
      </div>

      {items.length === 0 ? (
        <div className="empty">
          <strong>Nada planejado ainda.</strong>
          <span>Comece pelo salário e pelos gastos que se repetem todo mês.</span>
        </div>
      ) : (
        <>
          <div className="chip-row" role="group" aria-label="Situação dos itens">
            <button type="button" className="chip" aria-pressed={scope === 'current'} onClick={() => { setScope('current'); resetVisibleItems() }}>Vigentes ({currentCount})</button>
            <button type="button" className="chip" aria-pressed={scope === 'ended'} onClick={() => { setScope('ended'); resetVisibleItems() }}>Encerrados ({endedCount})</button>
          </div>

          <div className="toolbar pl-filters">
            <label className="field grow"><span>Buscar</span><input type="search" value={query} onChange={(event) => { setQuery(event.target.value); resetVisibleItems() }} placeholder="Título ou categoria" /></label>
            <label className="field"><span>Tipo</span><select value={type} onChange={(event) => { setType(event.target.value as 'all' | TransactionType); resetVisibleItems() }}><option value="all">Todos</option><option value="income">Ganhos</option><option value="expense">Gastos</option></select></label>
            <label className="field"><span>Frequência</span><select value={kind} onChange={(event) => { setKind(event.target.value as 'all' | FinancialItemKind); resetVisibleItems() }}><option value="all">Todas</option><option value="recurring">Todo mês</option><option value="one-time">Uma vez</option></select></label>
            {hasSecondaryFilters && <button type="button" className="btn small" onClick={clearFilters}>Limpar filtros</button>}
          </div>

          {filteredItems.length === 0 ? (
            <div className="empty"><strong>Nenhum item encontrado.</strong><span>Mude a busca ou os filtros.</span></div>
          ) : (
            groups.map((group) => (
            <section key={group.type} className="pl-group" aria-label={group.label}>
              <h3 className={`pl-group-head ${group.type === 'income' ? 'is-income' : 'is-expense'}`}>{group.label} <small>{group.total}</small></h3>
              <ul className="pl-list">
              {group.items.map((item) => {
                const parts = item.installments && item.installments > 1 ? splitInstallments(item.amount, item.installments) : undefined
                return (
                  <li key={item.id} className={`pl-card ${item.type === 'income' ? 'is-income' : 'is-expense'}${scope === 'ended' ? ' is-ended' : ''}`}>
                    <div className="pl-card-top">
                      <span className="pl-icon" aria-hidden="true">{item.type === 'income' ? '↑' : '↓'}</span>
                      <div className="pl-main">
                        <strong>{item.title}</strong>
                        <small className="muted">{describeWhen(item, parts?.length, referenceDate)}</small>
                      </div>
                      <div className="pl-amount">
                        <strong className={`money ${item.type === 'income' ? 'is-income' : 'is-expense'}`}>{item.type === 'income' ? '+' : '−'} {formatCurrency(item.kind === 'recurring' ? amountAt(item, month) : item.amount)}</strong>
                        {parts && <small className="muted">{parts.length}x de {formatCurrency(parts[0])}</small>}
                      </div>
                    </div>
                    <div className="pl-card-foot">
                      <div className="pl-tags">
                        <span className="badge">{item.category}</span>
                        <span className="badge">{item.kind === 'recurring' ? 'Todo mês' : 'Uma vez'}</span>
                        {item.cardId && <span className="badge">{cards.find((card) => card.id === item.cardId)?.name ?? 'Cartão'}</span>}
                      </div>
                      <div className="pl-actions">
                        <button type="button" className="btn small" aria-label={`Editar ${item.title}`} onClick={() => onEdit(item)}>Editar</button>
                        <button type="button" className="btn small danger" aria-label={`Excluir ${item.title}`} onClick={() => setPendingDelete(item)}>Excluir</button>
                      </div>
                    </div>
                  </li>
                )
              })}
              </ul>
            </section>
            ))
          )}

          {remainingCount > 0 && <button type="button" className="btn pl-more" onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}>Mostrar mais ({remainingCount})</button>}
        </>
      )}

      {pendingDelete && (
        <ConfirmDialog
          title="Excluir item?"
          description={`“${pendingDelete.title}” sai do planejamento. Os lançamentos já confirmados dele também somem dos meses.`}
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

function describeWhen(item: FinancialItem, installments: number | undefined, referenceDate: string): string {
  if (item.kind === 'one-time') {
    const date = item.dueDate ? formatDate(item.dueDate) : '—'
    if (!installments || !item.dueDate) return `Uma vez, ${date}`
    const left = Math.min(installments, Math.max(0, installments - monthsBetween(item.dueDate.slice(0, 7), referenceDate.slice(0, 7))))
    return `Compra em ${date} · ${left === 0 ? 'quitada' : left === 1 ? 'falta 1' : `faltam ${left}`}`
  }
  const { dayOfMonth, startMonth, endMonth } = item.recurrence ?? {}
  const from = startMonth ? ` · desde ${formatMonth(startMonth)}` : ''
  return `Todo dia ${dayOfMonth}${from}${endMonth ? ` até ${formatMonth(endMonth)}` : ''}`
}

function formatMonth(month: string): string {
  const [year, monthNumber] = month.split('-')
  return `${monthNumber}/${year}`
}
