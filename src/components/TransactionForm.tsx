import { useState, type FormEvent } from 'react'
import { transactionDraftSchema } from '../schemas/transactionSchema'
import type { TransactionDraft, TransactionType } from '../types/transaction'
import { parseCurrencyToCents } from '../utils/currency'
import { today } from '../utils/date'

interface TransactionFormProps {
  onSubmit: (draft: TransactionDraft) => boolean
}

type FormErrors = Partial<Record<'title' | 'amount' | 'paymentDate' | 'category' | 'notes' | 'installments', string>>

const initialForm = {
  title: '',
  type: 'expense' as TransactionType,
  amount: '',
  paymentDate: today(),
  category: '',
  notes: '',
  installments: '1',
}

export function TransactionForm({ onSubmit }: TransactionFormProps) {
  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState<FormErrors>({})

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const amount = parseCurrencyToCents(form.amount)
    const result = transactionDraftSchema.safeParse({
      ...form,
      amount: amount ?? 0,
      notes: form.notes || undefined,
      installments: form.type === 'expense' ? Number(form.installments) : undefined,
    })

    if (!result.success) {
      const nextErrors: FormErrors = {}
      for (const issue of result.error.issues) {
        const field = issue.path[0]
        if (typeof field === 'string' && !(field in nextErrors)) {
          nextErrors[field as keyof FormErrors] = issue.message
        }
      }
      setErrors(nextErrors)
      return
    }

    if (onSubmit(result.data)) {
      setForm({ ...initialForm, paymentDate: today() })
      setErrors({})
    }
  }

  return (
    <section className="panel xl:sticky xl:top-6" aria-labelledby="form-title">
      <p className="eyebrow">Novo lançamento</p>
      <h2 id="form-title" className="section-title">Cadastrar transação</h2>
      <form className="mt-6 space-y-4" onSubmit={handleSubmit} noValidate>
        <div className="type-toggle" role="group" aria-label="Tipo da transação">
          <button
            type="button"
            className={form.type === 'income' ? 'active income' : ''}
            aria-pressed={form.type === 'income'}
            onClick={() => setForm({ ...form, type: 'income', installments: '1' })}
          >
            Ganho
          </button>
          <button
            type="button"
            className={form.type === 'expense' ? 'active expense' : ''}
            aria-pressed={form.type === 'expense'}
            onClick={() => setForm({ ...form, type: 'expense' })}
          >
            Gasto
          </button>
        </div>

        <label className="field">
          <span>Título</span>
          <input value={form.title} maxLength={100} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Ex.: Supermercado" aria-invalid={Boolean(errors.title)} />
          {errors.title && <small role="alert">{errors.title}</small>}
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="field">
            <span>Valor total</span>
            <div className="money-input"><span>R$</span><input inputMode="decimal" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} placeholder="0,00" aria-invalid={Boolean(errors.amount)} /></div>
            {errors.amount && <small role="alert">{errors.amount}</small>}
          </label>
          <label className="field">
            <span>Data de pagamento</span>
            <input type="date" value={form.paymentDate} onChange={(event) => setForm({ ...form, paymentDate: event.target.value })} aria-invalid={Boolean(errors.paymentDate)} />
            {errors.paymentDate && <small role="alert">{errors.paymentDate}</small>}
          </label>
        </div>

        <div className={`grid gap-4 ${form.type === 'expense' ? 'sm:grid-cols-2' : ''}`}>
          <label className="field">
            <span>Categoria</span>
            <input list="categories" value={form.category} maxLength={60} onChange={(event) => setForm({ ...form, category: event.target.value })} placeholder="Ex.: Alimentação" aria-invalid={Boolean(errors.category)} />
            <datalist id="categories"><option value="Alimentação" /><option value="Casa" /><option value="Lazer" /><option value="Saúde" /><option value="Salário" /><option value="Transporte" /></datalist>
            {errors.category && <small role="alert">{errors.category}</small>}
          </label>
          {form.type === 'expense' && (
            <label className="field">
              <span>Parcelas</span>
              <input type="number" min="1" max="120" value={form.installments} onChange={(event) => setForm({ ...form, installments: event.target.value })} aria-invalid={Boolean(errors.installments)} />
              {errors.installments && <small role="alert">{errors.installments}</small>}
            </label>
          )}
        </div>

        <label className="field">
          <span>Observação <em>opcional</em></span>
          <textarea rows={3} maxLength={500} value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} placeholder="Detalhes que ajudem você a lembrar" />
          <span className="self-end text-xs text-slate-500">{form.notes.length}/500</span>
        </label>

        <button type="submit" className="button-primary w-full">Salvar transação</button>
        <p className="text-center text-xs leading-5 text-slate-500">Seus dados ficam somente neste navegador.</p>
      </form>
    </section>
  )
}
