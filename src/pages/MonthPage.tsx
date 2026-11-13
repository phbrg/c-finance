import { useMemo, useState } from 'react'
import { CategoryBars } from '../components/charts/CategoryBars'
import { FlowChart, type FlowPoint } from '../components/charts/FlowChart'
import { MonthBars } from '../components/charts/MonthBars'
import { CardPanel } from '../components/month/CardPanel'
import { MonthSummary } from '../components/month/MonthSummary'
import { MovementBlock } from '../components/month/MovementBlock'
import type { StatusChange } from '../components/month/MovementRow'
import { PurchaseSimulator } from '../components/month/PurchaseSimulator'
import {
  applyFilters, dayLabel, invoiceBars, matchesFilters, monthLabel, noFilters, selectionTotals, signed, signedMoney,
  type GroupBy, type MonthFilters, type SortBy,
} from '../components/month/monthView'
import type { FinanceData, FinancialItemDraft, FinancialOccurrence } from '../types/finance'
import { formatCurrency } from '../utils/currency'
import { currentMonth, today } from '../utils/date'
import { categoryBreakdown, dailySeries, invoiceSeries, monthLedger, monthsSeries } from '../utils/ledger'
import { addMonth } from '../utils/recurrence'

interface MonthPageProps {
  data: FinanceData
  month: string
  onMonthChange: (month: string) => void
  onStatusChange: StatusChange
  onAddItem: (draft: FinancialItemDraft) => boolean
  onGoToData?: () => void
}

export function MonthPage({ data, month, onMonthChange, onStatusChange, onAddItem, onGoToData }: MonthPageProps) {
  const [filters, setFilters] = useState<MonthFilters>(noFilters)
  const [groupBy, setGroupBy] = useState<GroupBy>('day')
  const [sortBy, setSortBy] = useState<SortBy>('date')
  const [selected, setSelected] = useState<Set<string>>(() => new Set())
  // Invoice rows opened or closed by hand; otherwise they follow the filters.
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const todayDate = today()

  const ledger = useMemo(() => monthLedger(data, month), [data, month])
  const visible = useMemo(() => applyFilters(ledger.entries, filters), [ledger, filters])
  const filtered = JSON.stringify(filters) !== JSON.stringify(noFilters)
  const categoryTotal = visible.reduce((total, entry) => total + signed(entry), 0)
  const cards = data.cards
  const cardById = useMemo(() => new Map(cards.map((card) => [card.id, card])), [cards])
  const card = cardById.get(filters.card)
  // Purchases of each invoice of the month as rows; they follow the invoice's status, not their own.
  const invoiceLines = useMemo(() => new Map(ledger.entries.flatMap((entry) => entry.invoice ? [[entry.key, applyFilters(entry.invoice.lines.map((line) => ({
    key: `${entry.key}|${line.itemId}|${line.date}`,
    itemId: line.itemId,
    title: line.title,
    type: 'expense' as const,
    kind: 'one-time' as const,
    amount: line.amount,
    plannedAmount: line.amount,
    category: line.category,
    dueDate: line.date,
    status: 'planned' as const,
    cardId: entry.invoice!.cardId,
    ...(line.installment ? { installment: line.installment } : {}),
  })), { ...filters, status: 'all' })] as const] : [])), [ledger, filters])
  // What moves the balance, invoices included; card purchases only show inside their invoice.
  const cash = visible.filter((entry) => !entry.cardId || !cardById.has(entry.cardId))
  // An invoice that does not match the filters still shows when some of its purchases do.
  const holders = ledger.entries.filter((entry) => entry.invoice && !cash.includes(entry) && invoiceLines.get(entry.key)!.length > 0
    && matchesFilters(entry, { ...filters, query: '', category: '', day: null }))
  const rows = [...cash, ...holders]
  const cashTotals = selectionTotals(cash, new Set(cash.filter((entry) => entry.status !== 'skipped').map((entry) => entry.key)))
  const linesFiltered = Boolean(filters.card || filters.query || filters.category || filters.day)
  const isExpanded = (key: string) => expanded[key] ?? linesFiltered
  const openLines = rows.filter((entry) => entry.invoice && isExpanded(entry.key)).flatMap((entry) => invoiceLines.get(entry.key)!)
  const invoiceOf = (key: string) => key.split('|')[0]
  // A charge whose whole invoice is selected is already in the sum.
  const totals = selectionTotals([...rows, ...openLines.filter((line) => !selected.has(invoiceOf(line.key)))], selected)
  const shownCount = rows.length + openLines.length

  // 2 months back to 6 ahead of today; the window follows the open month only when it falls outside.
  const now = currentMonth()
  const seriesStart = month >= addMonth(now, -2) && month <= addMonth(now, 6) ? addMonth(now, -2) : addMonth(month, -2)
  // The chart follows the list filters, except day and status, which only make sense inside one month.
  const { query, type, category } = filters
  const seriesFiltered = Boolean(query || category || type !== 'all')
  const series = useMemo(() => {
    const seriesFilters: MonthFilters = { ...noFilters, query, type, category }
    return monthsSeries(data, seriesStart, 9, seriesFiltered ? (entry) => matchesFilters(entry, seriesFilters) : undefined)
  }, [data, seriesStart, seriesFiltered, query, type, category])
  const cardSeries = useMemo(() => (card ? invoiceSeries(data, card.id, seriesStart, 9) : []), [data, card, seriesStart])
  const seriesTone = type === 'income' || (type === 'all' && !series.some((point) => point.expense)) ? 'income' : 'expense'

  const categories = useMemo(() => [...new Set(ledger.entries.map((entry) => entry.category))]
    .sort((first, second) => first.localeCompare(second, 'pt-BR')), [ledger])
  const allCategories = useMemo(() => [...new Set(data.items.map((item) => item.category))]
    .sort((first, second) => first.localeCompare(second, 'pt-BR')), [data.items])
  const categoryTotals = useMemo(() => categoryBreakdown(applyFilters(ledger.entries, { ...filters, category: '' })), [ledger, filters])

  const days = useMemo(() => {
    const account = dailySeries(ledger.entries, month, ledger.opening)
    const shown = applyFilters(ledger.entries, { ...filters, day: null })
    // With a card picked, the bars show its purchases on the day they were made (cash only moves with the invoice).
    const flow = card ? shown.filter((entry) => !entry.invoice).map((entry) => ({ ...entry, cardId: undefined })) : shown
    return dailySeries(flow, month).map((point, index): FlowPoint & { entries: FinancialOccurrence[] } => ({
      key: String(point.day),
      label: point.day === 1 || point.day % 5 === 0 ? String(point.day) : '',
      name: `${dayLabel(point.date)}: entradas ${formatCurrency(point.income)}, saídas ${formatCurrency(point.expense)}, saldo ${formatCurrency(account[index].balance)}`,
      income: point.income,
      expense: point.expense,
      balance: account[index].balance,
      entries: point.entries,
    }))
  }, [ledger, filters, month, card])
  const hasFlow = days.some((point) => point.income || point.expense)

  const set = (patch: Partial<MonthFilters>) => setFilters((current) => ({ ...current, ...patch }))
  const changeMonth = (next: string) => {
    setSelected(new Set())
    set({ day: null })
    onMonthChange(next)
  }
  // An invoice and its own charges are never selected together, so nothing is summed twice.
  const toggle = (id: string) => setSelected((current) => {
    const next = new Set(current)
    if (next.delete(id)) return next
    next.add(id)
    if (id.includes('|')) next.delete(invoiceOf(id))
    current.forEach((key) => key !== id && invoiceOf(key) === id && next.delete(key))
    return next
  })
  const rowProps = { sortBy, today: todayDate, selected, onToggle: toggle, onStatusChange }
  const selectable = [...cash, ...openLines.filter((line) => !cash.some((entry) => entry.key === invoiceOf(line.key)))]
  const allSelected = selectable.length > 0 && selectable.every((entry) => selected.has(entry.key))
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(selectable.map((entry) => entry.key)))
  const confirmable = cash.filter((entry) => selected.has(entry.key) && entry.status !== 'completed')
  const confirmSelected = () => {
    confirmable.forEach((entry) => onStatusChange(entry.key, 'completed'))
    setSelected(new Set())
  }
  const statusCount = (status: MonthFilters['status']) => applyFilters(ledger.entries, { ...filters, status }).length

  return (
    <div className="page month-page">
      <header className="page-header">
        <nav className="month-nav" aria-label="Mês">
          <button type="button" className="btn ghost" onClick={() => changeMonth(addMonth(month, -1))} aria-label="Mês anterior"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6l-6 6 6 6" /></svg></button>
          <h1><strong>{monthLabel(month)}</strong></h1>
          <button type="button" className="btn ghost" onClick={() => changeMonth(addMonth(month, 1))} aria-label="Próximo mês"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg></button>
          {month !== currentMonth() && <button type="button" className="btn small" onClick={() => changeMonth(currentMonth())}>Mês atual</button>}
        </nav>
      </header>

      <MonthSummary ledger={ledger} onGoToData={onGoToData} />

      <section className="month-filters" aria-label="Filtros">
        <div className="toolbar">
          <label className="field grow"><span>Buscar</span><input type="search" value={filters.query} onChange={(event) => set({ query: event.target.value })} placeholder="Título ou categoria" /></label>
          <label className="field"><span>Categoria</span>
            <select value={filters.category} onChange={(event) => set({ category: event.target.value })}>
              <option value="">Todas</option>
              {categories.map((category) => <option key={category} value={category}>{category}</option>)}
            </select>
          </label>
          {cards.length > 0 && (
            <label className="field"><span>Cartão</span>
              <select value={filters.card} onChange={(event) => {
                set({ card: event.target.value })
                setExpanded({})
              }}>
                <option value="">Todos</option>
                {cards.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
            </label>
          )}
          <label className="field"><span>Agrupar por</span>
            <select value={groupBy} onChange={(event) => setGroupBy(event.target.value as GroupBy)}>
              <option value="day">Dia</option><option value="category">Categoria</option><option value="none">Nada</option>
            </select>
          </label>
          <label className="field"><span>Ordenar por</span>
            <select value={sortBy} onChange={(event) => setSortBy(event.target.value as SortBy)}>
              <option value="date">Data</option><option value="amount">Maior valor</option>
            </select>
          </label>
        </div>
        <div className="chip-row">
          <div className="chip-group" role="group" aria-label="Tipo">
            {([['all', 'Tudo'], ['income', 'Entradas'], ['expense', 'Saídas']] as const).map(([value, text]) => (
              <button key={value} type="button" className="chip" aria-pressed={filters.type === value} onClick={() => set({ type: value })}>{text}</button>
            ))}
          </div>
          <div className="chip-group" role="group" aria-label="Situação">
            {([['all', 'Todos'], ['planned', 'Pendentes'], ['completed', 'Confirmados'], ['skipped', 'Ignorados']] as const).map(([value, text]) => (
              <button key={value} type="button" className="chip" aria-pressed={filters.status === value} onClick={() => set({ status: value })}>{text} <span className="chip-count">{statusCount(value)}</span></button>
            ))}
          </div>
          {filters.day && <button type="button" className="chip active" onClick={() => set({ day: null })} aria-label={`Remover filtro do dia ${filters.day}`}>Dia {filters.day} ×</button>}
          {filters.category && <button type="button" className="chip active" onClick={() => set({ category: '' })} aria-label={`Remover filtro ${filters.category}`}>{filters.category} ×</button>}
          {card && <button type="button" className="chip active" onClick={() => set({ card: '' })} aria-label={`Remover filtro do cartão ${card.name}`}>{card.name} ×</button>}
          {filtered && <button type="button" className="btn small ghost" onClick={() => setFilters(noFilters)}>Limpar filtros</button>}
        </div>
      </section>

      {card && (
        <CardPanel
          data={data}
          cardId={card.id}
          month={month}
          today={todayDate}
          invoice={ledger.entries.find((entry) => entry.invoice?.cardId === card.id)}
        />
      )}

      <section className="panel">
        <div className="panel-head">
          <h2>{card ? `Compras no ${card.name} por dia` : 'Dia a dia'}</h2>
          <small>{filters.day ? 'Clique de novo no dia para ver o mês todo' : 'Clique num dia para ver só ele na lista'}</small>
        </div>
        {hasFlow ? (
          <FlowChart
            points={days}
            label={`Entradas e saídas por dia em ${monthLabel(month)}, com o saldo da conta`}
            balanceLabel="Saldo"
            selected={filters.day ? String(filters.day) : null}
            marker={todayDate.startsWith(month) ? { key: String(Number(todayDate.slice(8))), label: 'hoje' } : undefined}
            onSelect={(key) => set({ day: filters.day === Number(key) ? null : Number(key) })}
            tooltip={(point) => {
              const items = days[Number(point.key) - 1].entries.filter((entry) => !entry.cardId)
              return (
                <>
                  <strong className="tip-title">{dayLabel(`${month}-${point.key.padStart(2, '0')}`)}</strong>
                  {items.slice(0, 6).map((entry) => (
                    <span key={entry.key} className={`tip-row${entry.status === 'skipped' ? ' is-skipped' : ''}`}><span>{entry.title}</span><span className={`money${entry.type === 'income' ? ' is-income' : ''}`}>{entry.type === 'income' ? '+' : '−'} {formatCurrency(entry.amount)}</span></span>
                  ))}
                  {items.length > 6 && <span className="muted">e mais {items.length - 6}</span>}
                  {items.length === 0 && <span className="muted">Nada neste dia</span>}
                  <span className="tip-row tip-total"><span>Saldo no fim do dia</span><span className="money">{formatCurrency(point.balance)}</span></span>
                </>
              )
            }}
          />
        ) : <p className="empty">Nenhuma entrada ou saída com esses filtros.</p>}
        <p className="flow-legend" aria-hidden="true"><i className="is-income" /> Entradas <i className="is-expense" /> Saídas <i className="is-balance" /> Saldo da conta</p>
      </section>

      <div className="grid-main-side month-body">
        <section className="panel month-list" aria-label="Movimentos do mês">
          <div className="panel-head mv-head">
            <h2>Movimentações <small>{shownCount} {shownCount === 1 ? 'movimento' : 'movimentos'}</small></h2>
            <label className="mv-all">
              <input type="checkbox" className="mv-check" checked={allSelected} onChange={toggleAll} disabled={selectable.length === 0} />
              <span>Selecionar todos<span className="sr-only"> visíveis</span></span>
            </label>
          </div>
          {filters.category && visible.length > 0 && (
            <p className="month-category-total" aria-live="polite">
              <span>{filters.category} em {monthLabel(month).split(' ')[0].toLocaleLowerCase('pt-BR')}:</span>{' '}
              <strong className="money">{formatCurrency(Math.abs(categoryTotal))}</strong>{' '}
              <small>· {visible.length} {visible.length === 1 ? 'lançamento' : 'lançamentos'}</small>
            </p>
          )}
          {rows.length === 0 ? (
            <p className="empty">{ledger.entries.length ? 'Nada com esses filtros.' : 'Nada previsto para este mês. Cadastre ganhos e gastos em Planejamento.'}</p>
          ) : (
            <MovementBlock
              {...rowProps}
              groupBy={groupBy}
              label="Entradas e saídas"
              entries={rows}
              invoiceLines={invoiceLines}
              isExpanded={isExpanded}
              onExpand={(key, open) => setExpanded((current) => ({ ...current, [key]: open }))}
              head={(
                <>
                  <div><h3>Entradas e saídas</h3><small>o que mexe no saldo</small></div>
                  <p className="mv-block-total">
                    {cashTotals.income > 0 && <span className="money is-income">+ {formatCurrency(cashTotals.income)}</span>}
                    {cashTotals.expense > 0 && <span className="money">− {formatCurrency(cashTotals.expense)}</span>}
                  </p>
                </>
              )}
            />
          )}
          {totals.count > 0 && (
            <div className="selection-bar" role="region" aria-label="Soma da seleção">
              <p aria-live="polite">
                <strong>{totals.count} {totals.count === 1 ? 'selecionado' : 'selecionados'}</strong>
                <span>Entradas <b className="money is-income">{formatCurrency(totals.income)}</b></span>
                <span>Saídas <b className="money">{formatCurrency(totals.expense)}</b></span>
                <span>Total líquido <b className="money">{signedMoney(totals.net)}</b></span>
              </p>
              <div className="selection-actions">
                <button type="button" className="btn small primary" disabled={confirmable.length === 0} onClick={confirmSelected}>Confirmar selecionados</button>
                <button type="button" className="btn small" onClick={() => setSelected(new Set())}>Limpar</button>
              </div>
            </div>
          )}
        </section>

        <aside className="month-side">
          <PurchaseSimulator
            data={data}
            categories={allCategories}
            defaultDate={todayDate.startsWith(month) ? todayDate : `${month}-01`}
            defaultCategory={category}
            cards={cards}
            defaultCardId={filters.card}
            onAddItem={onAddItem}
          />
          <section className="panel">
            <div className="panel-head"><h2>Para onde foi</h2><small>clique para filtrar</small></div>
            <CategoryBars totals={categoryTotals} selected={filters.category} onSelect={(category) => set({ category: filters.category === category ? '' : category })} />
          </section>
          <section className="panel">
            <div className="panel-head">
              <h2>Meses</h2>
              <small>{card ? `faturas do ${card.name}` : seriesFiltered ? (category || 'com os filtros da lista') : 'clique para abrir o mês'}</small>
            </div>
            {card ? (
              <MonthBars
                bars={invoiceBars(cardSeries)}
                label={`Fatura do ${card.name} por mês`}
                tone="expense"
                selected={month}
                onSelect={(key) => key !== month && changeMonth(key)}
              />
            ) : seriesFiltered ? (
              <MonthBars
                bars={series.map((point) => {
                  const value = seriesTone === 'expense' ? point.expense : point.income
                  return { key: point.month, label: monthLabel(point.month, 'short'), name: `${monthLabel(point.month)}: ${formatCurrency(value)}`, value }
                })}
                label={`Total por mês ${category ? `em ${category}` : 'com os filtros da lista'}`}
                tone={seriesTone}
                selected={month}
                onSelect={(key) => key !== month && changeMonth(key)}
              />
            ) : (
              <FlowChart
                points={series.map((point) => ({
                  key: point.month,
                  label: monthLabel(point.month, 'short'),
                  name: `${monthLabel(point.month)}: entradas ${formatCurrency(point.income)}, saídas ${formatCurrency(point.expense)}, termina em ${formatCurrency(point.closing)}`,
                  income: point.income,
                  expense: point.expense,
                  balance: point.closing,
                }))}
                label="Entradas, saídas e saldo no fim do mês, de dois meses atrás até seis meses à frente"
                balanceLabel="Saldo"
                flowLabel="Fluxo do mês"
                selected={month}
                marker={month !== now ? { key: now, label: 'hoje' } : undefined}
                onSelect={(key) => key !== month && changeMonth(key)}
                tooltip={(point) => (
                  <>
                    <strong className="tip-title">{monthLabel(point.key)}</strong>
                    <span className="tip-row"><span>Entradas</span><span className="money is-income">{formatCurrency(point.income)}</span></span>
                    <span className="tip-row"><span>Saídas</span><span className="money">{formatCurrency(point.expense)}</span></span>
                    <span className="tip-row tip-total"><span>Saldo no fim</span><span className="money">{formatCurrency(point.balance)}</span></span>
                  </>
                )}
              />
            )}
          </section>
        </aside>
      </div>
    </div>
  )
}
