import type { MonthLedger } from '../../utils/ledger'
import { formatCurrency } from '../../utils/currency'

interface MonthSummaryProps {
  ledger: MonthLedger
  onGoToData?: () => void
}

/** Each number of the month appears once, here. */
export function MonthSummary({ ledger, onGoToData }: MonthSummaryProps) {
  const { totals } = ledger
  return (
    <section className="stats month-stats" aria-label="Resumo do mês">
      <div className="stat">
        <span>Saldo que entra</span>
        <strong className="money">{formatCurrency(ledger.opening)}</strong>
        {ledger.openingKnown ? <small>vindo do mês anterior</small> : (
          <small className="month-warn">
            Sem saldo inicial
            {onGoToData && <button type="button" className="stat-action" onClick={onGoToData}>Definir agora <span aria-hidden="true">→</span></button>}
          </small>
        )}
      </div>
      <div className="stat is-income">
        <span>Entradas</span>
        <strong className="money">{formatCurrency(totals.incomeReceived)}</strong>
        <small>recebido de {formatCurrency(totals.incomeExpected)} previsto</small>
      </div>
      <div className="stat">
        <span>Saídas</span>
        <strong className="money">{formatCurrency(totals.expensePaid)}</strong>
        <small>pago de {formatCurrency(totals.expenseExpected)} previsto</small>
      </div>
      <div className={`stat${totals.expensePending ? ' is-warning' : ''}`}>
        <span>Falta pagar</span>
        <strong className="money">{formatCurrency(totals.expensePending)}</strong>
        <small>{totals.incomePending ? `e ${formatCurrency(totals.incomePending)} a receber` : 'nada a receber'}</small>
      </div>
      <div className={`stat${ledger.closingProjected < 0 ? ' is-expense' : ''}`}>
        <span>Saldo previsto no fim do mês</span>
        <strong className="money">{formatCurrency(ledger.closingProjected)}</strong>
        <small>se tudo sair como previsto</small>
      </div>
    </section>
  )
}
