import { useState, type FormEvent } from 'react'
import type { FinanceData, OpeningBalance } from '../../types/finance'
import { parseNonNegativeCurrencyToCents } from '../../utils/currency'
import { currentMonth } from '../../utils/date'

interface Props {
  openingBalance: FinanceData['openingBalance']
  onSet: (value: OpeningBalance | null) => void
}

export function OpeningBalancePanel({ openingBalance, onSet }: Props) {
  const [amount, setAmount] = useState(openingBalance ? String(openingBalance.amount / 100).replace('.', ',') : '')
  const [month, setMonth] = useState(openingBalance?.month ?? currentMonth())
  const [error, setError] = useState<string | null>(null)

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const cents = parseNonNegativeCurrencyToCents(amount)
    if (cents === null || !month) return setError('Informe um valor válido, como 1500,00.')
    setError(null)
    onSet({ amount: cents, month })
  }

  const remove = () => {
    setAmount('')
    setError(null)
    onSet(null)
  }

  return (
    <section className="panel data-panel" aria-labelledby="opening-title">
      <div className="panel-head"><h2 id="opening-title">Saldo inicial</h2></div>
      <p className="muted">O dinheiro que você já tinha quando começou. A partir do mês de início, cada mês parte desse valor, soma os ganhos e desconta os gastos.</p>
      <form className="toolbar" onSubmit={submit}>
        <label className="field">Valor (R$)
          <input inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="0,00" />
        </label>
        <label className="field">Mês de início
          <input type="month" value={month} onChange={(event) => setMonth(event.target.value)} />
        </label>
        <button type="submit" className="btn primary">Salvar saldo</button>
        {openingBalance && <button type="button" className="btn" onClick={remove}>Remover</button>}
      </form>
      {error && <p className="backup-error" role="alert">{error}</p>}
    </section>
  )
}
