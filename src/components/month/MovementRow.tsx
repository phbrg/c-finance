import { useState, type FormEvent } from 'react'
import type { FinancialOccurrence, OccurrenceStatus } from '../../types/finance'
import { formatCurrency, parseNonNegativeCurrencyToCents } from '../../utils/currency'
import { formatDate } from '../../utils/date'
import { dayLabel, groupEntries, type SortBy } from './monthView'

export type StatusChange = (key: string, status: OccurrenceStatus, details?: { amount?: number; paidDate?: string }) => void

interface MovementRowProps {
  entry: FinancialOccurrence
  /** On an invoice row: its purchases that pass the filters, listed inside it when expanded. */
  lines?: FinancialOccurrence[]
  expanded?: boolean
  onExpand?: (open: boolean) => void
  sortBy?: SortBy
  today: string
  selected: ReadonlySet<string>
  onToggle: (id: string) => void
  onStatusChange: StatusChange
}

const sign = (entry: Pick<FinancialOccurrence, 'type'>) => (entry.type === 'income' ? '+' : '−')
const dateText = (iso: string, options: Intl.DateTimeFormatOptions) => new Date(`${iso}T12:00:00`).toLocaleDateString('pt-BR', options).replace('.', '')

export function CardIcon() {
  return (
    <svg className="mv-icon" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <rect x="2.5" y="5" width="19" height="14" rx="2.5" /><path d="M2.5 10h19M6.5 15h4" />
    </svg>
  )
}

export function StatusBadge({ entry, today }: { entry: FinancialOccurrence; today: string }) {
  if (entry.status === 'completed') return <span className="badge income">{entry.invoice ? 'Paga' : entry.type === 'income' ? 'Recebido' : 'Pago'}</span>
  if (entry.status === 'skipped') return <span className="badge">Ignorado</span>
  if (entry.dueDate < today) return <span className="badge expense">Atrasado</span>
  return <span className="badge warning">Pendente</span>
}

export function MovementRow({ entry, lines, expanded = false, onExpand, sortBy = 'date', today, selected, onToggle, onStatusChange }: MovementRowProps) {
  const [open, setOpen] = useState(false)
  const isSelected = selected.has(entry.key)
  const part = entry.installment
  const invoice = entry.invoice
  // A card purchase is settled by its invoice, so it has nothing to confirm.
  const onCard = Boolean(entry.cardId)
  const count = invoice?.lines.length ?? 0
  const shown = lines ?? []
  const filteredOut = Boolean(invoice && lines && lines.length !== count)
  const listId = `compras-${entry.key.replace(/[^a-z0-9-]/gi, '-')}`

  return (
    <li className={`mv-row is-${onCard ? 'on-card' : entry.status}${invoice ? ' is-invoice' : ''}${isSelected ? ' is-selected' : ''}`}>
      <div className="mv-line">
        <input type="checkbox" className="mv-check" checked={isSelected} onChange={() => onToggle(entry.key)} aria-label={`Selecionar ${entry.title}`} />
        <time className="mv-day" dateTime={entry.dueDate} aria-label={dayLabel(entry.dueDate)}>
          <b>{entry.dueDate.slice(8, 10)}</b>
          <small>{dateText(entry.dueDate, { weekday: 'short' })}</small>
        </time>
        <div className="mv-main">
          <span className="mv-title">
            {invoice && onExpand ? (
              <button type="button" className="mv-expand" aria-expanded={expanded} aria-controls={listId} onClick={() => onExpand(!expanded)}>
                <CardIcon /><span className="mv-name">{entry.title}</span>
                <svg className="mv-chevron" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m4 6 4 4 4-4" /></svg>
              </button>
            ) : <>{invoice && <CardIcon />}<span className="mv-name">{entry.title}</span></>}
            {part && <span className="mv-part" title={`Parcela ${part.number} de ${part.total}`}>{part.number}/{part.total}</span>}
          </span>
          <span className="mv-meta">
            {invoice
              ? filteredOut
                ? `${shown.length} de ${count} compras · ${formatCurrency(shown.reduce((total, line) => total + line.amount, 0))}`
                : `${count} ${count === 1 ? 'compra' : 'compras'}`
              : entry.category}
            {entry.paidDate && entry.paidDate !== entry.dueDate && ` · em ${formatDate(entry.paidDate).slice(0, 5)}`}
          </span>
        </div>
        <span className="mv-status">{!onCard && <StatusBadge entry={entry} today={today} />}</span>
        <span className={`mv-amount money${entry.type === 'income' ? ' is-income' : ''}`}>
          {sign(entry)} {formatCurrency(entry.amount)}
          {entry.status === 'completed' && entry.amount !== entry.plannedAmount && <small>previsto {formatCurrency(entry.plannedAmount)}</small>}
        </span>
        <span className="mv-actions">
          {!onCard && entry.status !== 'completed' && (
            <button type="button" className="btn small" onClick={() => onStatusChange(entry.key, 'completed')} aria-label={`Confirmar ${entry.title}`}>Confirmar</button>
          )}
          {invoice && entry.status === 'completed' && (
            <button type="button" className="btn small ghost" onClick={() => onStatusChange(entry.key, 'planned')} aria-label={`Desfazer pagamento de ${entry.title}`}>Desfazer</button>
          )}
          {!onCard && <button type="button" className="btn small ghost mv-more" aria-expanded={open} aria-label={`Mais opções de ${entry.title}`} onClick={() => setOpen(!open)}>⋯</button>}
        </span>
      </div>

      {open && <RowEditor entry={entry} onDone={() => setOpen(false)} onStatusChange={onStatusChange} />}
      {invoice && onExpand && expanded && (
        <ul id={listId} className="mv-list mv-sublist" aria-label={`Compras da ${entry.title}`}>
          {groupEntries(shown, 'none', sortBy)[0].entries.map((line) => (
            <MovementRow key={line.key} entry={line} today={today} selected={selected} onToggle={onToggle} onStatusChange={onStatusChange} />
          ))}
          {shown.length === 0 && <li className="mv-sub-empty">{count ? 'Nenhuma compra com esses filtros.' : 'Nenhuma compra neste mês.'}</li>}
        </ul>
      )}
    </li>
  )
}

function RowEditor({ entry, onDone, onStatusChange }: { entry: FinancialOccurrence; onDone: () => void; onStatusChange: StatusChange }) {
  const [amount, setAmount] = useState((entry.amount / 100).toFixed(2).replace('.', ','))
  const [date, setDate] = useState(entry.paidDate ?? entry.dueDate)
  const [error, setError] = useState('')

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const cents = parseNonNegativeCurrencyToCents(amount)
    if (cents === null) return setError('Valor inválido. Use algo como 123,45.')
    if (!date) return setError('Informe a data.')
    onStatusChange(entry.key, 'completed', { amount: cents, paidDate: date })
    onDone()
  }
  const set = (status: OccurrenceStatus) => {
    onStatusChange(entry.key, status)
    onDone()
  }

  return (
    <form className="mv-editor" onSubmit={submit} aria-label={`Confirmar ${entry.title} com valor real`}>
      <label className="field"><span>{entry.invoice ? 'Valor pago' : 'Valor real'}</span><input inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} /></label>
      <label className="field"><span>{entry.invoice ? 'Pago em' : 'Data real'}</span><input type="date" value={date} onChange={(event) => setDate(event.target.value)} /></label>
      <button type="submit" className="btn primary small">{entry.status === 'completed' ? 'Salvar' : 'Confirmar'}</button>
      {entry.status !== 'planned' && <button type="button" className="btn small" onClick={() => set('planned')}>Voltar a pendente</button>}
      {entry.status !== 'skipped' && <button type="button" className="btn small ghost" onClick={() => set('skipped')}>Ignorar este mês</button>}
      {error && <p className="mv-error" role="alert">{error}</p>}
    </form>
  )
}
