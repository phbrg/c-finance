import { useMemo, useState } from 'react'
import type { FinanceData, FinancialOccurrence, OccurrenceStatus } from '../types/finance'
import type { TransactionType } from '../types/common'
import { DashboardHeader } from '../components/layout/DashboardHeader'
import { OccurrenceList } from '../components/transactions/OccurrenceList'
import { OccurrenceOverview } from '../components/transactions/OccurrenceOverview'
import { filterOccurrences, summarizeOccurrences, type OccurrenceSort } from '../utils/occurrences'

interface TransactionsPageProps {
  data: FinanceData
  month: string
  occurrences: FinancialOccurrence[]
  onMonthChange: (month: string) => void
  onStatusChange: (key: string, status: OccurrenceStatus) => void
  onImport: (content: string) => boolean
}

const PAGE_SIZE = 12

export function TransactionsPage({ data, month, occurrences, onMonthChange, onStatusChange, onImport }: TransactionsPageProps) {
  const [query, setQuery] = useState('')
  const [type, setType] = useState<'all' | TransactionType>('all')
  const [status, setStatus] = useState<'all' | OccurrenceStatus>('all')
  const [category, setCategory] = useState('all')
  const [sort, setSort] = useState<OccurrenceSort>('date')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const categories = useMemo(() => [...new Set(occurrences.map((item) => item.category))].sort(), [occurrences])
  const summary = useMemo(() => summarizeOccurrences(occurrences), [occurrences])
  const filtered = useMemo(
    () => filterOccurrences(occurrences, { query, type, status, category, sort }),
    [occurrences, query, type, status, category, sort],
  )
  const visible = filtered.slice(0, visibleCount)
  const remainingCount = Math.max(filtered.length - visible.length, 0)
  const hasFilters = Boolean(query || type !== 'all' || status !== 'all' || category !== 'all' || sort !== 'date')
  const periodLabel = new Date(`${month}-02T12:00:00`).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  const resetVisible = () => setVisibleCount(PAGE_SIZE)
  const clearFilters = () => {
    setQuery('')
    setType('all')
    setStatus('all')
    setCategory('all')
    setSort('date')
    resetVisible()
  }
  const selectStatus = (nextStatus: 'all' | OccurrenceStatus) => {
    setStatus(nextStatus)
    resetVisible()
  }

  return (
    <div className="transactions-page">
      <DashboardHeader title="Lançamentos" description="Confirme o que realmente entrou e saiu da sua conta." data={data} onImport={onImport} />
      <OccurrenceOverview summary={summary} />

      <section className="workspace-card transactions-card">
        <div className="card-heading transactions-heading">
          <div><span className="overline">Movimentações do período</span><h2>Previsto × realizado</h2><p>Acompanhe cada vencimento e mantenha os status em dia.</p></div>
          <label className="field transaction-month-field"><span>Mês analisado</span><input type="month" value={month} onChange={(event) => { onMonthChange(event.target.value); setCategory('all'); resetVisible() }} /></label>
        </div>

        <div className="transaction-period-label"><span>Período atual</span><strong>{periodLabel}</strong></div>

        <div className="transaction-status-tabs" role="group" aria-label="Filtrar por situação">
          <button type="button" className={status === 'all' ? 'active' : ''} aria-pressed={status === 'all'} onClick={() => selectStatus('all')}>Todos <span>{occurrences.length}</span></button>
          <button type="button" className={status === 'planned' ? 'active planned' : ''} aria-pressed={status === 'planned'} onClick={() => selectStatus('planned')}>Pendentes <span>{summary.statusCounts.planned}</span></button>
          <button type="button" className={status === 'completed' ? 'active completed' : ''} aria-pressed={status === 'completed'} onClick={() => selectStatus('completed')}>Confirmados <span>{summary.statusCounts.completed}</span></button>
          <button type="button" className={status === 'skipped' ? 'active skipped' : ''} aria-pressed={status === 'skipped'} onClick={() => selectStatus('skipped')}>Ignorados <span>{summary.statusCounts.skipped}</span></button>
        </div>

        <div className="transaction-filter-grid">
          <label className="transaction-search"><span className="sr-only">Buscar lançamento</span><i aria-hidden="true">⌕</i><input type="search" value={query} onChange={(event) => { setQuery(event.target.value); resetVisible() }} placeholder="Buscar por título ou categoria" /></label>
          <label className="field"><span>Tipo</span><select value={type} onChange={(event) => { setType(event.target.value as typeof type); resetVisible() }}><option value="all">Todos</option><option value="income">Ganhos</option><option value="expense">Gastos</option></select></label>
          <label className="field"><span>Categoria</span><select value={category} onChange={(event) => { setCategory(event.target.value); resetVisible() }}><option value="all">Todas</option>{categories.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
          <label className="field"><span>Ordenar</span><select value={sort} onChange={(event) => { setSort(event.target.value as OccurrenceSort); resetVisible() }}><option value="date">Por data</option><option value="pending-first">Pendências primeiro</option><option value="amount">Maior valor</option></select></label>
        </div>

        <div className="transaction-results-meta"><span>{filtered.length} {filtered.length === 1 ? 'lançamento encontrado' : 'lançamentos encontrados'}</span>{hasFilters && <button type="button" onClick={clearFilters}>Limpar filtros</button>}</div>

        <OccurrenceList
          occurrences={visible}
          onStatusChange={onStatusChange}
          emptyTitle={occurrences.length === 0 ? 'Nenhum lançamento neste mês.' : 'Nenhum lançamento encontrado.'}
          emptyDescription={occurrences.length === 0 ? 'Adicione itens no Planejamento para começar.' : 'Tente ajustar a busca ou os filtros selecionados.'}
        />
        {remainingCount > 0 && <button type="button" className="transaction-show-more" onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}>Mostrar mais <span>{Math.min(remainingCount, PAGE_SIZE)} de {remainingCount}</span></button>}
      </section>
    </div>
  )
}
