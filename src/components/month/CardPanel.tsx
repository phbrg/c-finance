import type { FinanceData, FinancialOccurrence } from '../../types/finance'
import { cardSummary } from '../../utils/ledger'
import { formatCurrency } from '../../utils/currency'
import { monthLabel } from './monthView'

interface CardPanelProps {
  data: FinanceData
  cardId: string
  month: string
  today: string
  /** Invoice of this card in the open month, from the month list. */
  invoice?: FinancialOccurrence
}

const shortDate = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`

/** The essentials of one card in the open month: its invoice and how much of the limit is taken. */
export function CardPanel({ data, cardId, month, today, invoice }: CardPanelProps) {
  const summary = cardSummary(data, cardId, today)
  if (!summary) return null
  const { card } = summary
  const monthName = monthLabel(month).split(' ')[0].toLocaleLowerCase('pt-BR')

  return (
    <section className="panel card-panel" aria-label={`Fatura do ${card.name}`}>
      <div className="panel-head">
        <h2>Fatura do {card.name}</h2>
        <small>paga dia {card.dueDay}</small>
      </div>
      <div className="card-panel-body">
        <div className="card-fact">
          <span>Fatura de {monthName}</span>
          {invoice ? (
            <>
              <strong className="money">{formatCurrency(invoice.amount)}</strong>
              <small>
                {invoice.status === 'completed' ? <span className="badge income">Paga</span>
                  : invoice.status === 'skipped' ? <span className="badge">Ignorada</span>
                    : invoice.dueDate < today ? <span className="badge expense">Atrasada</span>
                      : <span className="badge warning">A pagar</span>}
                {' '}dia {shortDate(invoice.dueDate)}
              </small>
            </>
          ) : <><strong className="money">{formatCurrency(0)}</strong><small>nenhuma compra em {monthName}</small></>}
        </div>

        <div className="card-fact">
          <span>Limite usado</span>
          <strong className="money">{formatCurrency(summary.used)}</strong>
          {summary.available !== undefined && card.limit ? (
            <>
              <span className={`card-limit${(summary.limitPct ?? 0) >= 90 ? ' is-high' : ''}`} role="meter" aria-label="Limite usado"
                aria-valuemin={0} aria-valuemax={card.limit} aria-valuenow={Math.min(summary.used, card.limit)}>
                <span style={{ width: `${Math.min(100, summary.limitPct ?? 0)}%` }} />
              </span>
              <small>{summary.available < 0 ? `passou ${formatCurrency(-summary.available)} do limite` : `${formatCurrency(summary.available)} livres de ${formatCurrency(card.limit)}`}</small>
            </>
          ) : <small>sem limite cadastrado</small>}
        </div>
      </div>
    </section>
  )
}
