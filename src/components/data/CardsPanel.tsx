import { useRef, useState, type FormEvent } from 'react'
import type { CreditCard, CreditCardDraft } from '../../types/finance'
import { formatCurrency, parseNonNegativeCurrencyToCents } from '../../utils/currency'
import { ConfirmDialog } from '../ConfirmDialog'

interface Props {
  cards: CreditCard[]
  onAdd: (draft: CreditCardDraft) => boolean
  onUpdate: (id: string, draft: CreditCardDraft) => boolean
  onDelete: (id: string) => void
}

const emptyForm = { name: '', dueDay: '', limit: '' }
const validDay = (value: string) => Number.isInteger(Number(value)) && Number(value) >= 1 && Number(value) <= 31

export function CardsPanel({ cards, onAdd, onUpdate, onDelete }: Props) {
  const [form, setForm] = useState(emptyForm)
  const [editing, setEditing] = useState<CreditCard | null>(null)
  const [pendingDelete, setPendingDelete] = useState<CreditCard | null>(null)
  const [error, setError] = useState<string | null>(null)
  const nameRef = useRef<HTMLInputElement>(null)

  const reset = () => {
    setForm(emptyForm)
    setEditing(null)
    setError(null)
  }

  const edit = (card: CreditCard) => {
    setEditing(card)
    setError(null)
    setForm({
      name: card.name,
      dueDay: String(card.dueDay),
      limit: card.limit ? (card.limit / 100).toFixed(2).replace('.', ',') : '',
    })
    // the form sits below the list; on small screens it is out of view
    nameRef.current?.focus()
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const limit = form.limit.trim() ? parseNonNegativeCurrencyToCents(form.limit) : undefined
    if (!form.name.trim()) return setError('Dê um nome ao cartão.')
    if (!validDay(form.dueDay)) return setError('O dia do pagamento vai de 1 a 31.')
    if (limit === null) return setError('Informe o limite como 5000,00 ou deixe em branco.')
    const draft: CreditCardDraft = { name: form.name.trim(), dueDay: Number(form.dueDay), ...(limit ? { limit } : {}) }
    if (editing ? onUpdate(editing.id, draft) : onAdd(draft)) reset()
  }

  return (
    <section className="panel data-panel" aria-labelledby="cards-title">
      <div className="panel-head">
        <h2 id="cards-title">Cartões</h2>
        <small>A fatura cai no saldo no dia do pagamento.</small>
      </div>
      {cards.length === 0 ? (
        <p className="data-empty">Nenhum cartão ainda. Cadastre um aqui embaixo e escolha ele em Pago com ao lançar um gasto.</p>
      ) : (
        <ul className="card-list">
          {cards.map((card) => (
            <li key={card.id} className="card-row">
              <span className="card-chip" aria-hidden="true">{card.name.charAt(0).toUpperCase()}</span>
              <div className="card-info">
                <strong>{card.name}</strong>
                <small className="muted">Paga dia {card.dueDay}{card.limit ? ` · limite ${formatCurrency(card.limit)}` : ''}</small>
              </div>
              <div className="card-actions">
                <button type="button" className="btn small" aria-label={`Editar ${card.name}`} onClick={() => edit(card)}>Editar</button>
                <button type="button" className="btn small danger" aria-label={`Excluir ${card.name}`} onClick={() => setPendingDelete(card)}>Excluir</button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <form className="card-form" onSubmit={submit} noValidate aria-labelledby="card-form-title">
        <h3 id="card-form-title">{editing ? `Editar ${editing.name}` : 'Novo cartão'}</h3>
        <label className="field">Nome do cartão
          <input ref={nameRef} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Ex.: Nubank" />
        </label>
        <label className="field">Dia do pagamento
          <input type="number" min="1" max="31" value={form.dueDay} onChange={(event) => setForm({ ...form, dueDay: event.target.value })} />
        </label>
        <label className="field">Limite (R$, opcional)
          <input inputMode="decimal" value={form.limit} onChange={(event) => setForm({ ...form, limit: event.target.value })} placeholder="0,00" />
        </label>
        <div className="card-form-actions">
          {editing && <button type="button" className="btn" onClick={reset}>Cancelar</button>}
          <button type="submit" className="btn primary">{editing ? 'Salvar cartão' : 'Adicionar cartão'}</button>
        </div>
      </form>
      {error && <p className="backup-error" role="alert">{error}</p>}
      {pendingDelete && (
        <ConfirmDialog
          title="Excluir cartão?"
          description={`“${pendingDelete.name}” sai do app. As compras ligadas a ele viram gastos comuns e as faturas pagas deixam de existir.`}
          confirmLabel="Excluir"
          onCancel={() => setPendingDelete(null)}
          onConfirm={() => {
            onDelete(pendingDelete.id)
            if (editing?.id === pendingDelete.id) reset()
            setPendingDelete(null)
          }}
        />
      )}
    </section>
  )
}
