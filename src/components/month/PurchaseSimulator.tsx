import { useId, useMemo, useState, type FormEvent } from 'react'
import type { CreditCard, FinanceData, FinancialItemDraft } from '../../types/finance'
import { formatCurrency, parseCurrencyToCents } from '../../utils/currency'
import { simulatePurchase } from '../../utils/simulation'
import { monthLabel } from './monthView'

interface PurchaseSimulatorProps {
  data: FinanceData
  categories: string[]
  defaultDate: string
  defaultCategory: string
  cards: CreditCard[]
  /** Card filtered in the list ('' = none). */
  defaultCardId: string
  onAddItem: (draft: FinancialItemDraft) => boolean
}

const HORIZON = 6
const monthName = (month: string) => monthLabel(month).split(' ')[0].toLocaleLowerCase('pt-BR')

export function PurchaseSimulator({ data, categories, defaultDate, defaultCategory, cards, defaultCardId, onAddItem }: PurchaseSimulatorProps) {
  const listId = useId()
  const [title, setTitle] = useState('')
  const [amountText, setAmountText] = useState('')
  const [installments, setInstallments] = useState(1)
  const [date, setDate] = useState(defaultDate)
  // null = follow the category filtered in the list
  const [chosenCategory, setCategory] = useState<string | null>(null)
  const category = chosenCategory ?? defaultCategory
  // null = follow the card filtered in the list; '' = cash or Pix
  const [chosenCard, setCard] = useState<string | null>(null)
  const cardId = chosenCard ?? defaultCardId
  const card = cards.find((item) => item.id === cardId)
  const [note, setNote] = useState('')

  const amount = parseCurrencyToCents(amountText)
  const result = useMemo(
    () => (amount && date
      ? simulatePurchase(data, { title: title || 'Compra', amount, installments, date, category: category || 'Outros', ...(card ? { cardId: card.id } : {}) }, HORIZON)
      : null),
    [data, amount, installments, date, title, category, card],
  )

  let verdict = ''
  let bad = false
  const limit = result?.limit
  const overLimit = limit && limit.after > limit.limit ? limit.after - limit.limit : 0
  if (result) {
    const negative = result.months.find((month) => month.month === result.firstNegativeMonth)
    const worst = result.months.find((month) => month.month === result.worstMonth)
    if (negative) {
      bad = true
      verdict = negative.closingBefore < 0
        ? `${monthLabel(negative.month).split(' ')[0]} já termina negativo sem essa compra. Com ela, fica em −${formatCurrency(-negative.closingAfter)}.`
        : `Não cabe: deixa ${monthName(negative.month)} negativo em ${formatCurrency(-negative.closingAfter)}.`
    } else if (worst) {
      verdict = `Cabe. O mês mais apertado é ${monthName(worst.month)}, que termina com ${formatCurrency(worst.closingAfter)}.`
    }
    if (overLimit) {
      bad = true
      const over = `passa ${formatCurrency(overLimit)} do limite do ${card!.name}.`
      verdict = negative ? `${verdict} E ${over}` : `O saldo aguenta, mas ${over}`
    }
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!amount || !date) return setNote('Informe o valor e a data.')
    if (!title.trim()) return setNote('Dê um nome à compra para registrar.')
    if (!category.trim()) return setNote('Escolha uma categoria.')
    const ok = onAddItem({ title: title.trim(), type: 'expense', kind: 'one-time', amount, category: category.trim(), dueDate: date, installments, ...(card ? { cardId: card.id } : {}) })
    if (!ok) return setNote('')
    setNote('Compra registrada.')
    setTitle('')
    setAmountText('')
    setInstallments(1)
  }

  return (
    <details className="panel simulator">
      <summary><h2>Posso gastar?</h2><small>simule uma compra antes de fazer</small></summary>
      <form className="simulator-form" onSubmit={submit} aria-label="Simular compra">
        <label className="field"><span>Valor total</span><input inputMode="decimal" placeholder="0,00" value={amountText} onChange={(event) => { setAmountText(event.target.value); setNote('') }} /></label>
        <label className="field"><span>Parcelas</span>
          <select value={installments} onChange={(event) => setInstallments(Number(event.target.value))}>
            {Array.from({ length: 24 }, (_, index) => index + 1).map((count) => <option key={count} value={count}>{count === 1 ? 'À vista' : `${count}x`}</option>)}
          </select>
        </label>
        {cards.length > 0 && (
          <label className="field"><span>Pagar com</span>
            <select value={card?.id ?? ''} onChange={(event) => setCard(event.target.value)}>
              <option value="">Dinheiro ou Pix</option>
              {cards.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </label>
        )}
        <label className="field"><span>Data da compra</span><input type="date" value={date} onChange={(event) => setDate(event.target.value)} /></label>
        <label className="field"><span>Categoria</span><input list={listId} value={category} onChange={(event) => setCategory(event.target.value)} placeholder="Ex.: Casa" /></label>
        <datalist id={listId}>{categories.map((name) => <option key={name} value={name} />)}</datalist>
        <label className="field simulator-title"><span>O que é</span><input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Ex.: Geladeira" /></label>

        {result && (
          <>
            {installments > 1 && <p className="simulator-part">{installments}x de {formatCurrency(Math.ceil(amount! / installments))}</p>}
            {limit && card && (
              <p className="simulator-limit">
                Limite do {card.name}: {formatCurrency(limit.before)} → <b className={overLimit ? 'is-expense' : undefined}>{formatCurrency(limit.after)}</b> de {formatCurrency(limit.limit)}
              </p>
            )}
            <p className={`simulator-verdict${bad ? ' is-bad' : ''}`} role="status">{verdict}</p>
            <table className="simulator-table">
              <caption className="sr-only">Saldo previsto no fim de cada mês, sem e com a compra</caption>
              <thead><tr><th scope="col">Mês</th><th scope="col">{card ? 'Na fatura' : 'Parcela'}</th><th scope="col">Saldo no fim</th></tr></thead>
              <tbody>
                {result.months.map((month) => (
                  <tr key={month.month} className={month.closingAfter < 0 ? 'is-negative' : undefined}>
                    <th scope="row">{monthLabel(month.month, 'short')}</th>
                    <td className="money">{month.added ? formatCurrency(month.added) : '–'}</td>
                    <td className="money"><span className="simulator-before">{formatCurrency(month.closingBefore)}</span> → {formatCurrency(month.closingAfter)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
        <div className="simulator-actions">
          <button type="submit" className="btn primary small" disabled={!result}>Registrar essa compra</button>
          {note && <span className="simulator-note" role="status">{note}</span>}
        </div>
      </form>
    </details>
  )
}
