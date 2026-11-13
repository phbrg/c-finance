import { useState, type FormEvent } from 'react'
import { financialItemDraftSchema } from '../../schemas/financeSchema'
import type { CreditCard, FinancialItem, FinancialItemDraft, FinancialItemKind } from '../../types/finance'
import type { TransactionType } from '../../types/common'
import { formatCurrency, parseCurrencyToCents } from '../../utils/currency'
import { currentMonth, today } from '../../utils/date'
import { monthLabel } from '../../utils/planning'
import { amountAt, splitInstallments } from '../../utils/recurrence'

export interface ItemSubmitOptions {
  amountFrom?: string
}

interface FinancialItemFormProps {
  onSubmit: (draft: FinancialItemDraft, options?: ItemSubmitOptions) => boolean
  editingItem?: FinancialItem | null
  categorySuggestions?: string[]
  cards?: CreditCard[]
  /** Month being viewed (YYYY-MM): amount changes on recurring items apply from it. */
  month?: string
  onCancel?: () => void
}

const initialForm = {
  title: '',
  type: 'expense' as TransactionType,
  kind: 'recurring' as FinancialItemKind,
  amount: '',
  category: '',
  dayOfMonth: String(new Date().getDate()),
  startMonth: currentMonth(),
  endMonth: '',
  dueDate: today(),
  notes: '',
  installments: '1',
  cardId: '',
}

export function FinancialItemForm({
  onSubmit,
  editingItem,
  categorySuggestions = [],
  cards = [],
  month = currentMonth(),
  onCancel,
}: FinancialItemFormProps) {
  const [form, setForm] = useState(() => editingItem ? formFromItem(editingItem, month) : initialForm)
  const [error, setError] = useState<string | null>(null)
  const [pendingDraft, setPendingDraft] = useState<FinancialItemDraft | null>(null)
  const isInstallment = form.type === 'expense' && form.kind === 'one-time'
  const amountCents = parseCurrencyToCents(form.amount)
  const installments = Number(form.installments)

  const save = (draft: FinancialItemDraft, options?: ItemSubmitOptions) => {
    if (!onSubmit(draft, options)) return
    setPendingDraft(null)
    if (editingItem) return
    setForm({ ...initialForm, type: form.type, kind: form.kind, startMonth: currentMonth(), dueDate: today() })
    setError(null)
  }

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const result = financialItemDraftSchema.safeParse({
      title: form.title,
      type: form.type,
      kind: form.kind,
      amount: amountCents ?? 0,
      category: form.category,
      notes: form.notes || undefined,
      cardId: form.type === 'expense' && form.cardId ? form.cardId : undefined,
      installments: isInstallment && installments > 1 ? installments : undefined,
      ...(form.kind === 'recurring'
        ? {
            dayOfMonth: Number(form.dayOfMonth),
            startMonth: form.startMonth,
            endMonth: form.endMonth || undefined,
          }
        : { dueDate: form.dueDate }),
    })
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? 'Revise os campos informados.')
      return
    }
    setError(null)
    const current = editingItem ? amountAt(editingItem, month) : 0
    if (editingItem && result.data.amount === current) {
      // Amount untouched: keep the stored base value so an item with past changes is not rewritten.
      save({ ...result.data, amount: editingItem.amount })
    } else if (editingItem?.kind === 'recurring' && result.data.kind === 'recurring' && editingItem.recurrence && editingItem.recurrence.startMonth < month) {
      setPendingDraft(result.data)
    } else {
      save(result.data)
    }
  }

  const changes = editingItem?.amountChanges ?? []

  return (
    <form className="pf-form" onSubmit={submit} noValidate>
      <div className="pf-head">
        <h2 id="financial-item-dialog-title">{editingItem ? editingItem.title : 'Novo item'}</h2>
        {onCancel && <button type="button" className="btn small ghost" aria-label="Fechar formulário" onClick={onCancel}>Fechar</button>}
      </div>

      <div className="chip-row" role="group" aria-label="Tipo">
        <button type="button" className="chip" aria-pressed={form.type === 'income'} onClick={() => setForm({ ...form, type: 'income', installments: '1', cardId: '' })}>Ganho</button>
        <button type="button" className="chip" aria-pressed={form.type === 'expense'} onClick={() => setForm({ ...form, type: 'expense' })}>Gasto</button>
      </div>
      <div className="chip-row" role="group" aria-label="Frequência">
        <button type="button" className="chip" aria-pressed={form.kind === 'recurring'} onClick={() => setForm({ ...form, kind: 'recurring' })}>Todo mês</button>
        <button type="button" className="chip" aria-pressed={form.kind === 'one-time'} onClick={() => setForm({ ...form, kind: 'one-time' })}>Uma vez</button>
      </div>

      <div className="pf-grid">
        <label className="field wide"><span>Título</span><input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder={form.type === 'income' ? 'Ex.: Salário' : 'Ex.: Aluguel'} /></label>
        <label className="field">
          <span>{isInstallment ? 'Valor total (R$)' : 'Valor (R$)'}</span>
          <input inputMode="decimal" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} placeholder="0,00" />
          {isInstallment && <small>Total da compra, não da parcela.</small>}
        </label>
        <label className="field">
          <span>Categoria</span>
          <input list="pf-categories" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} placeholder="Ex.: Moradia" />
          <datalist id="pf-categories">{categorySuggestions.map((category) => <option key={category} value={category} />)}</datalist>
        </label>
        {form.type === 'expense' && cards.length > 0 && (
          <label className="field">
            <span>Pago com</span>
            <select value={form.cardId} onChange={(event) => setForm({ ...form, cardId: event.target.value })}>
              <option value="">Dinheiro/Pix</option>
              {cards.map((card) => <option key={card.id} value={card.id}>{card.name}</option>)}
            </select>
          </label>
        )}
        {isInstallment && (
          <label className="field">
            <span>Parcelas</span>
            <input type="number" min="1" max="60" value={form.installments} onChange={(event) => setForm({ ...form, installments: event.target.value })} />
            {amountCents && installments > 1 && installments <= 60 && <small>{installments}x de {formatCurrency(splitInstallments(amountCents, installments)[0])}</small>}
          </label>
        )}
        {form.kind === 'recurring' ? (
          <>
            <label className="field"><span>Dia do mês</span><input type="number" min="1" max="31" value={form.dayOfMonth} onChange={(event) => setForm({ ...form, dayOfMonth: event.target.value })} /></label>
            <label className="field"><span>Começa em</span><input type="month" value={form.startMonth} onChange={(event) => setForm({ ...form, startMonth: event.target.value })} /></label>
            <label className="field"><span>Termina em (opcional)</span><input type="month" value={form.endMonth} onChange={(event) => setForm({ ...form, endMonth: event.target.value })} /></label>
          </>
        ) : (
          <label className="field"><span>Data</span><input type="date" value={form.dueDate} onChange={(event) => setForm({ ...form, dueDate: event.target.value })} /></label>
        )}
        <label className="field wide"><span>Observação (opcional)</span><input value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} /></label>
      </div>

      {changes.length > 0 && editingItem && (
        <section className="pf-history" aria-label="Histórico de valores">
          <h3>Histórico de valores</h3>
          <ul>
            <li><span>Desde {monthLabel(editingItem.recurrence?.startMonth ?? month)}</span><span className="money">{formatCurrency(editingItem.amount)}</span></li>
            {changes.map((change) => <li key={change.from}><span>A partir de {monthLabel(change.from)}</span><span className="money">{formatCurrency(change.amount)}</span></li>)}
          </ul>
        </section>
      )}

      {error && <p className="pf-error" role="alert">{error}</p>}
      <div className="pf-actions">
        {onCancel && <button type="button" className="btn" onClick={onCancel}>Cancelar</button>}
        <button type="submit" className="btn primary">{editingItem ? 'Salvar' : 'Adicionar'}</button>
      </div>

      {pendingDraft && (
        <div className="pf-ask" role="alertdialog" aria-labelledby="pf-ask-title" aria-describedby="pf-ask-text">
          <h3 id="pf-ask-title">Mudar o valor de {editingItem?.title}</h3>
          <p id="pf-ask-text">Este item já vale desde {monthLabel(editingItem?.recurrence?.startMonth ?? month)}. Os meses anteriores podem ficar como estão.</p>
          <div className="pf-actions">
            <button type="button" className="btn ghost" onClick={() => setPendingDraft(null)}>Voltar</button>
            <button type="button" className="btn" onClick={() => save(pendingDraft)}>Alterar todos os meses</button>
            <button type="button" className="btn primary" autoFocus onClick={() => save(pendingDraft, { amountFrom: month })}>Aplicar a partir de {monthLabel(month)}</button>
          </div>
        </div>
      )}
    </form>
  )
}

function formFromItem(item: FinancialItem, month: string): typeof initialForm {
  return {
    title: item.title,
    type: item.type,
    kind: item.kind,
    amount: (amountAt(item, month) / 100).toFixed(2).replace('.', ','),
    category: item.category,
    dayOfMonth: String(item.recurrence?.dayOfMonth ?? new Date().getDate()),
    startMonth: item.recurrence?.startMonth ?? currentMonth(),
    endMonth: item.recurrence?.endMonth ?? '',
    dueDate: item.dueDate ?? today(),
    notes: item.notes ?? '',
    installments: String(item.installments ?? 1),
    cardId: item.cardId ?? '',
  }
}
