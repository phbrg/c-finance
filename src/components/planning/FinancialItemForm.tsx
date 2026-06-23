import { useState, type FormEvent } from 'react'
import { financialItemDraftSchema } from '../../schemas/financeSchema'
import type { FinancialItem, FinancialItemDraft, FinancialItemKind, Investment } from '../../types/finance'
import type { TransactionType } from '../../types/common'
import { parseCurrencyToCents } from '../../utils/currency'
import { currentMonth, today } from '../../utils/date'

interface FinancialItemFormProps {
  onSubmit: (draft: FinancialItemDraft) => boolean
  editingItem?: FinancialItem | null
  investments?: Investment[]
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
  investmentId: '',
}

export function FinancialItemForm({ onSubmit, editingItem, investments = [], onCancel }: FinancialItemFormProps) {
  const [form, setForm] = useState(() => editingItem ? formFromItem(editingItem) : initialForm)
  const [error, setError] = useState<string | null>(null)

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const result = financialItemDraftSchema.safeParse({
      title: form.title,
      type: form.type,
      kind: form.kind,
      amount: parseCurrencyToCents(form.amount) ?? 0,
      category: form.category,
      notes: form.notes || undefined,
      investmentId: form.type === 'expense' && form.investmentId ? form.investmentId : undefined,
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
    if (onSubmit(result.data)) {
      setForm({
        ...initialForm,
        type: form.type,
        kind: form.kind,
        startMonth: currentMonth(),
        dueDate: today(),
      })
      setError(null)
    }
  }

  return (
    <form id="financial-item-form" className={`workspace-card item-form ${editingItem ? 'editing' : ''}`} onSubmit={submit} noValidate>
      <div className="card-heading">
        <div><span className="overline">{editingItem ? 'Editando item' : 'Novo item'}</span><h2>{editingItem ? editingItem.title : 'Adicionar ao planejamento'}</h2><p>{editingItem ? 'Revise os dados e salve para atualizar suas projeções.' : 'Cadastre algo que entra ou sai do seu orçamento.'}</p></div>
        {editingItem && <span className="editing-badge">Modo edição</span>}
      </div>
      <div className="type-toggle" role="group" aria-label="Tipo financeiro">
        <button type="button" className={`income ${form.type === 'income' ? 'active' : ''}`} aria-label="Ganho" aria-pressed={form.type === 'income'} onClick={() => setForm({ ...form, type: 'income', investmentId: '' })}><span aria-hidden="true">＋</span><div><strong>Ganho</strong><small>Dinheiro que entra</small></div></button>
        <button type="button" className={`expense ${form.type === 'expense' ? 'active' : ''}`} aria-label="Gasto" aria-pressed={form.type === 'expense'} onClick={() => setForm({ ...form, type: 'expense' })}><span aria-hidden="true">−</span><div><strong>Gasto</strong><small>Dinheiro que sai</small></div></button>
      </div>
      <div className="kind-picker" role="group" aria-label="Frequência">
        <button type="button" className={form.kind === 'recurring' ? 'active' : ''} aria-label="Fixo mensal" aria-pressed={form.kind === 'recurring'} onClick={() => setForm({ ...form, kind: 'recurring' })}><span aria-hidden="true">↻</span><div><strong>Fixo mensal</strong><small>Repete todos os meses</small></div></button>
        <button type="button" className={form.kind === 'one-time' ? 'active' : ''} aria-label="Único" aria-pressed={form.kind === 'one-time'} onClick={() => setForm({ ...form, kind: 'one-time' })}><span aria-hidden="true">1×</span><div><strong>Único</strong><small>Acontece apenas uma vez</small></div></button>
      </div>
      <div className="form-grid">
        <label className="field wide"><span>Título</span><input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder={form.type === 'income' ? 'Ex.: Salário' : 'Ex.: Aluguel'} /></label>
        <label className="field"><span>Valor</span><div className="money-input"><span>R$</span><input inputMode="decimal" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} placeholder="0,00" /></div></label>
        <label className="field"><span>Categoria</span><input value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} placeholder="Ex.: Moradia" /></label>
        {form.kind === 'recurring' ? (
          <>
            <label className="field"><span>Dia do mês</span><input type="number" min="1" max="31" value={form.dayOfMonth} onChange={(event) => setForm({ ...form, dayOfMonth: event.target.value })} /></label>
            <label className="field"><span>Começa em</span><input type="month" value={form.startMonth} onChange={(event) => setForm({ ...form, startMonth: event.target.value })} /></label>
            <label className="field"><span>Termina em <em>opcional</em></span><input type="month" value={form.endMonth} onChange={(event) => setForm({ ...form, endMonth: event.target.value })} /></label>
          </>
        ) : (
          <label className="field"><span>Data prevista</span><input type="date" value={form.dueDate} onChange={(event) => setForm({ ...form, dueDate: event.target.value })} /></label>
        )}
        <label className="field wide"><span>Observação <em>opcional</em></span><input value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} placeholder="Algum detalhe importante" /></label>
        {form.type === 'expense' && investments.length > 0 && (
          <label className="field wide investment-link-field">
            <span>Vincular a investimento <em>opcional</em></span>
            <select value={form.investmentId} onChange={(event) => setForm({ ...form, investmentId: event.target.value })}>
              <option value="">Não vincular</option>
              {investments.map((investment) => <option key={investment.id} value={investment.id}>{investment.name} · {investment.institution}</option>)}
            </select>
            <small>O aporte mensal da aplicação será sincronizado com este gasto.</small>
          </label>
        )}
      </div>
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="form-actions">
        {editingItem && <button type="button" className="button-secondary" onClick={onCancel}>Cancelar</button>}
        <button type="submit" className="button-primary">{editingItem ? 'Salvar alterações' : 'Adicionar item'}</button>
      </div>
    </form>
  )
}

function formFromItem(item: FinancialItem): typeof initialForm {
  return {
    title: item.title,
    type: item.type,
    kind: item.kind,
    amount: (item.amount / 100).toFixed(2).replace('.', ','),
    category: item.category,
    dayOfMonth: String(item.recurrence?.dayOfMonth ?? new Date().getDate()),
    startMonth: item.recurrence?.startMonth ?? currentMonth(),
    endMonth: item.recurrence?.endMonth ?? '',
    dueDate: item.dueDate ?? today(),
    notes: item.notes ?? '',
    investmentId: item.investmentId ?? '',
  }
}
